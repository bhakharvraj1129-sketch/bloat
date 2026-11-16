import { defineConfig } from "vitest/config";
import path from "node:path";

const alias = {
  "@": path.resolve(__dirname, "src"),
  "@data": path.resolve(__dirname, "docs/data"),
  "@content": path.resolve(__dirname, "content"),
  // "server-only" guards server files from the browser bundle; tests run on the server side.
  "server-only": path.resolve(__dirname, "tests/support/server-only.ts"),
};

export default defineConfig({
  resolve: { alias },
  test: {
    projects: [
      { resolve: { alias }, test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node" } },
      {
        resolve: { alias },
        test: {
          name: "api",
          include: ["tests/api/**/*.test.ts"],
          environment: "node",
          testTimeout: 30000,
          hookTimeout: 60000,
          fileParallelism: false,
        },
      },
    ],
  },
});
