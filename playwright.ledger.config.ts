import { defineConfig, devices } from "@playwright/test";

// Control ledger crawler against the LOCAL app (port 3100, test mode on, local Supabase).
export default defineConfig({
  testDir: "tests/ledger",
  timeout: 120 * 60_000,
  workers: 1,
  reporter: [["line"]],
  use: { baseURL: `http://127.0.0.1:${process.env.E2E_PORT ?? 3100}`, trace: "off" },
  projects: [{ name: "phone", use: { ...devices["Pixel 7"] } }],
});
