import { Hono } from "hono";
import { getDb } from "../db";
import { createAuth } from "../utils/auth";
import type { AppEnv } from "../types";
import { chatSessionsTable, chatMessagesTable, sourcesTable, chatSessionSourcesTable } from "../db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { getRAGChatResponse } from "../services/langchain.service";

const chatRoutes = new Hono<AppEnv>();

// GET /api/chat/sessions - Get all chat sessions for the user
chatRoutes.get("/sessions", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const sessions = await db.select().from(chatSessionsTable).where(eq(chatSessionsTable.userId, session.user.id));
    return c.json(sessions);
});


// GET /api/chat/sessions/:sessionId - Get messages for a session
chatRoutes.get("/sessions/:sessionId", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const { sessionId } = c.req.param();

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const chatSession = await db.query.chatSessionsTable.findFirst({
        where: and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, session.user.id))
    });
    if (!chatSession) return c.json({ error: "Chat session not found" }, 404);

    const messages = await db.select().from(chatMessagesTable)
        .where(eq(chatMessagesTable.sessionId, sessionId))
        .orderBy(desc(chatMessagesTable.createdAt));
        
    return c.json(messages);
});
chatRoutes.post("/sessions", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const { sourceId, title } = await c.req.json();
    if (!sourceId) return c.json({ error: "sourceId is required" }, 400);

    // Create the chat session
    const newSession = await db.insert(chatSessionsTable).values({
        userId: session.user.id,
        title: title || "New Chat",
    }).returning().then(res => res[0]);

    // Link the initial source to the new session
    await db.insert(chatSessionSourcesTable).values({
        sessionId: newSession.id,
        sourceId: sourceId,
    });

    return c.json(newSession, 201);
});

// NEW: POST /api/chat/sessions/:sessionId/sources - Add a new document to an existing chat
chatRoutes.post("/sessions/:sessionId/sources", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const { sessionId } = c.req.param();
    const { sourceId } = await c.req.json();

    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);
    if (!sourceId) return c.json({ error: "sourceId is required" }, 400);

    // Verify user owns the chat session and the source
    const chatSession = await db.query.chatSessionsTable.findFirst({
        where: and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, session.user.id))
    });
    const source = await db.query.sourcesTable.findFirst({
        where: and(eq(sourcesTable.id, sourceId), eq(sourcesTable.userId, session.user.id))
    });

    if (!chatSession || !source) {
        return c.json({ error: "Chat session or source not found" }, 404);
    }

    // Add the new link
    await db.insert(chatSessionSourcesTable).values({ sessionId, sourceId })
        .onConflictDoNothing(); // Prevent duplicates

    return c.json({ message: "Source added to chat session successfully." });
});

// MODIFIED: POST /api/chat/sessions/:sessionId/message - Now with chat history and multi-doc context
chatRoutes.post("/sessions/:sessionId/message", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const { sessionId } = c.req.param();
    const { content } = await c.req.json();

    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session?.user?.id) return c.json({ error: "Unauthorized" }, 401);

    const chatSession = await db.query.chatSessionsTable.findFirst({
        where: and(eq(chatSessionsTable.id, sessionId), eq(chatSessionsTable.userId, session.user.id))
    });
    if (!chatSession) return c.json({ error: "Chat session not found" }, 404);

    // 1. Fetch all source IDs linked to this session
    const sourceLinks = await db.select({ sourceId: chatSessionSourcesTable.sourceId }).from(chatSessionSourcesTable)
        .where(eq(chatSessionSourcesTable.sessionId, sessionId));
    
    if (sourceLinks.length === 0) return c.json({ error: "No sources linked to this chat session" }, 400);
    const sourceIds = sourceLinks.map(link => link.sourceId);

    // 2. Fetch recent chat history
    const recentMessages = await db.select().from(chatMessagesTable)
        .where(eq(chatMessagesTable.sessionId, sessionId))
        .orderBy(asc(chatMessagesTable.createdAt))
        .limit(10); // Get last 10 messages for context

    const chatHistory = recentMessages.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    
    // Save user message
    await db.insert(chatMessagesTable).values({ sessionId, role: "user", content });

    // 3. Get AI response using multiple sources and history
    const aiResponseContent = await getRAGChatResponse(c.env, content, sourceIds, session.user.id, chatHistory);

    const aiMessage = await db.insert(chatMessagesTable).values({
        sessionId,
        role: "assistant",
        content: aiResponseContent,
    }).returning().then(res => res[0]);

    return c.json(aiMessage);
});


export default chatRoutes;