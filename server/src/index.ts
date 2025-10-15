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
  try {
    console.log("🔵 Auth request:", c.req.method, c.req.path);
    
    if (!c.env.DATABASE_URL) {
      throw new Error("DATABASE_URL not configured");
    }
    
    const db = getDb(c.env.DATABASE_URL);
    console.log("✅ DB connection created");
    
    const auth = createAuth(c.env, db);
    console.log("✅ Auth instance created");
    
    const response = await auth.handler(c.req.raw);
    console.log("✅ Auth handler response:", response.status);
    
    return response;
  } catch (error ) {
    console.error("❌ Auth handler error:", {
      
      // @ts-ignore
     
      message: error.message,
      // @ts-ignore
      stack: error.stack,
       // @ts-ignore
      name: error.name
    });
    
    // Return error with proper CORS headers
    return c.json(
      { 
        error: "Authentication service error", 
        // @ts-ignore
        details: error.message,
        timestamp: new Date().toISOString()
      }, 
      500
    );
  }
});
app.get("/debug/env-check", (c) => {
  return c.json({
    hasDatabase: !!c.env.DATABASE_URL,
    hasAuthSecret: !!c.env.BETTER_AUTH_SECRET,
    hasAuthUrl: !!c.env.BETTER_AUTH_URL,
    hasFrontendUrl: !!c.env.FRONTEND_URL,
    hasGoogleId: !!c.env.GOOGLE_CLIENT_ID,
    hasGoogleSecret: !!c.env.GOOGLE_CLIENT_SECRET,
    isProd: c.env.IS_PROD,
    // Don't log actual values, just check if they exist
  });
});
app.route("/users", userRoutes);
app.route("/sources", sourceRoutes);
app.route("/quizzes", quizRoutes);
app.route("/rooms", roomRoutes);
app.route("/submissions", submissionRoutes);
app.route("/chat", chatRoutes);

export default app;
export type AppType = typeof app;