import { Hono } from "hono";
import { getDb } from "../db";
import { createAuth } from "../utils/auth";
import type { AppEnv } from "../types";
import {
  roomsTable,
  quizzesTable,
  participantsTable,
  submissionsTable,
  questionsTable,
} from "../db/schema";
import { nanoid } from "nanoid";
import { eq, and, desc, sql, not, inArray } from "drizzle-orm";

const roomRoutes = new Hono<AppEnv>();

// GET /api/rooms/getAllRooms - Get all the rooms for a user (owner only)
roomRoutes.get("/getAllRooms", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const roomsWithParticipantCount = await db
    .select({
      id: roomsTable.id,
      name: roomsTable.name,
      shareableCode: roomsTable.shareableCode,
      createdAt: roomsTable.createdAt,
      quizTitle: quizzesTable.title,
      timeLimit: roomsTable.timeLimitSeconds,
      participantCount: sql<number>`count(${participantsTable.id})`.mapWith(Number),
    })
    .from(roomsTable)
    .innerJoin(quizzesTable, eq(roomsTable.quizId, quizzesTable.id))
    .leftJoin(participantsTable, eq(roomsTable.id, participantsTable.roomId))
    .where(and(
      eq(quizzesTable.ownerId, session.user.id),
      not(sql`${roomsTable.name} LIKE '%(Single Player)%'`)
    ))
    .groupBy(roomsTable.id, quizzesTable.title)
    .orderBy(desc(roomsTable.createdAt));

  return c.json(roomsWithParticipantCount);
});

// POST /api/rooms - Create a new room from a quiz
roomRoutes.post("/", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session?.user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const { quizId, timeLimitSeconds, proctoringLevel, participantFields, name } =
    await c.req.json();

  if (!Array.isArray(participantFields) || participantFields.length === 0) {
    return c.json(
      { error: "participantFields must be a non-empty array of strings." },
      400
    );
  }

  const newRoom = await db
    .insert(roomsTable)
    .values({
      quizId,
      name,
      shareableCode: nanoid(8),
      timeLimitSeconds,
      proctoringLevel,
      participantFields,
    })
    .returning()
    .then((res) => res[0]);

  return c.json(newRoom, 201);
});

// GET /api/rooms/:shareableCode - Get public room details before joining
roomRoutes.get("/:shareableCode", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { shareableCode } = c.req.param();

  const roomDetails = await db
    .select({
      title: quizzesTable.title,
      participantInfoRequired: roomsTable.participantFields,
    })
    .from(roomsTable)
    .innerJoin(quizzesTable, eq(roomsTable.quizId, quizzesTable.id))
    .where(
      and(
        eq(roomsTable.shareableCode, shareableCode),
        eq(roomsTable.isOpen, true)
      )
    )
    .then((res) => res[0]);

  if (!roomDetails) {
    return c.json({ error: "Room not found or is closed" }, 404);
  }

  return c.json(roomDetails);
});

// POST /api/rooms/:shareableCode/join - Join a room
roomRoutes.post("/:shareableCode/join", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { shareableCode } = c.req.param();
  const { details } = await c.req.json<{ details: Record<string, string> }>();

  if (!details || typeof details !== "object") {
    return c.json({ error: "Participant 'details' must be an object." }, 400);
  }

  const room = await db.query.roomsTable.findFirst({
    where: eq(roomsTable.shareableCode, shareableCode),
  });
  if (!room) return c.json({ message: "No room!" }, 400);
  const createdAt = new Date(room.createdAt!);
  const expiryTime = createdAt.getTime() + room.timeLimitSeconds * 1000;
  if (Date.now() > expiryTime) {
      return c.json({ error: "This room has expired." }, 403);
  }
  for (const field of room.participantFields) {
    if (!details[field]) {
      return c.json({ error: `Missing required field: '${field}'` }, 400);
    }
  }

  const participant = await db
    .insert(participantsTable)
    .values({
      roomId: room.id,
      details,
    })
    .returning()
    .then((res) => res[0]);

  return c.json({
    participantId: participant.id,
    roomId: room.id,
    message: "Successfully joined the room.",
  });
});

// GET /api/rooms/:roomId/results - Get results for a room (owner only)
roomRoutes.get("/:roomId/results", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const { roomId } = c.req.param();

  if (!session?.user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const room = await db.query.roomsTable.findFirst({
    where: eq(roomsTable.id, roomId),
    with: {
      quiz: true
    }
  });

  if (!room || room.quiz.ownerId !== session.user.id) {
    return c.json({ error: "Room not found or you are not the owner" }, 404);
  }

  const roomParticipants = await db
    .select({ id: participantsTable.id })
    .from(participantsTable)
    .where(eq(participantsTable.roomId, roomId));

  const participantIds = roomParticipants.map(p => p.id);

  if (participantIds.length === 0) {
    return c.json([]);
  }

  const submissions = await db.query.submissionsTable.findMany({
    where: and(
      eq(submissionsTable.quizId, room.quizId),
      inArray(submissionsTable.participantId, participantIds)
    ),
    with: {
      participant: {
        columns: {
          id: true,
          details: true,
          joinedAt: true,
        },
      },
    },
    columns: {
      id: true,
      finalScore: true,
      startedAt: true,
      completedAt: true,
      disqualified: true,
    },
  });

  return c.json(submissions);
});

