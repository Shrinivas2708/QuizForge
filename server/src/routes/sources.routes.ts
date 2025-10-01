import { Hono } from "hono";
import { getDb } from "../db";
import { createAuth } from "../utils/auth";
import type { AppEnv } from "../types";
import { sourcesTable } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { processAndEmbedDocument } from "../services/langchain.service";
// Import unpdf
import { getDocumentProxy , extractText} from "unpdf"
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

    if (!file) {
        return c.json({ error: "File is required" }, 400);
    }
    
    const newSource = await db.insert(sourcesTable).values({
        userId: session.user.id,
        title: title || file.name,
        type: 'document',
        status: 'processing'
    }).returning().then(res => res[0]);
    
    // --- START FIX ---
    // Wrap the async background task in c.executionCtx.waitUntil()
    c.executionCtx.waitUntil((async () => {
        console.log("Starting background processing for source:", newSource.id);
        try {
            const buffer = await file.arrayBuffer();
            
            const pdf = await getDocumentProxy(new Uint8Array(buffer));
            const { text } = await extractText(pdf, { mergePages: true });
            console.log("Text from pdf:" , text);
            
            console.log("PDF text extracted, starting embedding...");
            const embedDocRes = await processAndEmbedDocument(c.env,text, newSource.id, session.user.id!);
            console.log("Embedding complete.");
            
            await db.update(sourcesTable).set({ status: 'ready', rawContent: text })
                .where(eq(sourcesTable.id, newSource.id));
            console.log("Source status updated to 'ready' for source:", newSource.id);

        } catch (error) {
            console.error(`Failed to process document ${newSource.id}:`, error);
            await db.update(sourcesTable).set({ status: 'error' })
                .where(eq(sourcesTable.id, newSource.id));
        }
    })());
    // --- END FIX ---

    return c.json(newSource, 202); // 202 Accepted, processing in background
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

export default sourceRoutes;