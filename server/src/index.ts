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

// const allowedOrigins = [
//   "http://localhost:3000",
//   "http://127.0.0.1:5173",
//   "https://quizforge.shriii.xyz",
// ];

// authApp.all("*", async (c, next) => {
//   const origin = c.req.header("Origin") || "";
//   const headers: Record<string, string> = {};

//   const referer = c.req.header("Referer") || "";
//   let allowedOrigin = "";

//   if (origin && allowedOrigins.includes(origin)) {
//     allowedOrigin = origin;
//   } else if (referer) {
//     try {
//       const refererUrl = new URL(referer);
//       const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
//       if (allowedOrigins.includes(refererOrigin)) {
//         allowedOrigin = refererOrigin;
//       }
//     } catch (e) {
//       console.error("Invalid referer URL:", e);
//     }
//   }
  
//   // ✅ CRITICAL FIX: For OAuth callback routes, always set CORS to localhost:3000 in dev
//   const isProd = c.env.IS_PROD === true || c.env.IS_PROD === "true";
//   if (!isProd && !allowedOrigin && c.req.path.includes("/callback/")) {
//     allowedOrigin = "http://localhost:3000";
//     console.log("🔧 Setting default CORS origin for callback:", allowedOrigin);
//   }

//   if (allowedOrigin) {
//     headers["Access-Control-Allow-Origin"] = allowedOrigin;
//     headers["Access-Control-Allow-Credentials"] = "true";
//     headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
//     headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
//   }

//   if (c.req.method === "OPTIONS") {
//     return new Response(null, {
//       status: 204,
//       headers,
//     });
//   }

//   const db = getDb(c.env.DATABASE_URL);
//   const auth = createAuth(c.env, db);
//   const res = await auth.handler(c.req.raw);

//   const setCookieHeaders = res.headers.getSetCookie();

//   console.log("=== AUTH RESPONSE DEBUG ===");
//   console.log("Path:", c.req.path);
//   console.log("Set-Cookie headers BEFORE:", setCookieHeaders);
//   console.log("Origin:", origin);
//   console.log("Referer:", referer);
//   console.log("Allowed Origin:", allowedOrigin);
//   console.log("Will add CORS headers:", Object.keys(headers).length > 0);
//   console.log("========================");
  
//   if (!isProd && setCookieHeaders.length > 0) {
//     console.log("🔧 Modifying cookies for development...");
    
//     const modifiedResponse = new Response(res.body, {
//       status: res.status,
//       statusText: res.statusText,
//       headers: new Headers(res.headers),
//     });
    
//     modifiedResponse.headers.delete("Set-Cookie");
    
//     setCookieHeaders.forEach((cookie) => {
//       if (!cookie.includes("Domain=")) {
//         const parts = cookie.split(";");
//         const modifiedCookie = parts[0] + "; Domain=localhost" + cookie.substring(parts[0].length);
//         console.log("Modified cookie:", modifiedCookie);
//         modifiedResponse.headers.append("Set-Cookie", modifiedCookie);
//       } else {
//         modifiedResponse.headers.append("Set-Cookie", cookie);
//       }
//     });

//     console.log("=== MODIFIED Set-Cookie ===");
//     console.log(modifiedResponse.headers.getSetCookie());
    
//     // ✅ CRITICAL: Add CORS headers to the modified response
//     for (const [key, value] of Object.entries(headers)) {
//       modifiedResponse.headers.set(key, value);
//       console.log(`Setting header: ${key} = ${value}`);
//     }
    
//     console.log("========================");

//     return modifiedResponse;
//   }

//   // For responses without cookies, still add CORS headers
//   for (const [key, value] of Object.entries(headers)) {
//     res.headers.set(key, value);
//   }

//   return res;
// });
app.route("/auth", authApp);
// --- END: Manual CORS Handling ---
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