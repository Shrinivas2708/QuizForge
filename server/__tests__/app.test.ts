import request from "supertest";

// Mock the db module before importing the app
jest.mock("../src/db", () => ({
  getDb: (DATABASE_URL: string) => {
    return {
      select: () => ({
        from: () =>
          Promise.resolve([
            { id: 1, name: "Alice", age: 30, email: "a@example.com" },
          ]),
      }),
    };
  },
}));

import app from "../src/index";

describe("app routes", () => {
  it("GET / returns Hello Hono!", async () => {
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toBe("Hello Hono!");
  });

  it("GET /users returns mocked users", async () => {
    const res = await request(app).get("/users");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { id: 1, name: "Alice", age: 30, email: "a@example.com" },
    ]);
  });
});
