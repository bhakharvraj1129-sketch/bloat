"use client";
import Link from "next/link";
import { useState } from "react";
import { Lock } from "lucide-react";
import { Button, Caption, Chip, Field, Label, ProTag, SaveStatus, Segmented, Sheet, inputClass } from "@/components/ui";
import { QuestionField } from "@/components/question";
import { TimePick, timeMissing, type TimeValue } from "@/components/timepick";
import { useSave } from "@/lib/client/hooks";
import { deviceZone } from "@/lib/client/api";
import { activities, ACTIVITY_GROUP_LABELS, PRO_ACTIVITY_IDS, question } from "@/lib/registry";
import type { State } from "./types";

type Props = { open: boolean; onOpenChange: (o: boolean) => void; state: State; onSaved: () => void };

const DETAILS: Record<string, { label: string; options: string[] }> = {
  "ACT-08": { label: "How long?", options: ["10 minutes", "20 minutes", "30+ minutes"] },
  "ACT-09": { label: "How hard?", options: ["Light", "Moderate", "Hard"] },
  "ACT-12": { label: "How much?", options: ["Low", "Medium", "High"] },
};

// Screen 22. A tap means it happened. Anything you don't tap stays unknown, never "No".
export function ActivitySheet({ open, onOpenChange, state, onSaved, onExercise }: Props & { onExercise: () => void }) {
  const pro = state.plan === "pro";
  const [picked, setPicked] = useState<string[]>([]);
  const [detail, setDetail] = useState<Record<string, string>>({});
  const [cups, setCups] = useState("");
  const [more, setMore] = useState(false);
  const [cycle, setCycle] = useState<"start" | "end" | null>(null);
  const [cycleDate, setCycleDate] = useState(state.today.date);
  const save = useSave();
  const hidden = new Set(state.adaptive?.more_activities ?? []);

  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const visible = activities.filter((a) => a.id !== "ACT-16");
  const followed = visible.filter((a) => state.followed.includes(a.id));

  function chip(a: (typeof activities)[number]) {
    if (PRO_ACTIVITY_IDS.has(a.id) && !pro) {
      return <span key={a.id} className="inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line bg-surface px-4 text-ink-muted"><Lock size={16} strokeWidth={1.75} aria-hidden />{a.label}<ProTag /></span>;
    }
    return <Chip key={a.id} selected={picked.includes(a.id)} onClick={() => toggle(a.id)}>{a.label}</Chip>;
  }

  async function submit() {
    const taps = picked.map((id) => {
      const d: Record<string, string | number> = {};
      if (detail[id]) d.level = detail[id]!;
      if (id === "ACT-24" && Number(cups) > 0) d.cups = Number(cups);
      return Object.keys(d).length ? { activity_id: id, detail: d } : { activity_id: id };
    });
    const body: Record<string, unknown> = { taps };
    if (cycle) body.cycle = [{ kind: cycle, date: cycleDate, precision: "exact" }];
    const ok = await save.run("PUT", `/v1/days/${state.today.date}/activities`, body);
    if (ok) { onSaved(); onOpenChange(false); }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Add activity" dirty={(picked.length > 0 || !!cups.trim()) && !save.saving}>
      <Caption>Tap what happened today. Anything you don&apos;t tap stays unknown, not &quot;No&quot;.</Caption>
      {followed.length > 0 && (
        <div className="flex flex-col gap-2"><Label>Habits you follow</Label><div className="flex flex-wrap gap-2">{followed.map(chip)}</div></div>
      )}
      {Object.entries(ACTIVITY_GROUP_LABELS).map(([group, name]) => {
        const list = visible.filter((a) => a.group === group && !state.followed.includes(a.id) && (more || !hidden.has(a.id) || picked.includes(a.id)));
        if (!list.length) return null;
        return <div key={group} className="flex flex-col gap-2"><Label>{name}</Label><div className="flex flex-wrap gap-2">{list.map(chip)}</div></div>;
      })}
      {!more && hidden.size > 0 && <Button variant="quiet" full={false} onClick={() => setMore(true)}>More</Button>}
      {picked.filter((id) => DETAILS[id]).map((id) => (
        <div key={id} className="flex flex-col gap-2">
          <p className="t-body-strong">{activities.find((a) => a.id === id)?.label}: {DETAILS[id]!.label}</p>
          <Segmented label={DETAILS[id]!.label} value={detail[id] ?? null} onChange={(v) => setDetail((d) => ({ ...d, [id]: v }))} options={DETAILS[id]!.options.map((o) => ({ value: o, label: o }))} />
        </div>
      ))}
      {picked.includes("ACT-24") && <Field label="Tea or coffee: how many cups? (optional)"><input className={inputClass} inputMode="numeric" value={cups} onChange={(e) => setCups(e.target.value.replace(/\D/g, ""))} /></Field>}
      {state.cycle_context && (
        <div className="flex flex-col gap-2">
          <Label>Period</Label>
          <div className="flex flex-wrap gap-2">
            <Chip selected={cycle === "start"} onClick={() => setCycle(cycle === "start" ? null : "start")}>{question("CY-01").prompt}</Chip>
            <Chip selected={cycle === "end"} onClick={() => setCycle(cycle === "end" ? null : "end")}>{question("CY-02").prompt}</Chip>
          </div>
          {cycle && <Field label="Which day?"><input type="date" className={inputClass} value={cycleDate} max={state.today.date} onChange={(e) => setCycleDate(e.target.value)} /></Field>}
        </div>
      )}
      {pro ? (
        <Button variant="secondary" onClick={() => { onOpenChange(false); onExercise(); }}>Log a walk or exercise in detail</Button>
      ) : (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-line p-4 text-ink-muted">
          <span className="inline-flex items-center gap-2"><Lock size={18} strokeWidth={1.75} aria-hidden />Exercise log</span>
          <Link href="/upgrade" className="inline-flex min-h-11 items-center font-semibold">See Pro<ProTag /></Link>
        </div>
      )}
      <SaveStatus state={save.state} error={save.error} onCheck={async () => { if ((await save.check()).ok) { onSaved(); onOpenChange(false); } }} />
      <Button onClick={submit} disabled={(picked.length === 0 && !cycle) || save.saving}>{save.saving ? "Saving…" : "Save"}</Button>
    </Sheet>
  );
}

