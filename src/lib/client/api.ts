"use client";

export class ApiFailure extends Error {
  constructor(public status: number, public code: string, message: string, public details: unknown, public saveKey: string | null) {
    super(message);
  }
  /** The reply was lost: we do not know whether the server saved it. */
  get unknownOutcome() { return this.code === "NETWORK"; }
}

export function newKey(): string {
  return crypto.randomUUID();
}

type Opts = { key?: string; ifMatch?: number; form?: FormData };

export async function api<T = unknown>(method: string, path: string, body?: unknown, opts: Opts = {}): Promise<T> {
  const mutation = method !== "GET";
  const key = mutation ? opts.key ?? newKey() : null;
  const headers: Record<string, string> = {};
  if (key) headers["Idempotency-Key"] = key;
  if (opts.ifMatch !== undefined) headers["If-Match"] = String(opts.ifMatch);
  let payload: BodyInit | undefined;
  if (opts.form) payload = opts.form;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  else if (mutation) { headers["Content-Type"] = "application/json"; payload = "{}"; }
  let res: Response;
  try {
    res = await fetch(path, { method, headers, body: payload, credentials: "same-origin", cache: "no-store" });
  } catch {
    throw new ApiFailure(0, "NETWORK", "Connection lost. We can't tell yet whether this was saved.", null, key);
  }
  if (res.status === 204) return undefined as T;
  let data: unknown = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; details?: unknown } } | null)?.error;
    if (res.status === 401 && typeof window !== "undefined" && !location.pathname.startsWith("/sign-in")) {
      location.href = "/sign-in";
    }
    throw new ApiFailure(res.status, err?.code ?? "ERROR", err?.message ?? "Something went wrong. Nothing was saved.", err?.details ?? null, key);
  }
  return data as T;
}

/** "Check save status": ask the server whether a request with this key was saved. */
export async function checkSaved(key: string): Promise<{ saved: boolean; response?: unknown }> {
  return api("GET", `/v1/commands/${encodeURIComponent(key)}`);
}

export function deviceZone(): string {
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return "UTC"; }
}
