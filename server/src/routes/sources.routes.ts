import { Hono } from "hono";
import { getDb } from "../db";
import { createAuth } from "../utils/auth";
import type { AppEnv } from "../types";
import { sourcesTable } from "../db/schema";
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
    console.log(file);
    
    if (!file) {
        return c.json({ error: "File is required" }, 400);
    }

    // 👇 1. Generate a unique key for the file in R2
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const storageKey = `${session.user.id}/${nanoid()}.${fileExtension}`;
    
    // 👇 2. Insert the storageKey into the database immediately
    const newSource = await db.insert(sourcesTable).values({
        userId: session.user.id,
        title: title || file.name,
        type: 'document',
        status: 'processing',
        storageKey: storageKey, // Save the key
    }).returning().then(res => res[0]);
    
    c.executionCtx.waitUntil((async () => {
        console.log(`[BACKGROUND] Starting processing for source: ${newSource.id}`);
        try {
            const buffer = await file.arrayBuffer();
            
            // 👇 3. Upload the original file to R2
            console.log(`[BACKGROUND] Uploading file to R2 with key: ${storageKey}`);
            await c.env.R2_BUCKET.put(storageKey, buffer, {
                httpMetadata: { contentType: file.type },
            });
            console.log("[BACKGROUND] File successfully uploaded to R2.");

            // Continue with PDF processing...
            const pdf = await getDocumentProxy(new Uint8Array(buffer));
            const { text } = await extractText(pdf, { mergePages: true });
            
            console.log("[BACKGROUND] PDF text extracted, starting embedding...");
            await processAndEmbedDocument(c.env, text, newSource.id, session.user.id!);
            console.log("[BACKGROUND] Embedding complete.");
            
            await db.update(sourcesTable).set({ status: 'ready', rawContent: text })
                .where(eq(sourcesTable.id, newSource.id));
            console.log(`[BACKGROUND] Source status updated to 'ready' for source: ${newSource.id}`);

        } catch (error) {
            console.error(`[BACKGROUND] Failed to process document ${newSource.id}:`, error);
            await db.update(sourcesTable).set({ status: 'error' })
                .where(eq(sourcesTable.id, newSource.id));
        }
    })());

    return c.json(newSource, 202);
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

export default sourceRoutes;