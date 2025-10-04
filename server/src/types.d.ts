import { getDb } from "./db";
import type {R2Bucket} from '@cloudflare/workers-types'
export type DbInstance = ReturnType<typeof getDb>
export type AppEnv = {
  Bindings: {
    DATABASE_URL: string;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_URL: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    FRONTEND_URL: string;
    IS_PROD : boolean;
    GEMINI_API_KEY:string;
    AI:string
    R2_BUCKET: R2Bucket
  };
};
export type EnvBindings = {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  FRONTEND_URL: string;
  IS_PROD : boolean
};