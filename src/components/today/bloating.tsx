"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { Advice, Button, Caption, Chip, ChipGroup, Label, ProTag, SaveStatus, Sheet, StrengthScale, ScoreBadge } from "@/components/ui";
import { QuestionField } from "@/components/question";
import { AmbiguousChoice, TimePick, type TimeValue } from "@/components/timepick";
import { useSave } from "@/lib/client/hooks";
import { deviceZone } from "@/lib/client/api";
import { options, question } from "@/lib/registry";
import { COMMON_SYMPTOM_LEVEL, commonSymptomSentence, levelSentence, NHS_SOURCE_LABEL, type HelpLevel } from "@/lib/wording";
import { formatClock, formatDuration } from "@/lib/time";
import type { State } from "./types";

type SheetProps = { open: boolean; onOpenChange: (o: boolean) => void; state: State; onSaved: () => void };
type AdviceItem = { code: string; sentence: string; source: string };

function ProLocked({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-lg border border-line p-4 text-ink-muted">
      <span className="inline-flex items-center gap-2"><Lock size={18} strokeWidth={1.75} aria-hidden />{label}</span>
      <Link href="/upgrade" className="inline-flex min-h-11 items-center font-semibold">See Pro<ProTag /></Link>
    </div>
  );
}

/** EP-08a: nine NHS warning signs. Each selected sign shows its NHS sentence inline. They never move or hide. */
export function WarningChips({ value, onChange, country }: { value: string[]; onChange: (v: string[]) => void; country: string }) {
  const levels = question("EP-08a").nhs_level ?? {};
  const shown = value.filter((v) => v !== "none");
  return (
    <div className="flex flex-col gap-3">
      <p id="ep08a" className="t-body-strong">{question("EP-08a").prompt}</p>
      <ChipGroup labelledBy="ep08a">
        {options("EP-08a").map((o) => {
          const on = value.includes(o.value);
          return (
            <Chip key={o.value} selected={on} tone={o.exclusive ? "brand" : "alert"}
              onClick={() => onChange(on ? value.filter((v) => v !== o.value) : o.exclusive ? [o.value] : [...value.filter((v) => v !== "none"), o.value])}>
              {o.label}
            </Chip>
          );
        })}
      </ChipGroup>
      <Advice items={shown.map((code) => ({ code, sentence: levelSentence(levels[code] as HelpLevel, country), source: NHS_SOURCE_LABEL }))} />
    </div>
  );
}

