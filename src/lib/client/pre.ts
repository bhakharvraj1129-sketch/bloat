"use client";
// Pre-sign-up choices held in the open tab only (plan A06 screen 02): the country and the
// help-page acknowledgement. No health answer is ever kept in browser storage.
const KEY = "bloat.pre";
export type Pre = { country?: string; help_viewed_at?: string; help_version?: string; adult?: boolean };

export function readPre(): Pre {
  try { return JSON.parse(sessionStorage.getItem(KEY) ?? "{}") as Pre; } catch { return {}; }
}
export function writePre(patch: Pre) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ ...readPre(), ...patch })); } catch { /* storage off: asked again later */ }
}
export function clearPre() {
  try { sessionStorage.removeItem(KEY); } catch { /* nothing to clear */ }
}
