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

app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "https://quizforge.shriii.xyz",
      "https://room.quizforge.shriii.xyz"
    ],
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.json({ message: "Welcome to QuizForge API Server!!" });
});

const authApp = new Hono<AppEnv>();

app.route("/auth", authApp);

app.get("/auth/sso-callback", async (c) => {
  console.log("✅ [SERVER] Hit /auth/sso-callback endpoint.");
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session?.session.token) {
    console.error("❌ [SERVER] No session found after Google redirect. Check 'better-auth' config and cookies.");
    return c.redirect(`${c.env.FRONTEND_URL}/login?error=auth_failed`);
  }

  const token = session.session.token;
  const currentSessionId = token.split('.')[0];
  console.log(`✅ [SERVER] Extracted currentSessionId: ${currentSessionId}`);

  const redirectUrl = new URL(`${c.env.FRONTEND_URL}/auth-callback`);
  redirectUrl.searchParams.set("token", currentSessionId);

  console.log(`✅ [SERVER] Redirecting to client at: ${redirectUrl.toString()}`);
  return c.redirect(redirectUrl.toString());
});
app.all("/auth/*", async (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);
  return await auth.handler(c.req.raw);
});
app.route("/users", userRoutes);
app.route("/sources", sourceRoutes);
app.route("/quizzes", quizRoutes);
app.route("/rooms", roomRoutes);
app.route("/submissions", submissionRoutes);
app.route("/chat", chatRoutes);

export default app;
export type AppType = typeof app;