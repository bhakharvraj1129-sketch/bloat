"use client";
import { useState } from "react";
import { Button, Caption, Card, Field, Label, inputClass } from "@/components/ui";

type Data = {
  ai_settings: { monthly_limit_micros: number; expected_cost_micros: number }; month_spent_micros: number; ai_calls_24h: number; ai_failures_24h: number;
  alerts: Array<{ id: string; kind: string; detail: Record<string, unknown>; created_at: string }>;
  review_queue: Array<{ id: string; kind: string; ref: string | null; created_at: string }>;
  flags: Array<{ key: string; enabled: boolean }>; events_7d: Record<string, number>; waitlist_count: number;
};
const usd = (micros: number) => `$${(micros / 1_000_000).toFixed(2)}`;

// Founder tools: AI spending and kill switch, alerts, the safety review queue and event counts.
// No health records can be browsed here.
export function Admin() {
  const [token, setToken] = useState("");
  const [data, setData] = useState<Data | null>(null);
  const [msg, setMsg] = useState("");
  const [limit, setLimit] = useState("");
  const load = async () => {
    const res = await fetch("/v1/admin", { headers: { "x-admin-token": token }, cache: "no-store" });
    if (!res.ok) { setMsg("That token didn't work."); setData(null); return; }
    setMsg(""); setData(await res.json());
  };
  const post = async (body: unknown) => {
    const res = await fetch("/v1/admin", { method: "POST", headers: { "x-admin-token": token, "content-type": "application/json" }, body: JSON.stringify(body) });
    setMsg(res.ok ? "Saved." : "That change was refused.");
    await load();
  };
  const ai = data?.flags.find((f) => f.key === "ai_enabled")?.enabled;
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="t-headline">Founder tools</h1>
      <Field label="Founder token"><input className={inputClass} type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" /></Field>
      <Button onClick={load} disabled={!token}>Open</Button>
      {msg && <p role="status" className="t-caption text-ink">{msg}</p>}
      {data && (
        <>
          <Card className="flex flex-col gap-3">
            <Label>AI spending this month</Label>
            <p className="t-title tabular">{usd(data.month_spent_micros)} of {usd(data.ai_settings.monthly_limit_micros)}</p>
            <Caption>{data.ai_calls_24h} checks in the last 24 hours, {data.ai_failures_24h} failed. When the limit is reached, the ingredient check pauses for everyone and meals still save.</Caption>
            <Field label="Monthly limit in US dollars"><input className={inputClass} inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value.replace(/[^0-9.]/g, ""))} /></Field>
            <Button variant="secondary" disabled={!limit} onClick={() => post({ what: "monthly_limit_usd", value: Number(limit) })}>Set limit</Button>
            <Button variant={ai ? "danger" : "secondary"} onClick={() => post({ what: "flag", key: "ai_enabled", enabled: !ai })}>{ai ? "Turn all AI off now (kill switch)" : "Turn AI back on"}</Button>
          </Card>
          <Card><Label>Alerts</Label>{data.alerts.length ? <ul className="mt-2">{data.alerts.map((a) => <li key={a.id} className="border-b border-line py-2 last:border-0"><span className="font-semibold">{a.kind}</span> <span className="t-caption">{a.created_at.slice(0, 16).replace("T", " ")} · {JSON.stringify(a.detail)}</span></li>)}</ul> : <Caption className="mt-2">No alerts.</Caption>}</Card>
          <Card><Label>Safety review queue</Label><Caption className="mt-1">Worse card taps, &quot;I felt worse&quot; endings and wellbeing pauses. Review within 7 days.</Caption>{data.review_queue.length ? <ul className="mt-2">{data.review_queue.map((r) => <li key={r.id} className="border-b border-line py-2 last:border-0">{r.kind} · {r.ref} <span className="t-caption">{r.created_at.slice(0, 10)}</span></li>)}</ul> : <Caption className="mt-2">Nothing waiting.</Caption>}</Card>
          <Card><Label>Events, last 7 days</Label><ul className="mt-2">{Object.entries(data.events_7d).map(([k, v]) => <li key={k} className="flex justify-between border-b border-line py-1 last:border-0"><span>{k}</span><span className="tabular">{v}</span></li>)}</ul><Caption className="mt-2">Counts only. No health values, food, symptoms or free text. Waitlist: {data.waitlist_count}.</Caption></Card>
        </>
      )}
    </main>
  );
}
