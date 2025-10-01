import { Hono } from "hono";
import { getDb } from "../db";
import type { AppEnv, DbInstance } from "../types";
import { submissionsTable, answersTable, proctoringEventsTable, questionsTable } from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { createAuth } from "../utils/auth";

const submissionRoutes = new Hono<AppEnv>();

// A helper to verify that the submission belongs to the participant making the request.
// In a real app, this would be done by decoding a JWT.
const verifyParticipant = async (db :DbInstance, participantId:string, submissionId :string) => {
    return await db.query.submissionsTable.findFirst({
        where: and(eq(submissionsTable.id, submissionId), eq(submissionsTable.participantId, participantId))
    });
};

// POST /api/submissions/start - Start a quiz attempt
submissionRoutes.post("/start", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { participantId, quizId } = await c.req.json();

    if (!participantId || !quizId) {
        return c.json({ error: "participantId and quizId are required" }, 400);
    }

    const existingSubmissions = await db.select().from(submissionsTable).where(
        and(eq(submissionsTable.participantId, participantId), eq(submissionsTable.quizId, quizId))
    );

    const submission = await db.insert(submissionsTable).values({
        participantId,
        quizId,
        attemptNumber: existingSubmissions.length + 1,
    }).returning().then(res => res[0]);

    const questions = await db.select({
        id: questionsTable.id,
        questionType: questionsTable.questionType,
        questionText: questionsTable.questionText,
        data: questionsTable.data, // This contains options but also the correct answer
    }).from(questionsTable).where(eq(questionsTable.quizId, quizId));

    // Omit correctAnswer from the data sent to the client
    const questionsForParticipant = questions.map(q => ({
        ...q,
        data: { options: q.data.options }
    }));
    
    return c.json({ submission, questions: questionsForParticipant }, 201);
});

// POST /api/submissions/:submissionId/answer - Submit an answer
submissionRoutes.post("/:submissionId/answer", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { submissionId } = c.req.param();
    const { questionId, givenAnswer, participantId } = await c.req.json();
    
    const submission = await verifyParticipant(db, participantId, submissionId);
    if (!submission) return c.json({ error: "Submission not found or access denied" }, 404);

    const question = await db.query.questionsTable.findFirst({ where: eq(questionsTable.id, questionId) });
    if (!question) return c.json({ error: "Question not found" }, 404);

    const isCorrect = question.data.correctAnswer === givenAnswer;

    await db.insert(answersTable).values({
        submissionId,
        questionId,
        givenAnswer,
        isCorrect,
    }).onConflictDoUpdate({
        target: [answersTable.submissionId, answersTable.questionId],
        set: { givenAnswer, isCorrect }
    });

    return c.json({ success: true, isCorrect });
});

// POST /api/submissions/:submissionId/finish - Finish the quiz
submissionRoutes.post("/:submissionId/finish", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { submissionId } = c.req.param();
    const { participantId } = await c.req.json();

    const submission = await verifyParticipant(db, participantId, submissionId);
    if (!submission) return c.json({ error: "Submission not found or access denied" }, 404);
    if (submission.completedAt) return c.json({ error: "Submission already completed" }, 400);

    const [{ count: correctAnswersCount }] = await db.select({
        count: sql<number>`count(*)`
    }).from(answersTable).where(and(eq(answersTable.submissionId, submissionId), eq(answersTable.isCorrect, true)));

    const [{ count: totalQuestionsCount }] = await db.select({
        count: sql<number>`count(*)`
    }).from(questionsTable).where(eq(questionsTable.quizId, submission.quizId));

    const finalScore = totalQuestionsCount > 0 ? Math.round((correctAnswersCount / totalQuestionsCount) * 100) : 0;
    
    const completedAt = new Date();
    const durationSeconds = Math.round((completedAt.getTime() - new Date(submission.startedAt!).getTime()) / 1000);

    const updatedSubmission = await db.update(submissionsTable).set({
        finalScore,
        completedAt,
        durationSeconds,
    }).where(eq(submissionsTable.id, submissionId)).returning().then(res => res[0]);

    return c.json(updatedSubmission);
});

// GET /api/submissions/:submissionId/results - Get results for a submission
submissionRoutes.get("/:submissionId/results", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { submissionId } = c.req.param();
    // In a real app, authenticate the participant here
    
    const submission = await db.query.submissionsTable.findFirst({
        where: eq(submissionsTable.id, submissionId),
    });

    if (!submission || !submission.completedAt) {
        return c.json({ error: "Submission not found or not yet completed" }, 404);
    }

    const answers = await db.query.answersTable.findMany({
        where: eq(answersTable.submissionId, submissionId),
        with: {
            question: {
                columns: {
                    questionText: true,
                    feedback: true,
                    data: true // Includes correct answer for review
                }
            },
        }
    });

    return c.json({ ...submission, answers });
});


// POST /api/submissions/:submissionId/proctoring - Log a proctoring event
submissionRoutes.post("/:submissionId/proctoring", async (c) => {
    const db = getDb(c.env.DATABASE_URL);
    const { submissionId } = c.req.param();
    const { eventType, details, participantId } = await c.req.json();

    const submission = await verifyParticipant(db, participantId, submissionId);
    if (!submission) return c.json({ error: "Submission not found or access denied" }, 404);

    const event = await db.insert(proctoringEventsTable).values({
        submissionId,
        eventType,
        details,
    }).returning().then(res => res[0]);

    return c.json(event, 201);
});

export default submissionRoutes;