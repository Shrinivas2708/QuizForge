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
import z from "zod";

/* =========================================
   GROUP 1: AUTHENTICATION
   Handles user accounts, social logins, and active sessions.
========================================= */

// This is the table where we store the data of the user
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
// here we store the accounts of the users like which provider and tokens passwords etc so that we wont over fetch data from the base user table
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
// here we store the sessions of the users like if they are logged in or not and for how long
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
// this table is used to store the verification tokens for email verification and password reset etc
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
// here we store the data abt the sources such as the link where it is stored and the raw content status of the processing the files
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
// here we store the data we extracted from the sources 
export const documentsTable = pgTable("documents", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: text("source_id").notNull().references(() => sourcesTable.id, { onDelete: "cascade" }),
  content: text("content").notNull(),  // chunk text
  metadata: jsonb("metadata"),         // { page: 5, chunk: 2 }
  pineconeId: text("pinecone_id").unique(), // links to Pinecone vector ID
  createdAt: timestamp("created_at").defaultNow(),
});
// here we store the quizzess data whos the owner , source information chat's session id etc
export const quizzesTable = pgTable("quizzes", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  // A quiz is generated from one source, so this remains one-to-one
  sourceId: text("source_id").notNull().references(() => sourcesTable.id, { onDelete: "cascade" }), 
  title: varchar("title", { length: 255 }).notNull(),
  config: jsonb("config"),
  createdAt: timestamp("created_at").defaultNow(),
  version: integer("version").default(1),
  parentQuizId: text("parent_quiz_id")
});

export const questionDataSchema = z.object({
  options: z.array(z.string()).optional(),
  correctAnswer: z.string(),
});
export const questionTypeEnum = pgEnum('question_type', ['multiple_choice', 'true_false', 'short_answer']);
// here we store the questions the type of the questions id of the quiz and  the data 
export const questionsTable = pgTable("questions", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    quizId: text("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
    questionType: questionTypeEnum("question_type").notNull(),
    questionText: text("question_text").notNull(),
    data: jsonb("data").$type<z.infer<typeof questionDataSchema>>().notNull(),
    feedback: text("feedback"), // AI-generated explanation
});

/* =========================================
   GROUP 3: ROOMS & PARTICIPATION
   Handles shared quiz sessions for groups.
========================================= */

export const participantInfoEnum = pgEnum('participant_info', ['name', 'email']);
export const proctoringLevelEnum = pgEnum('proctoring_level', ['basic', 'strict']);
// here we store abt the rooms like te code participants time limits etc
export const roomsTable = pgTable("rooms", {
    id: text("id").primaryKey().references(() => quizzesTable.id, { onDelete: "cascade" }),
    shareableCode: varchar("shareable_code", { length: 10 }).notNull().unique(),
    // MODIFIED: From enum to a flexible array of strings
    participantFields: jsonb("participant_fields").$type<string[]>().notNull().default( ['name']),
    timeLimitSeconds: integer("time_limit_seconds"),
    proctoringLevel: proctoringLevelEnum("proctoring_level").notNull().default("basic"),
    isOpen: boolean("is_open").default(true),
});

export const participantsTable = pgTable("participants", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    roomId: text("room_id").notNull().references(() => roomsTable.id, { onDelete: "cascade" }),
    // MODIFIED: From a single identifier to a flexible JSON object
    details: jsonb("details").$type<Record<string, string>>().notNull().default({}),
    joinedAt: timestamp("joined_at").defaultNow(),
});

/* =========================================
   GROUP 4: SUBMISSIONS & PROCTORING
   Tracks quiz attempts, results, and anti-cheat events.
========================================= */
// bere we store the submissions data of a participant from the rooms and the score etc
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

// here we score the answers from the submissions and for the questions and store if the ans is correct or not 
export const answersTable = pgTable("answers", {
    submissionId: text("submission_id").notNull().references(() => submissionsTable.id, { onDelete: "cascade" }),
    questionId: text("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
    givenAnswer: jsonb("given_answer"),
    isCorrect: boolean("is_correct"),
}, (table) => ({
    pk: primaryKey({ columns: [table.submissionId, table.questionId] }),
}));

export const proctoringEventTypeEnum = pgEnum('proctoring_event_type', ['tab_switch', 'copy_paste', 'fullscreen_exit']);
// here we describe the proctoring events data for saftey
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
// here we store the session of a chat for the AI history
export const chatSessionsTable = pgTable("chat_sessions", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    // REMOVED: sourceId no longer belongs here
    // sourceId: text("source_id").notNull().references(() => sourcesTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 255 }).notNull().default("New Chat"),
    createdAt: timestamp("created_at").defaultNow(),
});

// NEW: This table links multiple sources to a single chat session
export const chatSessionSourcesTable = pgTable("chat_session_sources", {
    sessionId: text("session_id").notNull().references(() => chatSessionsTable.id, { onDelete: "cascade" }),
    sourceId: text("source_id").notNull().references(() => sourcesTable.id, { onDelete: "cascade" }),
}, (table) => ({
    pk: primaryKey({ columns: [table.sessionId, table.sourceId] }),
}));

export const messageRoleEnum = pgEnum('message_role', ['user', 'assistant']);

export const chatMessagesTable = pgTable("chat_messages", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: text("session_id").notNull().references(() => chatSessionsTable.id, { onDelete: "cascade" }),
    role: messageRoleEnum("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
});
export const feedbackTypeEnum = pgEnum('feedback_type', ['like', 'dislike']);
// here we describe if the user is satisfied with response from the LLM to refine prompt more with the feedback
export const feedbackTable = pgTable("feedback", {
  id: text("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  quizId: text("quiz_id").references(() => quizzesTable.id, { onDelete: "cascade" }),
  messageId: text("message_id").references(() => chatMessagesTable.id, { onDelete: "cascade" }),
  type: feedbackTypeEnum("type").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow(),
});
