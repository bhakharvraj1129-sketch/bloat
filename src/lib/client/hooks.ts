"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiFailure, checkSaved, newKey } from "./api";

export type Load<T> = { data: T | null; error: ApiFailure | null; loading: boolean; reload: () => void };

export function useLoad<T>(path: string | null): Load<T> {
  const [state, setState] = useState<{ data: T | null; error: ApiFailure | null; loading: boolean }>({ data: null, error: null, loading: !!path });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!path) return;
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    api<T>("GET", path)
      .then((data) => { if (alive) setState({ data, error: null, loading: false }); })
      .catch((e) => { if (alive) setState((s) => ({ data: s.data, error: e instanceof ApiFailure ? e : new ApiFailure(0, "ERROR", "Something went wrong.", null, null), loading: false })); });
    return () => { alive = false; };
  }, [path, tick]);
  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { ...state, reload };
}

export type SaveState = "idle" | "saving" | "saved" | "error" | "unknown";

/**
 * A save that tells the truth: "Saving…" until the server confirms, "Saved" only after it does,
 * and "Check save status" when the reply was lost. Retrying reuses the same key, so nothing is
 * ever saved twice.
 */
export function useSave<T = unknown>() {
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<ApiFailure | null>(null);
  const keyRef = useRef<string>(newKey());
  const lastRef = useRef<(() => Promise<T>) | null>(null);

  const run = useCallback(async (method: string, path: string, body?: unknown, opts: { ifMatch?: number; form?: FormData } = {}): Promise<T | null> => {
    const key = keyRef.current;
    const attempt = () => api<T>(method, path, body, { ...opts, key });
    lastRef.current = attempt;
    setState("saving"); setError(null);
    try {
      const out = await attempt();
      setState("saved");
      keyRef.current = newKey();
      return out;
    } catch (e) {
      const f = e instanceof ApiFailure ? e : new ApiFailure(0, "ERROR", "Something went wrong. Nothing was saved.", null, key);
      setError(f);
      setState(f.unknownOutcome ? "unknown" : "error");
      if (!f.unknownOutcome) keyRef.current = newKey();
      return null;
    }
  }, []);

  /** After a lost reply: ask the server, and send again with the same key if it was not saved. */
  const check = useCallback(async (): Promise<T | null> => {
    setState("saving");
    try {
      const status = await checkSaved(keyRef.current);
      if (status.saved) { setState("saved"); keyRef.current = newKey(); return (status.response ?? null) as T | null; }
      if (lastRef.current) {
        const out = await lastRef.current();
        setState("saved"); keyRef.current = newKey();
        return out;
      }
      setState("error");
      return null;
    } catch (e) {
      const f = e instanceof ApiFailure ? e : null;
      setError(f);
      setState(f?.unknownOutcome ? "unknown" : "error");
      return null;
    }
  }, []);

  const reset = useCallback(() => { setState("idle"); setError(null); keyRef.current = newKey(); }, []);
  return { state, error, run, check, reset, saving: state === "saving" };
}
