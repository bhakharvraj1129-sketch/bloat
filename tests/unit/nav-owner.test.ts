import { describe, expect, it } from "vitest";
import { ownerOf } from "@/lib/nav-owner";

describe("navigation ownership", () => {
  it("marks the tab that owns each screen", () => {
    expect(ownerOf("/today")).toBe("today");
    expect(ownerOf("/meal/recall")).toBe("today");
    expect(ownerOf("/day/2026-11-18")).toBe("history");
    expect(ownerOf("/report")).toBe("insights");
    expect(ownerOf("/doctor")).toBe("insights");
    expect(ownerOf("/experiments/abc")).toBe("insights");
    expect(ownerOf("/journey")).toBe("insights");
    expect(ownerOf("/health")).toBe("me");
    expect(ownerOf("/upgrade")).toBe("me");
    expect(ownerOf("/help")).toBeNull();
  });
  it("a review belongs to Today unless it was opened from History", () => {
    expect(ownerOf("/review/2026-11-18")).toBe("today");
    expect(ownerOf("/review/2026-11-18", "/day/2026-11-18")).toBe("history");
    expect(ownerOf("/review/2026-11-18", "/history")).toBe("history");
  });
});