// Screen 16: start an episode in two taps (strength, Save).
export function LogBloatingSheet({ open, onOpenChange, state, onSaved }: SheetProps) {
  const [strength, setStrength] = useState<number | null>(null);
  const [when, setWhen] = useState<TimeValue>({ mode: "now", zone: deviceZone() });
  const [warnings, setWarnings] = useState<string[]>([]);
  const [feel, setFeel] = useState<string[] | null>(null);
  const [symptoms, setSymptoms] = useState<string[] | null>(null);
  const [more, setMore] = useState(false);
  const [advice, setAdvice] = useState<AdviceItem[] | null>(null);
  const save = useSave<{ advice: AdviceItem[] }>();
  const pro = state.plan === "pro";
  const hidden = state.adaptive?.more_symptoms ?? [];

  useEffect(() => {
    if (open) { setStrength(null); setWhen({ mode: "now", zone: deviceZone() }); setWarnings([]); setFeel(null); setSymptoms(null); setAdvice(null); setMore(false); save.reset(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  async function submit(offset?: number) {
    const started = when.mode === "now" || when.mode === "unknown" ? { mode: "now", zone: deviceZone() } : { ...when, ...(offset !== undefined ? { offset_min: offset } : {}) };
    const body: Record<string, unknown> = { strength, started };
    if (warnings.length) body.warning_signs = warnings;
    if (pro && feel?.length) body.feel = feel;
    if (pro && symptoms?.length) body.symptoms = symptoms;
    const out = await save.run("POST", "/v1/episodes", body);
    if (out) {
      onSaved();
      // Advice from the server (NHS sentences) stays on screen until the user closes the sheet.
      if (out.advice.length) setAdvice(out.advice); else onOpenChange(false);
    }
  }

  if (advice) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title="Saved">
        <p>Your bloating is being recorded. Nothing in Bloat has been paused.</p>
        <Advice items={advice} />
        <Button onClick={() => onOpenChange(false)}>Done</Button>
      </Sheet>
    );
  }

  const symptomPreview = (symptoms ?? []).filter((c) => c in COMMON_SYMPTOM_LEVEL).map((code) => ({ code, sentence: commonSymptomSentence(code)!, source: NHS_SOURCE_LABEL }));
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Log bloating">
      <div className="flex flex-col gap-3">
        <p className="t-body-strong">{question("EP-01").prompt}</p>
        <StrengthScale name="Strength, 1 to 10" value={strength} onChange={setStrength} />
        <Caption>This is how it feels to you. It is a record, not a danger scale.</Caption>
      </div>
      <div className="flex flex-col gap-3">
        <p className="t-body-strong">{question("EP-02").prompt}</p>
        <TimePick name="When did it start?" value={when} onChange={setWhen} labels={{ exact: "Earlier" }} />
      </div>
      <WarningChips value={warnings} onChange={setWarnings} country={state.profile.country} />
      {pro ? (
        <>
          <QuestionField id="EP-03" value={feel} onChange={(v) => setFeel(v as string[] | null)} hide={["skip"]} />
          <div className="flex flex-col gap-3">
            <QuestionField id="EP-08" value={symptoms} onChange={(v) => setSymptoms(v as string[] | null)} hide={["skip"]} optionFilter={(o) => more || !hidden.includes(o.value) || (symptoms ?? []).includes(o.value)} />
            {!more && hidden.length > 0 && <Button variant="quiet" full={false} onClick={() => setMore(true)}>More</Button>}
            <Advice items={symptomPreview} />
          </div>
        </>
      ) : (
        <ProLocked label="How it feels, other symptoms" />
      )}
      <Link href="/help" className="font-semibold">When to get medical help</Link>
      <AmbiguousChoice error={save.error} onChoose={(o) => submit(o)} />
      <SaveStatus state={save.state} error={save.error?.code === "AMBIGUOUS_TIME" ? null : save.error} onCheck={async () => { await save.check(); onSaved(); onOpenChange(false); }} />
      <Button onClick={() => submit()} disabled={strength === null || save.saving}>{save.saving ? "Saving…" : "Save"}</Button>
      {strength === null && <Caption>Choose a strength to save.</Caption>}
    </Sheet>
  );
}

function useTick(ms: number) {
  const [, set] = useState(0);
  useEffect(() => { const t = setInterval(() => set((n) => n + 1), ms); return () => clearInterval(t); }, [ms]);
}

// Screen 17: an open episode. The timer shows how long the record has been open; it proves nothing.
export function OngoingSheet({ open, onOpenChange, state, onSaved, onEnd }: SheetProps & { onEnd: (earlier: boolean) => void }) {
  useTick(30_000);
  const ep = state.open_episode;
  const [updating, setUpdating] = useState(false);
  const [strength, setStrength] = useState<number | null>(null);
  const save = useSave();
  if (!ep) return null;
  const startedMs = Date.parse(ep.started_at);
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Bloating now">
      <div className="flex items-center gap-4">
        <ScoreBadge value={ep.current_strength} size="lg" label={`Current strength ${ep.current_strength}`} />
        <div>
          <Label>Record open for</Label>
          <p className="t-title tabular">{formatDuration(Date.now() - startedMs)}</p>
          <Caption>Started {ep.start_precision === "approximate" ? "about " : ""}{formatClock(startedMs, state.profile.time_zone, state.profile.units)}</Caption>
        </div>
      </div>
      <Button size="lg" onClick={() => onEnd(false)}>Bloating gone</Button>
      {updating ? (
        <div className="flex flex-col gap-3">
          <p className="t-body-strong">How strong is it now?</p>
          <StrengthScale name="New strength reading" value={strength} onChange={setStrength} />
          <Button disabled={strength === null || save.saving} onClick={async () => { const ok = await save.run("POST", `/v1/episodes/${ep.id}/samples`, { strength }); if (ok) { setUpdating(false); setStrength(null); onSaved(); } }}>{save.saving ? "Saving…" : "Save reading"}</Button>
          <SaveStatus state={save.state} error={save.error} onCheck={async () => { await save.check(); onSaved(); }} />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => setUpdating(true)}>Update strength</Button>
          <Button variant="secondary" onClick={() => onEnd(true)}>Ended earlier</Button>
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label>Strength readings</Label>
        <ul className="rounded-lg border border-line px-4">
          {ep.samples.map((s, i) => (
            <li key={i} className="flex items-center justify-between border-b border-line py-3 last:border-0">
              <span className="t-caption tabular">{formatClock(Date.parse(s.observed_at), state.profile.time_zone, state.profile.units)}</span>
              <ScoreBadge value={s.strength} size="sm" />
            </li>
          ))}
        </ul>
      </div>
      <Link href="/help" className="font-semibold">When to get medical help</Link>
    </Sheet>
  );
}

// Screen 18: close an episode honestly. "I don't know" is a real answer and no end time is made up.
export function EndSheet({ open, onOpenChange, state, onSaved, earlier }: SheetProps & { earlier: boolean }) {
  const ep = state.open_episode;
  const zone = deviceZone();
  const [when, setWhen] = useState<TimeValue>({ mode: "now", zone });
  const [eased, setEased] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ lasted: string | null; strongest: number | null } | null>(null);
  const save = useSave<{ summary: { lasted: string | null; strongest: number | null } }>();
  useEffect(() => {
    if (open) { setWhen(earlier ? { mode: "exact", local: "", zone } : { mode: "now", zone }); setEased(null); setSummary(null); save.reset(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, earlier]);
  if (!ep && !summary) return null;

  async function submit(offset?: number) {
    const ended = when.mode === "unknown" ? { mode: "unknown" } : when.mode === "now" ? { mode: "now", zone } : { ...when, ...(offset !== undefined ? { offset_min: offset } : {}) };
    const body: Record<string, unknown> = { ended };
    if (state.plan === "pro" && eased) body.eased = eased;
    const out = await save.run("POST", `/v1/episodes/${ep!.id}/end`, body);
    if (out) { setSummary(out.summary); onSaved(); }
  }

  if (summary) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange} title="Bloating ended">
        <div className="flex items-center gap-4">
          <ScoreBadge value={summary.strongest} size="lg" />
          <div>
            <Label>Strongest</Label>
            <p className="t-title">{summary.lasted ? `Lasted ${summary.lasted}` : "End time not known"}</p>
            <Caption>Your Bloat Score for today is set in tomorrow&apos;s review.</Caption>
          </div>
        </div>
        <Button onClick={() => onOpenChange(false)}>Done</Button>
      </Sheet>
    );
  }
  const timeMissing = (when.mode === "exact" || when.mode === "approximate") && !when.local;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Bloating ended">
      <div className="flex flex-col gap-3">
        <p className="t-body-strong">{question("EP-06").prompt}</p>
        <TimePick name="When did it end?" value={when} onChange={setWhen} allowUnknown />
      </div>
      {state.plan === "pro" && <QuestionField id="EP-09" value={eased} onChange={(v) => setEased(v as string | null)} />}
      <AmbiguousChoice error={save.error} onChoose={(o) => submit(o)} />
      <SaveStatus state={save.state} error={save.error?.code === "AMBIGUOUS_TIME" ? null : save.error} onCheck={async () => { await save.check(); onSaved(); onOpenChange(false); }} />
      <Button onClick={() => submit()} disabled={save.saving || timeMissing}>{save.saving ? "Saving…" : "Save"}</Button>
    </Sheet>
  );
}

