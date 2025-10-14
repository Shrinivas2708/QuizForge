import { Hono } from "hono";
import { getDb } from "../db";
import { createAuth } from "../utils/auth";
import type { AppEnv } from "../types";
import {
  roomsTable,
  quizzesTable,
  participantsTable,
  submissionsTable,
} from "../db/schema";
import { nanoid } from "nanoid";
import { eq, and, desc } from "drizzle-orm";

const roomRoutes = new Hono<AppEnv>();

// GET /api/rooms/getAllRooms - Get all the rooms for a user (owner only)
roomRoutes.get("/getAllRooms", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  if (!session?.user?.id) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const rooms = await db
    .select({
      id: roomsTable.id,
      name: roomsTable.name,
      shareableCode: roomsTable.shareableCode,
      createdAt: roomsTable.createdAt,
      quizTitle: quizzesTable.title,
      timeLimit : roomsTable.timeLimitSeconds
    })
    .from(roomsTable)
    .innerJoin(quizzesTable, eq(roomsTable.quizId, quizzesTable.id))
    .where(eq(quizzesTable.ownerId, session.user.id))
    .orderBy(desc(roomsTable.createdAt));
  return c.json(rooms);
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
      quizId, // ✅ new field
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

    // CORRECTED JOIN: Use roomsTable.quizId
    const roomDetails = await db
      .select({
        title: quizzesTable.title,
        participantInfoRequired: roomsTable.participantFields,
      })
      .from(roomsTable)
      .innerJoin(quizzesTable, eq(roomsTable.quizId, quizzesTable.id)) // FIX: Changed from roomsTable.id
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
  if (!room) return c.json({ message: "No rooom!" }, 400);
  for (const field of room.participantFields) {
    if (!details[field]) {
      return c.json({ error: `Missing required field: '${field}'` }, 400);
    }
  }

  const participant = await db
    .insert(participantsTable)
    .values({
      roomId: room.id,
      details, // Save the JSON details object
    })
    .returning()
    .then((res) => res[0]);

  // In a real application, you'd return a secure JWT for the participant
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

  const quiz = await db.query.quizzesTable.findFirst({
    where: and(
      eq(quizzesTable.id, roomId),
      eq(quizzesTable.ownerId, session.user.id)
    ),
  });

  if (!quiz) {
    return c.json({ error: "Room not found or you are not the owner" }, 404);
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
  const submissions = await db.query.submissionsTable.findMany({
    where: eq(submissionsTable.quizId, room.quizId),
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
export default roomRoutes;
