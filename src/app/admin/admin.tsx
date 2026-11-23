"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { browserSupabase } from "@/lib/client/supabase";
import { Button, Caption, Card, Field, Label, inputClass } from "@/components/ui";

type Data = {
  ai_settings: { monthly_limit_micros: number; expected_cost_micros: number }; month_spent_micros: number; ai_calls_24h: number; ai_failures_24h: number;
  alerts: Array<{ id: string; kind: string; detail: Record<string, unknown>; created_at: string }>;
  review_queue: Array<{ id: string; kind: string; ref: string | null; created_at: string }>;
  flags: Array<{ key: string; enabled: boolean }>; events_7d: Record<string, number>; waitlist_count: number;
};
const usd = (micros: number) => `$${(micros / 1_000_000).toFixed(2)}`;

// Founder tools: AI spending and kill switch, alerts, the safety review queue and event counts.
// No health records can be browsed here. Entry needs a staff account and a second sign-in step.
type Step = "checking" | "signed_out" | "enrol" | "code" | "open";

export function Admin() {
  const [step, setStep] = useState<Step>("checking");
  const [data, setData] = useState<Data | null>(null);
  const [msg, setMsg] = useState("");
  const [limit, setLimit] = useState("");
  const [code, setCode] = useState("");
  const [factor, setFactor] = useState<{ id: string; qr?: string; secret?: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/v1/admin", { cache: "no-store" });
    if (res.ok) { setData(await res.json()); setStep("open"); return; }
    await res.text().catch(() => ""); // always read the answer, so the request is closed
    setData(null);
    if (res.status !== 403) { setStep("signed_out"); return; }
    // Signed in as staff, but this session has not passed the second step yet.
    const mfa = browserSupabase().auth.mfa;
    const { data: list } = await mfa.listFactors();
    const ready = list?.totp?.[0];
    if (ready) { setFactor({ id: ready.id }); setStep("code"); return; }
    for (const f of list?.all ?? []) if (f.status !== "verified") await mfa.unenroll({ factorId: f.id });
    const { data: made, error } = await mfa.enroll({ factorType: "totp", friendlyName: `Founder tools ${Date.now()}` });
    if (error || !made) { setMsg("The second step could not be set up. Try again."); setStep("signed_out"); return; }
    setFactor({ id: made.id, qr: made.totp.qr_code, secret: made.totp.secret });
    setStep("enrol");
  }, []);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const verify = async () => {
    if (!factor) return;
    setBusy(true); setMsg("");
    const { error } = await browserSupabase().auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    setBusy(false); setCode("");
    if (error) { setMsg("That code didn't work. Check the app and try again."); return; }
    await load();
  };
  // One change at a time: while a change and the reload after it are on their way, the buttons wait,
  // so a double tap sends one request (one change, one audit record).
  const posting = useRef(false);
  const [saving, setSaving] = useState(false);
  const post = async (body: unknown) => {
    if (posting.current) return;
    posting.current = true; setSaving(true); setMsg("");
    try {
      const res = await fetch("/v1/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      await res.text().catch(() => "");
      setMsg(res.ok ? "Saved." : "That change was refused.");
      await load();
    } catch {
      setMsg("That didn't work. Check your connection and try again.");
    } finally {
      posting.current = false; setSaving(false);
    }
  };
  const ai = data?.flags.find((f) => f.key === "ai_enabled")?.enabled;
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="t-headline">Founder tools</h1>
      {step === "checking" && <Caption>Checking your sign-in.</Caption>}
      {step === "signed_out" && (
        <Card className="flex flex-col gap-3">
          <p className="t-body">Founder tools need a staff account.</p>
          <a className="t-body-strong underline" href="/sign-in">Sign in</a>
        </Card>
      )}
      {(step === "enrol" || step === "code") && (
        <Card className="flex flex-col gap-3">
          <Label>Second sign-in step</Label>
          {step === "enrol" && factor?.qr && (
            <>
              <Caption>Scan this with an authenticator app on your phone. You only do this once.</Caption>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={factor.qr} alt="Code to scan with your authenticator app" width={176} height={176} />
              <Caption>Or type this key into the app: <span className="tabular break-all">{factor.secret}</span></Caption>
            </>
          )}
          <Field label="6-digit code from your app"><input className={inputClass} inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} /></Field>
          <Button onClick={verify} disabled={busy || code.length !== 6}>Continue</Button>
        </Card>
      )}
      {msg && <p role="status" className="t-caption text-ink">{msg}</p>}
      {data && (
        <>
          <Card className="flex flex-col gap-3">
            <Label>AI spending this month</Label>
            <p className="t-title tabular">{usd(data.month_spent_micros)} of {usd(data.ai_settings.monthly_limit_micros)}</p>
            <Caption>{data.ai_calls_24h} checks in the last 24 hours, {data.ai_failures_24h} failed. When the limit is reached, the ingredient check pauses for everyone and meals still save.</Caption>
            <Field label="Monthly limit in US dollars"><input className={inputClass} inputMode="decimal" value={limit} onChange={(e) => setLimit(e.target.value.replace(/[^0-9.]/g, ""))} /></Field>
            <Button variant="secondary" disabled={!limit || saving} onClick={() => post({ what: "monthly_limit_usd", value: Number(limit) })}>Set limit</Button>
            <Button variant={ai ? "danger" : "secondary"} disabled={saving} onClick={() => post({ what: "flag", key: "ai_enabled", enabled: !ai })}>{ai ? "Turn all AI off now (kill switch)" : "Turn AI back on"}</Button>
          </Card>
          <Card><Label>Alerts</Label>{data.alerts.length ? <ul className="mt-2">{data.alerts.map((a) => <li key={a.id} className="border-b border-line py-2 last:border-0"><span className="font-semibold">{a.kind}</span> <span className="t-caption">{a.created_at.slice(0, 16).replace("T", " ")} · {JSON.stringify(a.detail)}</span></li>)}</ul> : <Caption className="mt-2">No alerts.</Caption>}</Card>
          <Card><Label>Safety review queue</Label><Caption className="mt-1">Worse card taps, &quot;I felt worse&quot; endings and wellbeing pauses. Review within 7 days.</Caption>{data.review_queue.length ? <ul className="mt-2">{data.review_queue.map((r) => <li key={r.id} className="border-b border-line py-2 last:border-0">{r.kind} · {r.ref} <span className="t-caption">{r.created_at.slice(0, 10)}</span></li>)}</ul> : <Caption className="mt-2">Nothing waiting.</Caption>}</Card>
          <Card><Label>Events, last 7 days</Label><ul className="mt-2">{Object.entries(data.events_7d).map(([k, v]) => <li key={k} className="flex justify-between border-b border-line py-1 last:border-0"><span>{k}</span><span className="tabular">{v}</span></li>)}</ul><Caption className="mt-2">Counts only. No health values, food, symptoms or free text. Waitlist: {data.waitlist_count}.</Caption></Card>
        </>
      )}
    </main>
  );
}
