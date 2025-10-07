import { Hono } from "hono";
import { getDb } from "../db";
import { createAuth } from "../utils/auth";
import type { AppEnv } from "../types";
import { chatMessagesTable, chatSessionSourcesTable, chatSessionsTable, sourcesTable } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { processAndEmbedDocument } from "../services/langchain.service";
// Import unpdf
import { getDocumentProxy , extractText} from "unpdf"
import {nanoid} from "nanoid" 
const sourceRoutes = new Hono<AppEnv>();

// POST /api/sources/upload - Upload a new source document
sourceRoutes.post("/upload", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const replaceSession = formData.get('replaceSession') as string; // Optional: session to replace
    
    if (!file) {
        return c.json({ error: "File is required" }, 400);
    }

    const fileExtension = file.name.split('.').pop() || 'pdf';
    const storageKey = `${session.user.id}/${nanoid()}.${fileExtension}`;
    
    const newSource = await db.insert(sourcesTable).values({
        userId: session.user.id,
        title: title || file.name,
        type: 'document',
        status: 'processing',
        storageKey: storageKey,
    }).returning().then(res => res[0]);

    // If replacing an existing session, add to it; otherwise create new
    let chatSessionId: string;
    
    if (replaceSession) {
        // Verify user owns this session
        const existingSession = await db.query.chatSessionsTable.findFirst({
            where: and(
                eq(chatSessionsTable.id, replaceSession),
                eq(chatSessionsTable.userId, session.user.id)
            )
        });
        
        if (existingSession) {
            chatSessionId = replaceSession;
            
            // Add message about new document
            await db.insert(chatMessagesTable).values({
                sessionId: chatSessionId,
                role: 'system',
                type: 'document_upload',
                content: { title: title || file.name, sourceId: newSource.id }
            });
        } else {
            // Create new session if session not found
            const newSession = await db.insert(chatSessionsTable).values({
                userId: session.user.id,
                title: title || file.name,
            }).returning().then(res => res[0]);
            
            chatSessionId = newSession.id;
            
            await db.insert(chatMessagesTable).values({
                sessionId: chatSessionId,
                role: 'system',
                type: 'document_upload',
                content: { title: title || file.name, sourceId: newSource.id }
            });
        }
    } else {
        // Create new session
        const newSession = await db.insert(chatSessionsTable).values({
            userId: session.user.id,
            title: title || file.name,
        }).returning().then(res => res[0]);
        
        chatSessionId = newSession.id;
        
        await db.insert(chatMessagesTable).values({
            sessionId: chatSessionId,
            role: 'system',
            type: 'document_upload',
            content: { title: title || file.name, sourceId: newSource.id }
        });
    }

    await db.insert(chatSessionSourcesTable).values({
        sessionId: chatSessionId,
        sourceId: newSource.id,
    });

    c.executionCtx.waitUntil((async () => {
        console.log(`[BACKGROUND] Starting processing for source: ${newSource.id}`);
        try {
            const buffer = await file.arrayBuffer();
            
            await c.env.R2_BUCKET.put(storageKey, buffer, {
                httpMetadata: { contentType: file.type },
            });
            
            const pdf = await getDocumentProxy(new Uint8Array(buffer));
            const { text } = await extractText(pdf, { mergePages: true });
            
            await processAndEmbedDocument(c.env, text, newSource.id, session.user.id!);
            
            await db.update(sourcesTable).set({ status: 'ready', rawContent: text })
                .where(eq(sourcesTable.id, newSource.id));

            await db.insert(chatMessagesTable).values({
                sessionId: chatSessionId,
                role: 'system',
                type: 'processing_complete',
                content: { sourceId: newSource.id }
            });

        } catch (error) {
            console.error(`[BACKGROUND] Failed to process document ${newSource.id}:`, error);
            await db.update(sourcesTable).set({ status: 'error' })
                .where(eq(sourcesTable.id, newSource.id));
        }
    })());

    return c.json({ source: newSource, sessionId: chatSessionId }, 202);
});

// GET /api/sources - Get all sources for the logged-in user
sourceRoutes.get("/", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const userSources = await db.select().from(sourcesTable).where(eq(sourcesTable.userId, session.user.id));
    return c.json(userSources);
});

