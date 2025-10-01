import { sql } from "drizzle-orm";
import {
  pgTable,
  varchar,
  boolean,
  timestamp,
  text,
  jsonb,
  integer,
  primaryKey,
  pgEnum,
} from "drizzle-orm/pg-core";

/* =========================================
   GROUP 1: AUTHENTICATION
   Handles user accounts, social logins, and active sessions.
========================================= */


export const usersTable = pgTable("users", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false), 
  name: varchar("name", { length: 255 }),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const accountsTable = pgTable("accounts", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt:timestamp("refresh_token_expires_at"),
  scope:text("scope"),
  idToken:text("idToken"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const sessionsTable = pgTable("sessions", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: text("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  token: varchar("token", { length: 255 }).notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  ipAddress: varchar("ip_address", { length: 255 }),
  userAgent: text("user_agent"),
});
export const verificationTokensTable = pgTable("verificationToken", {
  id: text("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

/* =========================================
   GROUP 2: CORE CONTENT
   Manages the source material and the quizzes generated from it.
========================================= */

export const sourceTypeEnum = pgEnum('source_type', ['document', 'text_topic', 'chat_history']);
export const sourceStatusEnum = pgEnum('source_status', ['pending', 'processing', 'ready', 'error']);

export const sourcesTable = pgTable("sources", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    type: sourceTypeEnum("type").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    storageKey: text("storage_key"), // URL/key for files in cloud storage (e.g., R2)
    rawContent: text("raw_content"),   // For 'text_topic' type
    status: sourceStatusEnum("status").notNull().default("pending"),
    createdAt: timestamp("created_at").defaultNow(),
});
export const documentsTable = pgTable("documents", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: text("source_id").notNull().references(() => sourcesTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),  // chunk text
  metadata: jsonb("metadata"),         // { page: 5, chunk: 2 }
  pineconeId: text("pinecone_id").unique(), // links to Pinecone vector ID
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzesTable = pgTable("quizzes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  sourceId: text("source_id").notNull().references(() => sourcesTable.id, { onDelete: "cascade" }),
  chatSessionId: text("chat_session_id").references(() => chatSessionsTable.id), // NEW
  title: varchar("title", { length: 255 }).notNull(),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  version: integer("version").default(1),
  parentQuizId: text("parent_quiz_id")
});


export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'true_false', 'short_answer']);

export const questionsTable = pgTable("questions", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    quizId: text("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
    questionType: questionTypeEnum("question_type").notNull(),
    questionText: text("question_text").notNull(),
    data: jsonb("data").notNull(), // For options and correct answer
    feedback: text("feedback"), // AI-generated explanation
});

/* =========================================
   GROUP 3: ROOMS & PARTICIPATION
   Handles shared quiz sessions for groups.
========================================= */

export const participantInfoEnum = pgEnum('participant_info', ['name', 'email']);
export const proctoringLevelEnum = pgEnum('proctoring_level', ['basic', 'strict']);

export const roomsTable = pgTable("rooms", {
    id: text("id").primaryKey().references(() => quizzesTable.id, { onDelete: "cascade" }),
    shareableCode: varchar("shareable_code", { length: 10 }).notNull().unique(),
    participantInfoRequired: participantInfoEnum("participant_info").notNull().default("name"),
    timeLimitSeconds: integer("time_limit_seconds"),
    proctoringLevel: proctoringLevelEnum("proctoring_level").notNull().default("basic"),
    isOpen: boolean("is_open").default(true),
});

export const participantsTable = pgTable("participants", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    roomId: text("room_id").notNull().references(() => roomsTable.id, { onDelete: "cascade" }),
    identifier: varchar("identifier", { length: 255 }).notNull(), // The name or email
    joinedAt: timestamp("joined_at").defaultNow(),
});

/* =========================================
   GROUP 4: SUBMISSIONS & PROCTORING
   Tracks quiz attempts, results, and anti-cheat events.
========================================= */

export const submissionsTable = pgTable("submissions", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  participantId: text("participant_id").notNull().references(() => participantsTable.id, { onDelete: "cascade" }),
  quizId: text("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  finalScore: integer("final_score"),
  attemptNumber: integer("attempt_number").default(1), // NEW
  startedAt: timestamp("started_at").defaultNow(),
  completedAt: timestamp("completed_at"),
  durationSeconds: integer("duration_seconds"), // NEW
  disqualified: boolean("disqualified").default(false),
});


export const answersTable = pgTable("answers", {
    submissionId: text("submission_id").notNull().references(() => submissionsTable.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
    givenAnswer: jsonb("given_answer"),
    isCorrect: boolean("is_correct"),
}, (table) => ({
    pk: primaryKey({ columns: [table.submissionId, table.questionId] }),
}));

export const proctoringEventTypeEnum = pgEnum('proctoring_event_type', ['tab_switch', 'copy_paste', 'fullscreen_exit']);

export const proctoringEventsTable = pgTable("proctoring_events", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  submissionId: text("submission_id").notNull().references(() => submissionsTable.id, { onDelete: "cascade" }),
  eventType: proctoringEventTypeEnum("event_type").notNull(),
  details: jsonb("details"), // NEW
  timestamp: timestamp("timestamp").defaultNow(),
});


/* =========================================
   GROUP 5: CHAT HISTORY
   Manages conversational history for the AI chat feature.
========================================= */

export const chatSessionsTable = pgTable("chat_sessions", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    sourceId: text("source_id").notNull().references(() => sourcesTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull().default("New Chat"),
    createdAt: timestamp("created_at").defaultNow(),
});

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

export const chatMessagesTable = pgTable("chat_messages", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: text("session_id").notNull().references(() => chatSessionsTable.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
export const feedbackTypeEnum = pgEnum('feedback_type', ['like', 'dislike']);

export const feedbackTable = pgTable("feedback", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  quizId: text("quiz_id").references(() => quizzesTable.id, { onDelete: "cascade" }),
  messageId: text("message_id").references(() => chatMessagesTable.id, { onDelete: "cascade" }),
  type: feedbackTypeEnum("type").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});
