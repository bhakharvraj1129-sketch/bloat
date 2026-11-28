#!/usr/bin/env node
// Writes passed, failed and skipped counts for each test suite as a Markdown table, from the JSON
// reports the Preview workflow saves in reports/. Usage: node scripts/test-counts.mjs >> "$GITHUB_STEP_SUMMARY"
// A suite whose report is missing is listed as "did not run" (it never counts as passed).
import { existsSync, readFileSync } from "node:fs";

const suites = [
  ["Rule tests", "reports/unit.json", "vitest"],
  ["API tests (normal server)", "reports/api.json", "vitest"],
  ["Browser tests (normal server)", "reports/e2e.json", "playwright"],
  ["API, beta settings (second server)", "reports/beta-api.json", "vitest"],
  ["Browser, beta settings and password sign-in (second server)", "reports/beta-e2e.json", "playwright"],
];

function counts(file, kind) {
  if (!existsSync(file)) return null;
  const r = JSON.parse(readFileSync(file, "utf8"));
  if (kind === "vitest") return { passed: r.numPassedTests ?? 0, failed: r.numFailedTests ?? 0, skipped: (r.numPendingTests ?? 0) + (r.numTodoTests ?? 0) };
  const s = r.stats ?? {};
  return { passed: (s.expected ?? 0) + (s.flaky ?? 0), failed: s.unexpected ?? 0, skipped: s.skipped ?? 0, flaky: s.flaky ?? 0 };
}

const lines = ["| Suite | Passed | Failed | Skipped |", "|---|---|---|---|"];
for (const [name, file, kind] of suites) {
  const c = counts(file, kind);
  lines.push(c ? `| ${name} | ${c.passed}${c.flaky ? ` (${c.flaky} only on retry)` : ""} | ${c.failed} | ${c.skipped} |` : `| ${name} | did not run | | |`);
}
lines.push("", "Skipped on the normal server: the checks that need the beta settings or password sign-in; they run on the second server, where none may be skipped.");
console.log(lines.join("\n"));