// GET /api/sources/:sourceId - Get details for a single source
sourceRoutes.get("/:sourceId", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const { sourceId } = c.req.param();

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const source = await db.select().from(sourcesTable).where(
        and(
            eq(sourcesTable.id, sourceId),
            eq(sourcesTable.userId, session.user.id)
        )
    ).then(res => res[0]);

    if (!source) {
        return c.json({ error: "Source not found" }, 404);
    }

    return c.json(source);
});
sourceRoutes.get("/:sourceId/download", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const { sourceId } = c.req.param();

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    // 1. Verify the user owns this source document
    const source = await db.select().from(sourcesTable).where(
        and(
            eq(sourcesTable.id, sourceId),
            eq(sourcesTable.userId, session.user.id)
        )
    ).then(res => res[0]);

    if (!source || !source.storageKey) {
        return c.json({ error: "Source not found or file not available" }, 404);
    }

    // 2. Fetch the file object from R2
    const object = await c.env.R2_BUCKET.get(source.storageKey);

    if (object === null) {
        return c.json({ error: "File not found in storage" }, 404);
    }

    // 3. Set the necessary headers for the browser to download the file
    c.header('Content-Type', object.httpMetadata?.contentType || 'application/octet-stream');
    c.header('Content-Disposition', `attachment; filename="${source.title}"`);

    // 4. Stream the file body back to the client
    return new Response(object.body as any);
});
sourceRoutes.get("/:sourceId/status", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const { sourceId } = c.req.param();

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const source = await db.select({
        id: sourcesTable.id,
        status: sourcesTable.status
    }).from(sourcesTable).where(
        and(
            eq(sourcesTable.id, sourceId),
            eq(sourcesTable.userId, session.user.id)
        )
    ).then(res => res[0]);

    if (!source) {
        return c.json({ error: "Source not found" }, 404);
    }

    return c.json(source);
});
// POST /api/sources/text - Create a source from raw text
sourceRoutes.post("/text", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { content, title } = await c.req.json();

  if (!content) {
    return c.json({ error: "Content is required" }, 400);
  }
  
  // 1. Create the source record with type 'text_topic'
  const newSource = await db.insert(sourcesTable).values({
      userId: session.user.id,
      title: title || `Text Topic: ${content.substring(0, 40)}...`,
      type: 'text_topic',
      status: 'processing',
      rawContent: content, // Store the text directly
  }).returning().then(res => res[0]);

  // 2. Create a new chat session for this source
  const newSession = await db.insert(chatSessionsTable).values({
      userId: session.user.id,
      title: newSource.title,
  }).returning().then(res => res[0]);
  
  const chatSessionId = newSession.id;

  // Add a system message about the text topic
  await db.insert(chatMessagesTable).values({
      sessionId: chatSessionId,
      role: 'system',
      type: 'document_upload', // We can reuse this type
      content: { title: newSource.title, sourceId: newSource.id }
  });

  // Link source to the session
  await db.insert(chatSessionSourcesTable).values({
    sessionId: chatSessionId,
    sourceId: newSource.id,
  });

  // 3. Start the background processing
  c.executionCtx.waitUntil((async () => {
      console.log(`[BACKGROUND] Starting processing for text source: ${newSource.id}`);
      try {
          // The langchain service already accepts a string, so this is simple
          await processAndEmbedDocument(c.env, content, newSource.id, session.user.id!);
          
          await db.update(sourcesTable).set({ status: 'ready' })
              .where(eq(sourcesTable.id, newSource.id));

          // Add a "processing complete" message to the chat
          await db.insert(chatMessagesTable).values({
              sessionId: chatSessionId,
              role: 'system',
              type: 'processing_complete',
              content: { sourceId: newSource.id }
          });

      } catch (error) {
          console.error(`[BACKGROUND] Failed to process text source ${newSource.id}:`, error);
          await db.update(sourcesTable).set({ status: 'error' })
              .where(eq(sourcesTable.id, newSource.id));
      }
  })());

  return c.json({ source: newSource, sessionId: chatSessionId }, 202);
});

export default sourceRoutes;