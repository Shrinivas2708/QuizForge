import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

let db: ReturnType<typeof drizzle> | null = null;

export const getDb = (DATABASE_URL: string) => {
  if (!db) {
    const sql = neon(DATABASE_URL);
    db = drizzle(sql);
  }
  return db;
};
