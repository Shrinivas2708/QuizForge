import { Hono } from "hono";
import { getDb } from "../db";
import { createAuth } from "../utils/auth";
import type { AppEnv } from "../types";
import { chatSessionsTable, chatMessagesTable, sourcesTable, chatSessionSourcesTable, quizzesTable } from "../db/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { getRAGChatResponse } from "../services/langchain.service";
import { classifyIntent } from "../services/intent.service";

const chatRoutes = new Hono<AppEnv>();
chatRoutes.get("/sessions/history", async (c) => {
    console.log("Hello")
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const offset = (page - 1) * limit;
const sessions = await db.select({
        id: chatSessionsTable.id,
        title: chatSessionsTable.title,
    })
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, session.user.id))
    .orderBy(desc(chatSessionsTable.createdAt))
    .limit(limit)
    .offset(offset);
if(!sessions){
    return c.json({message:"No sessions"})
}
    return c.json(sessions);
    
});
// DELETE 
chatRoutes.delete("/:sessionId/delete" ,async (c)=>{
  const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const { sessionId } = c.req.param();

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }
    try {
         await db.delete(chatSessionSourcesTable).where(eq(chatSessionSourcesTable.sessionId, sessionId))
        c.json({message:"Deleted Chat successfully"},200)
    } catch (error) {
        c.json({error})
    }  
})
// GET /api/chat/sessions - Get all chat sessions for the user
chatRoutes.post("/sessions", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const { sourceId, title } = await c.req.json();
    if (!sourceId) return c.json({ error: "sourceId is required" }, 400);

    const newSession = await db.insert(chatSessionsTable).values({
        userId: session.user.id,
        title: title || "New Chat",
    }).returning().then(res => res[0]);

    await db.insert(chatSessionSourcesTable).values({
        sessionId: newSession.id,
        sourceId: sourceId,
    });
    await db.insert(chatMessagesTable).values([
        {
            sessionId: newSession.id,
            role: 'system',
            type: 'document_upload',
            content: { title: title || 'your file', sourceId: sourceId }
        },
        {
            sessionId: newSession.id,
            role: 'system',
            type: 'quiz_form',
            content: { sourceId: sourceId, title: title || 'your file' }
        }
    ]);

    return c.json(newSession, 201);
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

    // Get context for intent classification
    const sourceLinks = await db.select({ sourceId: chatSessionSourcesTable.sourceId })
        .from(chatSessionSourcesTable)
        .where(eq(chatSessionSourcesTable.sessionId, sessionId));
    
    const sourceIds = sourceLinks.map(link => link.sourceId);
    
    // Check if there's a quiz generated
    const existingQuiz = sourceIds.length > 0 
        ? await db.select().from(quizzesTable)
            .where(and(
                eq(quizzesTable.ownerId, session.user.id),
                eq(quizzesTable.sourceId, sourceIds[0])
            ))
            .then(res => res[0])
        : null;

    // Check document status
    const latestSource = sourceIds.length > 0
        ? await db.select().from(sourcesTable)
            .where(eq(sourcesTable.id, sourceIds[0]))
            .then(res => res[0])
        : null;

    // Classify user intent
    const intent = await classifyIntent(c.env, content, {
        hasDocument: sourceIds.length > 0,
        hasQuiz: !!existingQuiz,
        documentReady: latestSource?.status === 'ready',
    });

    // Save user message
    await db.insert(chatMessagesTable).values({ 
        sessionId, 
        role: "user", 
        type: "text",
        content: { text: content } 
    });

    let aiResponseContent: string;
    let aiResponseType: 'text' | 'quiz_config_prompt' = 'text';

    // Handle different intents
    switch (intent) {
        case 'greeting':
            aiResponseContent = "Hello! I'm here to help you generate quizzes from your documents. Upload a document to get started, or ask me anything!";
            break;

        case 'quiz_request':
            if (!latestSource || latestSource.status !== 'ready') {
                aiResponseContent = "Please wait for your document to finish processing before generating a quiz, or upload a new document.";
            } else {
                // Trigger quiz config UI
                aiResponseType = 'quiz_config_prompt';
                aiResponseContent = ''; // Will be handled by quiz_config_prompt message type
                
                await db.insert(chatMessagesTable).values({
                    sessionId,
                    role: 'assistant',
                    type: 'processing_complete',
                    content: { sourceId: latestSource.id }
                });
                
                return c.json({ success: true, intent });
            }
            break;

        case 'quiz_start':
            if (!existingQuiz) {
                aiResponseContent = "You haven't generated a quiz yet. Would you like me to create one for you?";
            } else {
                aiResponseContent = `Great! Your quiz "${existingQuiz.title}" is ready. Click the "Start Quiz" button above to begin.`;
            }
            break;

        case 'new_document':
            aiResponseContent = "To upload a new document, use the upload button in the sidebar. Once uploaded, I'll process it and we can generate a new quiz from it. Your current session will remain available in the history.";
            break;

        case 'platform_question':
            aiResponseContent = `I can help you with:
            
- **Upload documents** - PDF files containing study material
- **Generate quizzes** - Customizable difficulty and question count
- **Ask questions** - About your document's content
- **Take quizzes** - Test your knowledge
- **Share quizzes** - Create rooms for others to take your quiz

What would you like to do?`;
            break;

        case 'out_of_scope':
            aiResponseContent = "I'm specialized in helping you create and take quizzes from your documents. I can't help with that request, but I'd be happy to help you generate a quiz or answer questions about your uploaded content!";
            break;

        case 'content_question':
        default:
            if (sourceIds.length === 0) {
                aiResponseContent = "Please upload a document first so I can answer questions about its content.";
            } else {
                // Get recent chat history
                const recentMessages = await db.select().from(chatMessagesTable)
                    .where(eq(chatMessagesTable.sessionId, sessionId))
                    .orderBy(asc(chatMessagesTable.createdAt))
                    .limit(10);

                const chatHistory = recentMessages
                    .filter(msg => msg.type === 'text')
                    .map(msg => {
                        const content = msg.content as { text?: string };
                        return `${msg.role}: ${content.text || ''}`;
                    })
                    .join('\n');
                
                aiResponseContent = await getRAGChatResponse(
                    c.env, 
                    content, 
                    sourceIds, 
                    session.user.id, 
                    chatHistory
                );
            }
            break;
    }

   const aiMessage = await db.insert(chatMessagesTable).values({
    sessionId,
    role: "assistant",
    type: "text",
    content: { text: aiResponseContent },
}).returning().then(res => res[0]);

    return c.json(aiMessage);
});

// POST /api/chat/sessions/create - Create session from text input
chatRoutes.post("/sessions/create", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const { content, title } = await c.req.json();
    if (!content) return c.json({ error: "content is required" }, 400);

    const newSession = await db.insert(chatSessionsTable).values({
        userId: session.user.id,
        title: title || "New Conversation",
    }).returning().then(res => res[0]);

    await db.insert(chatMessagesTable).values({
        sessionId: newSession.id,
        role: 'user',
        type: 'text',
        content: { text: content }
    });

    return c.json(newSession, 201);
});
export default chatRoutes;