// GET /api/rooms/:roomId/analytics - Get analytics for a room (owner only)
roomRoutes.get("/:roomId/analytics", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  const { roomId } = c.req.param();

  if (!session?.user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const room = await db.query.roomsTable.findFirst({
    where: eq(roomsTable.id, roomId),
    with: {
      quiz: true
    }
  });

  if (!room || !room.quiz || room.quiz.ownerId !== session.user.id) {
    return c.json({ error: "Room not found or you are not the owner" }, 404);
  }

  const roomParticipants = await db
    .select({ id: participantsTable.id })
    .from(participantsTable)
    .where(eq(participantsTable.roomId, roomId));

  const participantIds = roomParticipants.map(p => p.id);

  if (participantIds.length === 0) {
    return c.json({
      room,
      averageScore: 0,
      participants: [],
      submissions: [],
    });
  }

  const submissions = await db.query.submissionsTable.findMany({
    where: and(
      eq(submissionsTable.quizId, room.quizId),
      inArray(submissionsTable.participantId, participantIds)
    ),
    with: {
      participant: {
        columns: {
          id: true,
          details: true,
          joinedAt: true,
        },
      },
    },
    columns: {
      id: true,
      finalScore: true,
      startedAt: true,
      completedAt: true,
      disqualified: true,
      durationSeconds: true,
    },
  });

  const averageScore = submissions.length > 0
    ? submissions.reduce((acc, sub) => acc + (sub.finalScore || 0), 0) / submissions.length
    : 0;

  return c.json({
    room,
    averageScore: parseFloat(averageScore.toFixed(2)),
    participants: submissions.map(s => s.participant),
    submissions,
  });
});

// POST /api/rooms/:shareableCode/start - Start a quiz in a room
roomRoutes.post("/:shareableCode/start", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const { shareableCode } = c.req.param();
  const { participantId } = await c.req.json();

  if (!participantId) {
    return c.json({ error: "Participant ID is required" }, 400);
  }

  const room = await db.query.roomsTable.findFirst({
    where: eq(roomsTable.shareableCode, shareableCode),
  });

  if (!room) {
    return c.json({ error: "Room not found" }, 404);
  }
  const createdAt = new Date(room.createdAt!);
  const expiryTime = createdAt.getTime() + room.timeLimitSeconds * 1000;
  if (Date.now() > expiryTime) {
      return c.json({ error: "This room has expired and you can no longer start the quiz." }, 403);
  }


  const participant = await db.query.participantsTable.findFirst({
    where: and(
      eq(participantsTable.id, participantId),
      eq(participantsTable.roomId, room.id)
    ),
  });

  if (!participant) {
    return c.json({ error: "Invalid participant for this room" }, 403);
  }

  const priorDisqualifiedSubmission = await db
    .select({ id: submissionsTable.id })
    .from(submissionsTable)
    .where(and(
      eq(submissionsTable.participantId, participantId),
      eq(submissionsTable.quizId, room.quizId),
      eq(submissionsTable.disqualified, true)
    ))
    .limit(1);

  if (priorDisqualifiedSubmission.length > 0) {
    return c.json({ 
      error: "You have been disqualified and cannot start a new attempt." 
    }, 403);
  }

  const existingSubmissions = await db
    .select()
    .from(submissionsTable)
    .where(eq(submissionsTable.participantId, participant.id));

  const submission = await db
    .insert(submissionsTable)
    .values({
      participantId: participant.id,
      quizId: room.quizId,
      attemptNumber: existingSubmissions.length + 1
    })
    .returning()
    .then(res => res[0]);

  const questions = await db
    .select({
      id: questionsTable.id,
      questionType: questionsTable.questionType,
      questionText: questionsTable.questionText,
      data: questionsTable.data
    })
    .from(questionsTable)
    .where(eq(questionsTable.quizId, room.quizId));

  const questionsForParticipant = questions.map((q) => ({
    ...q,
    data: { options: q.data.options },
  }));

  return c.json({ submission, questions: questionsForParticipant }, 201);
});
// DELETE /api/rooms/delete - delete a quiz room
roomRoutes.delete("/delete",async (c)=>{
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const { roomId } = await c.req.json();
  const room = await db.query.roomsTable.findFirst({
    where: eq(roomsTable.id, roomId),
    with: {
      quiz: true
    }
  });
  if (!room || room.quiz.ownerId !== session.user.id) {
    return c.json({ error: "Room not found or you are not the owner" }, 404);
  }
  await db.delete(roomsTable).where(eq(roomsTable.id, roomId));
  return c.json({ message: "Room deleted successfully" });
})
export default roomRoutes