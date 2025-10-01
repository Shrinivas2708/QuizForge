import { Hono } from "hono";
import { getDb } from "./db";
import { createAuth } from "./utils/auth";
import { AppEnv } from "./types";
import { cors } from "hono/cors";
import  {userRoutes,quizRoutes,roomRoutes,sourceRoutes,submissionRoutes,chatRoutes} from "./routes"

const app = new Hono<AppEnv>();
app.use(
  "*",
  cors({
    origin: (origin) => {
      const allowed = [
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "https://quizforge.shriii.xyz",
      ];
      return allowed.includes(origin ?? "") ? origin : undefined;
    },
    credentials: true,
  })
);

app.get("/", (c) => {
  return c.json({ message: "Welcome to QuizForge API Server!!" });
});

const authApp = new Hono<AppEnv>();

authApp.all("*", (c) => {
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);
  console.log(auth.api)
  return auth.handler(c.req.raw);
});
app.route("/auth", authApp);
app.route("/users", userRoutes);
app.route("/sources", sourceRoutes);
app.route("/quizzes", quizRoutes);
app.route("/rooms", roomRoutes);
app.route("/submissions", submissionRoutes);
app.route("/chat", chatRoutes);
export default app;
export type AppType = typeof app;