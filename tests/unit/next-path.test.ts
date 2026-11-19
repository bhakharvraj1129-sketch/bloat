import { describe, expect, it } from "vitest";
import { safeNext } from "@/lib/next-path";

describe("return path after signing in again", () => {
  it("accepts Bloat screens", () => {
    for (const p of ["/today", "/me", "/day/2026-11-18", "/experiments/0f9c2b1e-7c1d-4c55-9d43-1a2b3c4d5e6f", "/meal/recall"]) expect(safeNext(p)).toBe(p);
  });
  it("refuses other sites, tricks and screens that make no sense to return to", () => {
    for (const p of [null, "", "//evil.example", "https://evil.example/today", "/\\evil.example", "/sign-in", "/setup", "/auth/callback", "/today?x=1", "/today/../admin", "/admin", "/v1/me/state", `/${"a".repeat(300)}`]) expect(safeNext(p)).toBeNull();
  });
});