// Screen 19: asked on app open once an episode has been open 8 hours.
export function StillHappeningSheet({ open, onOpenChange, state, onSaved, onEnd }: SheetProps & { onEnd: () => void }) {
  const ep = state.open_episode;
  const save = useSave();
  if (!ep) return null;
  const answer = async (a: "yes" | "no" | "not_sure") => {
    const ok = await save.run("POST", `/v1/episodes/${ep.id}/still-happening`, { answer: a });
    if (!ok) return;
    onOpenChange(false);
    if (a === "no") onEnd(); else onSaved();
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Is it still happening?">
      <p>You logged bloating {formatDuration(Date.now() - Date.parse(ep.started_at))} ago and it is still open.</p>
      <div className="flex flex-col gap-2">
        <Button variant="secondary" onClick={() => answer("yes")} disabled={save.saving}>Yes</Button>
        <Button variant="secondary" onClick={() => answer("no")} disabled={save.saving}>No, it ended</Button>
        <Button variant="secondary" onClick={() => answer("not_sure")} disabled={save.saving}>Not sure</Button>
      </div>
      <Caption>Not sure keeps the record open. Bloat never fills in an end time for you.</Caption>
      <SaveStatus state={save.state === "saved" ? "idle" : save.state} error={save.error} />
    </Sheet>
  );
}
