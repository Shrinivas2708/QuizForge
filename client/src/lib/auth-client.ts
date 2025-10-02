// src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_ENV === "dev" 
    ? "http://localhost:8787" 
    : "https://api.quizforge.shriii.xyz",
    basePath:'/auth',
    credentials:true
});

export const { signIn, signOut, useSession } = authClient;