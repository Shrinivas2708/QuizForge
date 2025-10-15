// server/src/routes/submission.routes.ts - Improved version

import { Hono } from "hono";
import { getDb } from "../db";
import { createAuth } from "../utils/auth";
import type { AppEnv, DbInstance } from "../types";
import {
  submissionsTable,
  answersTable,
  proctoringEventsTable,
  questionsTable,
  roomsTable,
  participantsTable,
  quizzesTable,
} from "../db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const submissionRoutes = new Hono<AppEnv>();

const verifyParticipant = async (
  db: DbInstance,
  participantId: string,
  submissionId: string
) => {
  return await db.query.submissionsTable.findFirst({
    where: and(
      eq(submissionsTable.id, submissionId),
      eq(submissionsTable.participantId, participantId)
    ),
  });
};

// POST /api/submissions/start - Start a quiz attempt
submissionRoutes.post("/start", async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const auth = createAuth(c.env, db);
    const session = await auth.api.getSession({ headers: c.req.raw.headers });

    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { quizId } = await c.req.json();
    if (!quizId) {
      return c.json({ error: "quizId is required" }, 400);
    }

    const quiz = await db.query.quizzesTable.findFirst({
      where: eq(quizzesTable.id, quizId),
    });

    if (!quiz) {
      return c.json({ error: "Quiz not found" }, 404);
    }

    let room = await db.query.roomsTable.findFirst({
      where: and(
        eq(roomsTable.quizId, quizId),
        eq(roomsTable.name, `${quiz.title} (Single Player)`)
      ),
    });

    if (!room) {
      room = await db
        .insert(roomsTable)
        .values({
          quizId: quizId,
          name: `${quiz.title} (Single Player)`,
          shareableCode: nanoid(8),
        })
        .returning()
        .then((res) => res[0]);
    }

    if (!room) {
      return c.json({ error: "Failed to create or find a room for the quiz." }, 500);
    }
    const participant = await db
      .insert(participantsTable)
      .values({
        roomId: room.id,
        details: {
          name: session.user.name || "User",
          email: session.user.email,
          userId: session.user.id,
        },
      })
      .returning()
      .then((res) => res[0]);

    const existingSubmissions = await db.select().from(submissionsTable).where(and(eq(submissionsTable.participantId, participant.id), eq(submissionsTable.quizId, quizId)));
    const submission = await db.insert(submissionsTable).values({ participantId: participant.id, quizId, attemptNumber: existingSubmissions.length + 1 }).returning().then(res => res[0]);
    const questions = await db.select({ id: questionsTable.id, questionType: questionsTable.questionType, questionText: questionsTable.questionText, data: questionsTable.data }).from(questionsTable).where(eq(questionsTable.quizId, quizId));
    const questionsForParticipant = questions.map((q) => ({ ...q, data: { options: q.data.options } }));
    const priorDisqualifiedSubmission = await db.select({ id: submissionsTable.id }).from(submissionsTable).innerJoin(participantsTable, eq(submissionsTable.participantId, participantsTable.id)).where(and(eq(submissionsTable.quizId, quizId), sql`${participantsTable.details}->>'userId' = ${session.user.id}`, eq(submissionsTable.disqualified, true))).limit(1);

    if (priorDisqualifiedSubmission.length > 0) {
      return c.json({ error: "You have been disqualified from this quiz and cannot start a new attempt." }, 403);
    }

    return c.json({ submission, questions: questionsForParticipant }, 201);

  } catch (error) {
    console.error("Error starting submission:", error);
    return c.json({ error: "Failed to start submission" }, 500);
  }
});
// POST /api/submissions/:submissionId/answer - Submit an answer
submissionRoutes.post("/:submissionId/answer", async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const { submissionId } = c.req.param();
    const { questionId, givenAnswer, participantId } = await c.req.json();

    if (!questionId || !givenAnswer || !participantId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const submission = await verifyParticipant(db, participantId, submissionId);
    if (!submission) {
      return c.json({ error: "Submission not found or access denied" }, 404);
    }

    if (submission.completedAt) {
      return c.json(
        { error: "Cannot submit answer for completed submission" },
        400
      );
    }

    const question = await db.query.questionsTable.findFirst({
      where: eq(questionsTable.id, questionId),
    });

    if (!question) {
      return c.json({ error: "Question not found" }, 404);
    }

    const isCorrect = question.data.correctAnswer === givenAnswer;

    await db
      .insert(answersTable)
      .values({
        submissionId,
        questionId,
        givenAnswer,
        isCorrect,
      })
      .onConflictDoUpdate({
        target: [answersTable.submissionId, answersTable.questionId],
        set: { givenAnswer, isCorrect },
      });

    return c.json({ success: true, isCorrect });
  } catch (error) {
    console.error("Error submitting answer:", error);
    return c.json({ error: "Failed to submit answer" }, 500);
  }
});

