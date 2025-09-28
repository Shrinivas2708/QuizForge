// server/__tests__/user.routes.test.ts

import { describe, it, expect, vi } from "vitest";
import app from "../src/index";
import { getDb } from "../src/db";
import { createAuth } from "../src/utils/auth";

// Mock dependencies
vi.mock("../src/db");
vi.mock("../src/utils/auth");

// Define interfaces for the expected responses
interface UserResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
}

interface ErrorResponse {
  error: string;
}

const fakeEnv = {
  DATABASE_URL: "postgres://fake",
  BETTER_AUTH_SECRET: "secret",
  BETTER_AUTH_URL: "http://localhost:8787",
  GOOGLE_CLIENT_ID: "google-client-id",
  GOOGLE_CLIENT_SECRET: "google-client-secret",
  FRONTEND_URL: "http://localhost:3000",
};

describe("User routes", () => {
  it("GET /users/me should return user data for an authenticated user", async () => {
    // Mock the session to simulate an authenticated user
    (createAuth as any).mockReturnValue({
      api: {
        getSession: async () => ({
          user: { id: "1", email: "test@example.com", name: "Test User" },
        }),
      },
    });

    const request = new Request("http://localhost/users/me", {
      headers: { Authorization: "Bearer valid-token" },
    });
    const res = await app.fetch(request, fakeEnv);
    const data = (await res.json()) as UserResponse; // Type assertion

    expect(res.status).toBe(200);
    expect(data.user).toEqual({
      id: "1",
      email: "test@example.com",
      name: "Test User",
    });
  });

  it("GET /users/me should return 401 for an unauthenticated user", async () => {
    // Mock the session to simulate an unauthenticated user
    (createAuth as any).mockReturnValue({
      api: {
        getSession: async () => null,
      },
    });

    const request = new Request("http://localhost/users/me");
    const res = await app.fetch(request, fakeEnv);
    const data = (await res.json()) as ErrorResponse; // Type assertion

    expect(res.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });
});