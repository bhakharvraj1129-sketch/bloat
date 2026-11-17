import { defineConfig, devices } from "@playwright/test";

// Browser tests against the deployed private preview (not the local stack).
//   HOSTED_URL=https://<preview host>  HOSTED_SHARE_URL=<Vercel share link>  pnpm test:hosted
// HOSTED_SHARE_URL is a temporary Vercel link that lets an approved tester through deployment
// protection. It is passed in the environment and never committed.
const proxy = process.env.HTTPS_PROXY ?? process.env.https_proxy;

export default defineConfig({
  testDir: "tests/hosted",
  timeout: 120_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  use: { baseURL: process.env.HOSTED_URL, trace: "off", ...(proxy ? { proxy: { server: proxy, bypass: "localhost,127.0.0.1" } } : {}) },
  projects: [{ name: "phone", use: { ...devices["Pixel 7"] } }],
});
