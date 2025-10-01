import { Hono } from "hono";
import { getDb } from "../db";
import { createAuth } from "../utils/auth";
import type { AppEnv } from "../types";
import { quizzesTable, questionsTable, sourcesTable } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { generateQuizFromContent } from "../services/langchain.service";

const quizRoutes = new Hono<AppEnv>();

// POST /api/quizzes - Generate a new quiz
quizRoutes.post("/", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const { sourceId, config, title } = await c.req.json();

    if (!sourceId || !config || !title) {
        return c.json({ error: "Missing required fields: sourceId, config, title" }, 400);
    }

    const source = await db.select().from(sourcesTable).where(eq(sourcesTable.id, sourceId)).then(res => res[0]);

    if (!source || source.userId !== session.user.id) {
        return c.json({ error: "Source not found or access denied" }, 404);
    }

    if (!source.rawContent) {
        return c.json({ error: "Source content is not ready or is empty" }, 400);
    }

    const generatedQuestions = await generateQuizFromContent(c.env,source.rawContent, config);

    const newQuiz = await db.insert(quizzesTable).values({
        ownerId: session.user.id,
        sourceId,
        title,
        config,
    }).returning().then(res => res[0]);

    const questionsToInsert = generatedQuestions.map(q => ({
        quizId: newQuiz.id,
        questionType: q.questionType,
        questionText: q.questionText,
        data: q.data,
        feedback: q.feedback,
    }));

    if (questionsToInsert.length > 0) {
        await db.insert(questionsTable).values(questionsToInsert);
    }

    return c.json({ ...newQuiz, questions: questionsToInsert }, 201);
});

// GET /api/quizzes - Get all quizzes for the logged-in user
quizRoutes.get("/", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const userQuizzes = await db.select().from(quizzesTable).where(eq(quizzesTable.ownerId, session.user.id));
    return c.json(userQuizzes);
});

// GET /api/quizzes/:quizId - Get a specific quiz with its questions
quizRoutes.get("/:quizId", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    const { quizId } = c.req.param();

    if (!session?.user?.id) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const quiz = await db.select().from(quizzesTable).where(
        and(
            eq(quizzesTable.id, quizId),
            eq(quizzesTable.ownerId, session.user.id)
        )
    ).then(res => res[0]);

    if (!quiz) {
        return c.json({ error: "Quiz not found" }, 404);
    }

    const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, quizId));
    
    return c.json({ ...quiz, questions });
});

export default quizRoutes;