// Where to go after signing in again when a session ran out part-way through.
// Only a Bloat screen path is accepted (never another site, never a sign-in or setup screen),
// and only the path: no query string, so nothing but the screen's address is carried.
const ALLOWED = /^\/(today|history|insights|me|day|review|meal|upgrade|learn|experiments|journey|report|cards|health|doctor)(\/[A-Za-z0-9_-]+)*$/;

export function safeNext(value: string | null | undefined): string | null {
  if (!value || value.length > 200) return null;
  return ALLOWED.test(value) ? value : null;
}
