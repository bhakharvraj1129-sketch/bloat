"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Caption, Card, Label, SaveStatus, Sheet } from "@/components/ui";
import { QuestionField } from "@/components/question";
import { ProScreen } from "@/components/pro";
import { useLoad, useSave } from "@/lib/client/hooks";
import { ApiFailure } from "@/lib/client/api";
import { sheetsSettled } from "@/lib/client/nav";

type Offer = { key: string; name: string; type: string; offered: boolean; reason: string | null; instruction: string; source: string; warning?: string | null; swap?: string };
type Data = {
  active: null | { id: string; name: string; phase: string; day: number; of: number };
  prior_confirmed_days: number; prior_needed: number; habit: Offer[]; swap: Offer[];
  swap_check: { needed: boolean; passed: boolean; blocked_by_condition: boolean };
  past: Array<{ id: string; name: string; phase: string; started_on: string }>; helpline: string | null; stop_line: string;
};
type Note = { text: string; helpline?: string | null; help_link?: boolean };

// Screens 31 and 32: choose an experiment; swaps go through the safety check first.
export function Experiments() {
  const router = useRouter();
  const load = useLoad<Data>("/v1/experiments");
  const [pick, setPick] = useState<Offer | null>(null);
  const [check, setCheck] = useState(false);
  const [fx, setFx] = useState<Record<string, string | null>>({});
  const [notes, setNotes] = useState<Note[] | null>(null);
  const start = useSave<{ experiment: { id: string } }>();
  // Close the sheet and let it tidy its history step first, so Back from the new experiment returns here.
  const open = async (id: string) => { setPick(null); await sheetsSettled(); router.push(`/experiments/${id}`); };
  const fxSave = useSave<{ passed: boolean; notes: Note[] }>();

  return (
    <ProScreen title="Experiments" eyebrow="Patterns" back="/insights" load={load}>
      {(d) => {
        const ready = d.prior_confirmed_days >= d.prior_needed;
        const row = (o: Offer) => (
          <Card as="li" key={o.key} className="flex flex-col gap-2">
            <p className="t-body-strong">{o.name}</p>
            <p>{o.instruction}</p>
            <Caption>{o.type === "habit" ? "7 days" : "Up to 2 weeks, then 1 week adding it back"} · Source: {o.source}</Caption>
            {o.warning && <Caption>{o.warning}</Caption>}
            {o.offered ? <Button variant="secondary" disabled={!!d.active} onClick={() => { start.reset(); setPick(o); }}>Choose</Button> : <Caption>{o.reason}</Caption>}
          </Card>
        );
        return (
          <>
            <Caption>One experiment at a time. Check with your doctor before changing your diet. {d.stop_line}. <Link href="/help">When to get medical help</Link></Caption>
            {d.active && (
              <Card className="flex flex-col gap-2 bg-brand-tint">
                <Label>Running now</Label>
                <p className="t-body-strong">{d.active.name}</p>
                <Caption>{d.active.phase === "PAUSED" ? "Paused" : d.active.phase === "ADDING_BACK" ? `Adding back, day ${d.active.day} of ${d.active.of}` : `Day ${d.active.day} of ${d.active.of}`}</Caption>
                <Link href={`/experiments/${d.active.id}`} className="font-semibold">Open</Link>
              </Card>
            )}
            {!ready && !d.active && <Card><p>Log normally for a few more days first.</p><Caption>An experiment needs 4 confirmed days in the week before it starts. You have {d.prior_confirmed_days}.</Caption></Card>}

            <section className="flex flex-col gap-2" aria-labelledby="habit">
              <Label id="habit">Habit experiments</Label>
              <ul className="flex flex-col gap-3">{d.habit.map(row)}</ul>
            </section>

            <section className="flex flex-col gap-2" aria-labelledby="swap">
              <Label id="swap">Food swap experiments</Label>
              <Caption>You swap one food for a named alternative, so nothing is missing from what you eat. Wheat and whole diets are never offered here.</Caption>
              {d.swap_check.blocked_by_condition ? (
                <Card><p>Swap experiments aren&apos;t offered with a condition in your health background.</p><Caption>Habit experiments and all your recording are still here.</Caption></Card>
              ) : d.swap_check.needed ? (
                <Card className="flex flex-col gap-3">
                  <p>Four safety questions come first. They are asked before each swap.</p>
                  <Button variant="secondary" onClick={() => { setFx({}); setNotes(null); fxSave.reset(); setCheck(true); }}>Answer the safety questions</Button>
                </Card>
              ) : null}
              {notes && notes.map((n) => (
                <Card key={n.text}><p>{n.text}</p>{n.helpline && <p className="mt-1 font-semibold">{n.helpline}</p>}{n.help_link && <Link href="/help" className="font-semibold">When to get medical help</Link>}</Card>
              ))}
              <ul className="flex flex-col gap-3">{d.swap.map(row)}</ul>
            </section>

            {d.past.length > 0 && (
              <section className="flex flex-col gap-2" aria-labelledby="past">
                <Label id="past">Finished</Label>
                <Card className="px-4 py-1"><ul>{d.past.map((p) => <li key={p.id} className="border-b border-line last:border-0"><Link href={`/experiments/${p.id}`} className="flex min-h-12 items-center justify-between text-ink no-underline"><span className="font-semibold">{p.name}</span><span className="t-caption">{p.phase === "COMPLETED" ? "Result" : "Ended early"}</span></Link></li>)}</ul></Card>
              </section>
            )}

            <Sheet open={!!pick} onOpenChange={(o) => { if (!o) setPick(null); }} title={pick?.name ?? ""}>
              <p>{pick?.instruction}</p>
              {pick?.warning && <p className="font-semibold">{pick.warning}</p>}
              <Caption>{d.stop_line}. You can end it at any time. Each day Bloat asks whether you did it.</Caption>
              {start.error && start.error.code !== "NETWORK" && <p role="alert" className="t-caption text-ink">{start.error.message}</p>}
              {start.state === "unknown" && <SaveStatus state="unknown" error={start.error} onCheck={async () => { const r = await start.check(); if (r.ok && r.value) await open(r.value.experiment.id); }} />}
              <Button disabled={start.saving} onClick={async () => {
                const out = await start.run("POST", "/v1/experiments", { key: pick!.key });
                if (out) await open(out.experiment.id);
              }}>{start.saving ? "Starting…" : "Start today"}</Button>
            </Sheet>

            <Sheet open={check} onOpenChange={setCheck} title="Before a food swap">
              <Caption>&quot;Prefer not to say&quot; is fine. Swaps are only offered when every answer is No.</Caption>
              {["FX-01", "FX-02", "FX-03", "FX-04"].map((id) => <QuestionField key={id} id={id} value={fx[id] ?? null} onChange={(v) => setFx((f) => ({ ...f, [id]: v as string | null }))} />)}
              <SaveStatus state={fxSave.state === "saved" ? "idle" : fxSave.state} error={fxSave.error} />
              <Button disabled={fxSave.saving || ["FX-01", "FX-02", "FX-03", "FX-04"].some((id) => !fx[id])} onClick={async () => {
                try {
                  const out = await fxSave.run("POST", "/v1/experiments/checks", { fx01: fx["FX-01"], fx02: fx["FX-02"], fx03: fx["FX-03"], fx04: fx["FX-04"] });
                  if (out) { setNotes(out.notes); setCheck(false); load.reload(); }
                } catch (e) { if (!(e instanceof ApiFailure)) throw e; }
              }}>{fxSave.saving ? "Saving…" : "Continue"}</Button>
            </Sheet>
          </>
        );
      }}
    </ProScreen>
  );
}
