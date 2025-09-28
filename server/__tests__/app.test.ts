// server/__tests__/auth.test.ts

import { describe, it, expect, vi } from "vitest";
import app from "../src/index";

// Define an interface for the expected response
interface RedirectResponse {
  redirectUrl: string;
}

// Mock the getDb and createAuth functions to isolate the tests
vi.mock("../src/db", () => ({
  getDb: vi.fn(),
}));

vi.mock("../src/utils/auth", () => ({
  createAuth: () => ({
    handler: async (req: Request) => {
      if (req.url.endsWith("/auth/sign-in/social")) {
        return new Response(JSON.stringify({ redirectUrl: "https://accounts.google.com/o/oauth2/v2/auth" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Unauthorized", { status: 401 });
    },
    api: {
      getSession: async ({ headers }: { headers: Headers }) => {
        if (headers.get("Authorization") === "Bearer valid-token") {
          return { user: { id: "1", email: "test@example.com", name: "Test User" } };
        }
        return null;
      },
    },
  }),
}));

const fakeEnv = {
  DATABASE_URL: "postgres://fake",
  BETTER_AUTH_SECRET: "secret",
  BETTER_AUTH_URL: "http://localhost:8787",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  FRONTEND_URL: "http://localhost:3000",
};

describe("Authentication routes", () => {
  it("POST /auth/sign-in/social should return a redirect URL for Google", async () => {
    const request = new Request("http://localhost/auth/sign-in/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: "google" }),
    });

    const res = await app.fetch(request, fakeEnv);
    const data = (await res.json()) as RedirectResponse; // Type assertion

    expect(res.status).toBe(200);
    expect(data.redirectUrl).toBe("https://accounts.google.com/o/oauth2/v2/auth");
  });
});