// Screen 23 (Pro): structured exercise. Minutes from the last meal are worked out by the server.
export function ExerciseSheet({ open, onOpenChange, state, onSaved }: Props) {
  const zone = deviceZone();
  const [type, setType] = useState<string | null>(null);
  const [when, setWhen] = useState<TimeValue>({ mode: "now", zone });
  const [length, setLength] = useState<string | null>(null);
  const [minutes, setMinutes] = useState("");
  const [intensity, setIntensity] = useState<string | null>(null);
  const [near, setNear] = useState<string | null>(null);
  const save = useSave();
  const mins = length === "enter_minutes" ? Number(minutes) : length ? Number(length.replace("_min", "")) : 0;
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Log exercise" dirty={!!type && !save.saving}>
      <QuestionField id="EX-01" value={type} onChange={(v) => setType(v as string | null)} />
      <div className="flex flex-col gap-3"><p className="t-body-strong">{question("EX-02").prompt}</p><TimePick name="When did you start?" value={when} onChange={setWhen} /></div>
      <QuestionField id="EX-03" value={length} onChange={(v) => setLength(v as string | null)} />
      {length === "enter_minutes" && <Field label="Minutes"><input className={inputClass} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ""))} /></Field>}
      <QuestionField id="EX-04" value={intensity} onChange={(v) => setIntensity(v as string | null)} />
      <QuestionField id="EX-05" value={near} onChange={(v) => setNear(v as string | null)} />
      <SaveStatus state={save.state} error={save.error} onCheck={async () => { if ((await save.check()).ok) { onSaved(); onOpenChange(false); } }} />
      <Button disabled={!type || !(mins > 0) || timeMissing(when) || save.saving} onClick={async () => {
        const started = when.mode === "now" || when.mode === "unknown" ? { mode: "now", zone } : when;
        const ok = await save.run("POST", "/v1/exercise", { type, started, minutes: mins, ...(intensity ? { intensity } : {}), ...(near ? { meal_relation: near } : {}) });
        if (ok) { onSaved(); onOpenChange(false); }
      }}>{save.saving ? "Saving…" : "Save"}</Button>
      {state.plan !== "pro" && <Caption>The exercise log is part of Bloat Pro.</Caption>}
    </Sheet>
  );
}

// Screen 24 (Pro): bowel record. Plain descriptions; never a label and never an alert.
export function BowelSheet({ open, onOpenChange, onSaved }: Props) {
  const zone = deviceZone();
  const [when, setWhen] = useState<TimeValue>({ mode: "now", zone });
  const [look, setLook] = useState<string | null>(null);
  const [strain, setStrain] = useState<string | null>(null);
  const [complete, setComplete] = useState<string | null>(null);
  const save = useSave();
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Log bowel movement" dirty={(!!look || !!strain || !!complete) && !save.saving}>
      <div className="flex flex-col gap-3"><p className="t-body-strong">When?</p><TimePick name="When?" value={when} onChange={setWhen} /></div>
      <QuestionField id="BW-02" value={look} onChange={(v) => setLook(v as string | null)} hide={["skip"]} />
      <QuestionField id="BW-03" value={strain} onChange={(v) => setStrain(v as string | null)} hide={["skip"]} />
      <QuestionField id="BW-04" value={complete} onChange={(v) => setComplete(v as string | null)} hide={["skip"]} />
      <SaveStatus state={save.state} error={save.error} onCheck={async () => { if ((await save.check()).ok) { onSaved(); onOpenChange(false); } }} />
      <Button disabled={timeMissing(when) || save.saving} onClick={async () => {
        const occurred = when.mode === "now" || when.mode === "unknown" ? { mode: "now", zone } : when;
        const ok = await save.run("POST", "/v1/bowel", { occurred, ...(look ? { stool_type: look } : {}), ...(strain ? { strain } : {}), ...(complete ? { complete } : {}) });
        if (ok) { onSaved(); onOpenChange(false); }
      }}>{save.saving ? "Saving…" : "Save"}</Button>
    </Sheet>
  );
}
