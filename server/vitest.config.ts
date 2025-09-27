import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node", // Workers is fetch-based
    // setupFiles: "./test/setup.ts",
    include: ["__tests__/**/*.test.ts"],
  },
});
