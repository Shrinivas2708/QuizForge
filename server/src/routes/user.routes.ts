import { Hono } from "hono";
import { getDb } from "../db";
import { createAuth } from "../utils/auth";
import type { AppEnv } from "../types";

const userRoutes = new Hono<AppEnv>();

userRoutes.get("/me", async (c) => {
   const cookieHeader = c.req.header('Cookie');
  console.log('=== /users/me REQUEST ===');
  console.log('Cookie header:', cookieHeader);
  console.log('========================');
  const db = getDb(c.env.DATABASE_URL);
  const auth = createAuth(c.env, db);

  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ user: session.user });
});

export default userRoutes;