import { Hono } from "hono";
import { getDb } from "./db";
import { createAuth } from "./utils/auth";
import { AppEnv } from "./types";
import { cors } from "hono/cors";
import {
  userRoutes,
  quizRoutes,
  roomRoutes,
  sourceRoutes,
  submissionRoutes,
  chatRoutes,
} from "./routes";

const app = new Hono<AppEnv>();

// This middleware will handle CORS for all non-auth routes
app.use(
  "*", // Apply to all routes including /auth
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "https://quizforge.shriii.xyz",
    ],
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.json({ message: "Welcome to QuizForge API Server!!" });
});

// --- START: Manual CORS Handling for /auth routes ---
const authApp = new Hono<AppEnv>();

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:5173",
  "https://quizforge.shriii.xyz",
];

authApp.all("*", async (c, next) => {
  const origin = c.req.header("Origin") || "";
  const headers: Record<string, string> = {};

  if (allowedOrigins.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Credentials"] = "true";
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] =
      "Content-Type, Authorization";
  }

  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers,
    });
  }

  // Call BetterAuth handler
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);

  const res = await auth.handler(c.req.raw);

  // Inject headers into the response returned by BetterAuth
  for (const [key, value] of Object.entries(headers)) {
    res.headers.set(key, value);
  }

  return res;
});


app.route("/auth", authApp);
// --- END: Manual CORS Handling ---
// app.all("/auth/*", async (c) => {
//   const db = getDb(c.env.DATABASE_URL);
//   const auth = createAuth(c.env, db);
//   return await auth.handler(c.req.raw);
// });
app.route("/users", userRoutes);
app.route("/sources", sourceRoutes);
app.route("/quizzes", quizRoutes);
app.route("/rooms", roomRoutes);
app.route("/submissions", submissionRoutes);
app.route("/chat", chatRoutes);

export default app;
export type AppType = typeof app;