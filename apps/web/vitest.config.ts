import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.test.{ts,tsx}", "tests/unit/**/*.test.{ts,tsx}"],
    exclude: ["tests/e2e/**"],
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      APP_URL: "http://localhost:3000",
      JWT_ACCESS_SECRET: "test-secret-test-secret-test-secret-test-secret",
    },
  },
});
