"use client";
import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ErrorState, Loading, Screen } from "./ui";
import type { Load } from "@/lib/client/hooks";

/**
 * Wraps a Pro screen. A Free account is sent to the Upgrade screen and is shown nothing from the
 * Pro answer (the server sends none): no preview of any finding.
 */
export function ProScreen<T>({ title, back, load, children }: { title: string; back?: string; load: Load<T>; children: (data: T) => ReactNode }) {
  const router = useRouter();
  const locked = load.error?.code === "PLAN_REQUIRED";
  useEffect(() => { if (locked) router.replace("/upgrade"); }, [locked, router]);
  if (locked) return <Screen title={title} back={back}><p role="status">This is part of Bloat Pro.</p></Screen>;
  if (load.loading && !load.data) return <Screen title={title} back={back}><Loading /></Screen>;
  if (load.error && !load.data) return <Screen title={title} back={back}><ErrorState error={load.error} onRetry={load.reload} /></Screen>;
  if (!load.data) return null;
  return <Screen title={title} back={back}>{children(load.data)}</Screen>;
}

export const signed = (n: number | null) => (n === null ? "–" : `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}`);
