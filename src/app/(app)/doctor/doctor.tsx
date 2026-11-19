"use client";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button, Caption, Card, Chip, Field, Label, SaveStatus, inputClass } from "@/components/ui";
import { ProScreen } from "@/components/pro";
import { useLoad, useSave } from "@/lib/client/hooks";
import { api } from "@/lib/client/api";
import { question } from "@/lib/registry";
import type { State } from "@/components/today/types";
import { DoctorReportView } from "@/components/report/doctor-report";
import { DOCTOR_SECTIONS, DOCTOR_SECTION_NAMES } from "@/lib/domain/report-privacy";

const SECTIONS: Array<[string, string]> = DOCTOR_SECTIONS.map((k) => [k, DOCTOR_SECTION_NAMES[k]]);
type Made = { id: string; snapshot: Parameters<typeof DoctorReportView>[0]["snapshot"]; pdf_url: string };
type Share = { url: string; expires_at: string; share_id: string; note: string };
const iso = (d: Date) => d.toISOString().slice(0, 10);

// Screen 37: the doctor-ready report. Page 1 is a one-page summary.
export function Doctor() {
  const q = useSearchParams();
  const st = useLoad<State>("/v1/me/state");
  const [from, setFrom] = useState(() => q.get("from") ?? iso(new Date(Date.now() - 60 * 86400000)));
  const [to, setTo] = useState(() => q.get("to") ?? iso(new Date(Date.now() - 86400000)));
  const [questions, setQuestions] = useState("");
  const [off, setOff] = useState<string[]>([]);
  const [made, setMade] = useState<Made | null>(null);
  const [recipient, setRecipient] = useState("");
  const [purpose, setPurpose] = useState("");
  const [days, setDays] = useState(7);
  const [agree, setAgree] = useState(false);
  const [share, setShare] = useState<Share | null>(null);
  const [revoked, setRevoked] = useState(false);
  const make = useSave<Made>();
  const shareSave = useSave<Share>();
  const revoke = useSave();

  return (
    <ProScreen title="Doctor report" eyebrow="Patterns" back="/insights" load={st}>
      {() => (
        <>
          <Caption>A report of your own records to bring to an appointment. Everything in it is self-reported.</Caption>
          <section className="flex flex-col gap-3" aria-labelledby="range">
            <Label id="range">Date range</Label>
            <div className="grid grid-cols-2 gap-2">
              <Field label="From"><input type="date" className={inputClass} value={from} max={to} onChange={(e) => { setFrom(e.target.value); setMade(null); }} /></Field>
              <Field label="To"><input type="date" className={inputClass} value={to} min={from} onChange={(e) => { setTo(e.target.value); setMade(null); }} /></Field>
            </div>
            <Caption>Up to 92 days.</Caption>
          </section>
          <Field label={question("PD-01").prompt} hint={`${questions.length}/600 · printed in its own box on page 1`}>
            <textarea className={`${inputClass} min-h-28 py-3`} maxLength={600} value={questions} onChange={(e) => { setQuestions(e.target.value); setMade(null); }} />
          </Field>
          <section className="flex flex-col gap-3" aria-labelledby="sections">
            <Label id="sections">Sections to include</Label>
            <div className="flex flex-wrap gap-2">{SECTIONS.map(([k, name]) => <Chip key={k} selected={!off.includes(k)} onClick={() => { setOff((o) => (o.includes(k) ? o.filter((x) => x !== k) : [...o, k])); setMade(null); }}>{name}</Chip>)}</div>
          </section>
          <SaveStatus state={make.state === "saved" ? "idle" : make.state} error={make.error} />
          {!made && (
            <Button disabled={make.saving} onClick={async () => {
              const out = await make.run("POST", "/v1/reports", { kind: "doctor", from, to, ...(questions.trim() ? { questions: questions.trim() } : {}), sections: Object.fromEntries(off.map((k) => [k, false])) });
              if (out) { setMade(out); setShare(null); setRevoked(false); }
            }}>{make.saving ? "Preparing…" : "Preview report"}</Button>
          )}

          {made && (
            <>
              <section className="flex flex-col gap-2" aria-labelledby="preview">
                <Label id="preview">Preview: everything the PDF and the shared link will contain</Label>
                <Caption>Sections you switched off are left out of every part of the report, including the summary.</Caption>
                <Card className="flex flex-col gap-2"><DoctorReportView snapshot={made.snapshot} /></Card>
              </section>
              <a href={made.pdf_url} className="inline-flex min-h-12 items-center justify-center rounded-sm bg-brand px-5 font-semibold text-on-brand no-underline" download>Download PDF</a>
              <Caption>Downloaded copies can&apos;t be recalled. Once you save or send the file, Bloat can no longer remove it.</Caption>

              <section className="flex flex-col gap-3" aria-labelledby="share">
                <Label id="share">Share by link</Label>
                {share && !revoked ? (
                  <Card className="flex flex-col gap-2">
                    <p className="t-body-strong">Link ready</p>
                    <p className="break-all tabular">{typeof location !== "undefined" ? location.origin : ""}{share.url}</p>
                    <Caption>Works until {new Date(share.expires_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}. This link is shown once: copy it now. {share.note}</Caption>
                    <SaveStatus state={revoke.state === "saved" ? "idle" : revoke.state} error={revoke.error} onCheck={async () => { if ((await revoke.check()).ok) setRevoked(true); }} />
                    <Button variant="danger" disabled={revoke.saving} onClick={async () => { if ((await revoke.run("DELETE", `/v1/reports/${made.id}/shares?share=${share.share_id}`)) !== null) setRevoked(true); }}>{revoke.saving ? "Revoking…" : "Revoke link"}</Button>
                  </Card>
                ) : (
                  <>
                    {revoked && <Card><p role="status">The link has been revoked. It no longer opens the report.</p></Card>}
                    <Field label="Who is it for?"><input className={inputClass} maxLength={120} value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="For example: my GP" /></Field>
                    <Field label="What is it for?"><input className={inputClass} maxLength={200} value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="For example: appointment on Friday" /></Field>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Link works for">{[1, 7, 14, 30].map((n) => <Chip key={n} role="radio" selected={days === n} onClick={() => setDays(n)}>{n} {n === 1 ? "day" : "days"}</Chip>)}</div>
                    <label className="flex items-start gap-3">
                      <input type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-(--brand)" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                      <span>I agree to share this report with {recipient || "this person"} through a link that works for {days} {days === 1 ? "day" : "days"}. Anyone with the link can read it until it expires or I revoke it.</span>
                    </label>
                    <SaveStatus state={shareSave.state === "saved" ? "idle" : shareSave.state} error={shareSave.error} />
                    <Button variant="secondary" disabled={!agree || !recipient.trim() || !purpose.trim() || shareSave.saving} onClick={async () => {
                      const out = await shareSave.run("POST", `/v1/reports/${made.id}/shares`, { recipient: recipient.trim(), purpose: purpose.trim(), expires_in_days: days, consent: true });
                      if (out) { setShare(out); setRevoked(false); setAgree(false); }
                    }}>Create share link</Button>
                  </>
                )}
              </section>
            </>
          )}
        </>
      )}
    </ProScreen>
  );
}
