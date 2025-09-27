import { describe, it, expect, beforeAll } from "vitest";
import app from "../src/index";

// Mock getDb to avoid real DB calls
import { getDb } from "../src/db";
vi.mock("../src/db", () => ({
  getDb: () => ({
    select: () => ({
      from: () => [
        { id: 1, name: "Alice", age: 30, email: "a@example.com" },
      ],
    }),
  }),
}));

// Create a fake env
const fakeEnv = {
  DATABASE_URL: "postgres://fake",
};

describe("Hono Worker routes", () => {
  it("GET / returns Hello Hono!", async () => {
    const res = await app.fetch(new Request("http://localhost/"), { env: fakeEnv });
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).toBe("Hello Hono!");
  });

  it("GET /users returns mocked users", async () => {
    const res = await app.fetch(new Request("http://localhost/users"), { env: fakeEnv });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual([
      { id: 1, name: "Alice", age: 30, email: "a@example.com" },
    ]);
  });
});