// POST /api/submissions/:submissionId/finish - Finish the quiz
submissionRoutes.post("/:submissionId/finish", async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const { submissionId } = c.req.param();
    const { participantId } = await c.req.json();

    if (!participantId) {
      return c.json({ error: "participantId is required" }, 400);
    }

    const submission = await verifyParticipant(db, participantId, submissionId);
    if (!submission) {
      return c.json({ error: "Submission not found or access denied" }, 404);
    }

    if (submission.completedAt) {
      return c.json({ error: "Submission already completed" }, 400);
    }

    const [{ count: correctAnswersCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(answersTable)
      .where(
        and(
          eq(answersTable.submissionId, submissionId),
          eq(answersTable.isCorrect, true)
        )
      );

    const [{ count: totalQuestionsCount }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(questionsTable)
      .where(eq(questionsTable.quizId, submission.quizId));

    const finalScore =
      totalQuestionsCount > 0
        ? Math.round(
            (Number(correctAnswersCount) / Number(totalQuestionsCount)) * 100
          )
        : 0;

    const completedAt = new Date();
    const durationSeconds = Math.round(
      (completedAt.getTime() - new Date(submission.startedAt!).getTime()) / 1000
    );

    const [updatedSubmission] = await db
      .update(submissionsTable)
      .set({
        finalScore,
        completedAt,
        durationSeconds,
        finished: true,
      })
      .where(eq(submissionsTable.id, submissionId))
      .returning();

    return c.json(updatedSubmission);
  } catch (error) {
    console.error("Error finishing submission:", error);
    return c.json({ error: "Failed to finish submission" }, 500);
  }
});

// GET /api/submissions/:submissionId/results - Get results
submissionRoutes.get("/:submissionId/results", async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const { submissionId } = c.req.param();

    const submission = await db.query.submissionsTable.findFirst({
      where: eq(submissionsTable.id, submissionId),
    });

    if (!submission || !submission.completedAt) {
      return c.json(
        { error: "Submission not found or not yet completed" },
        404
      );
    } 
    const allQuestions = await db.query.questionsTable.findMany({
      where: eq(questionsTable.quizId, submission.quizId),
      columns: {
        id: true,
        questionText: true,
        feedback: true,
        data: true,
      },
    })

    const submittedAnswers = await db.query.answersTable.findMany({
      where: eq(answersTable.submissionId, submissionId),
    }); 
    const answersMap = new Map(
      submittedAnswers.map((ans) => [ans.questionId, ans])
    ); 
    const resultsWithUnattempted = allQuestions.map((question) => {
      const answer = answersMap.get(question.id);
      return {
        question: question,
        ...(answer || {
          questionId: question.id,
          givenAnswer: null,
          isCorrect: false,
        }),
      };
    });

    return c.json({ ...submission, answers: resultsWithUnattempted });
  } catch (error) {
    console.error("Error fetching results:", error);
    return c.json({ error: "Failed to fetch results" }, 500);
  }
});

// POST /api/submissions/:submissionId/proctoring - Log proctoring event
submissionRoutes.post("/:submissionId/proctoring", async (c) => {
  try {
    const db = getDb(c.env.DATABASE_URL);
    const { submissionId } = c.req.param();
    const { eventType, details, participantId } = await c.req.json();

    if (!eventType || !participantId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const submission = await verifyParticipant(db, participantId, submissionId);
    if (!submission || submission.finished) {
      return c.json(
        { error: "Submission not found or already completed" },
        404
      );
    }

    await db
      .insert(proctoringEventsTable)
      .values({ submissionId, eventType, details });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(proctoringEventsTable)
      .where(eq(proctoringEventsTable.submissionId, submissionId));

    // 3. Get the quiz's event limit
    const quiz = await db.query.quizzesTable.findFirst({
      where: eq(quizzesTable.id, submission.quizId),
      columns: { proctoringSettings: true },
    });
    const eventLimit = quiz?.proctoringSettings?.eventLimit || 5;
    if (count >= eventLimit) {
      const reason = `Exceeded proctoring event limit of ${eventLimit}.`;

      await db
        .update(submissionsTable)
        .set({
          disqualified: true,
          disqualificationReason: reason,
          finished: true,
          completedAt: new Date(),
          finalScore: 0,
        })
        .where(eq(submissionsTable.id, submissionId));

      return c.json({ disqualified: true, reason });
    }

    return c.json({ disqualified: false, currentCount: count });
  } catch (error) {
    console.error("Error logging proctoring event:", error);
    return c.json({ error: "Failed to log proctoring event" }, 500);
  }
});
// GET /api/submissions/:submissionId/proctoring-events - Get proctoring events
submissionRoutes.get("/:submissionId/proctoring-events", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { submissionId } = c.req.param();
  
  const events = await db.query.proctoringEventsTable.findMany({
    where: eq(proctoringEventsTable.submissionId, submissionId),
    orderBy: (events, { asc }) => [asc(events.timestamp)],
  });
  
  return c.json(events);
});
export default submissionRoutes;
