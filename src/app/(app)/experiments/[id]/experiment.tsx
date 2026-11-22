"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Caption, Card, Label, SaveStatus, Sheet } from "@/components/ui";
import { QuestionField } from "@/components/question";
import { ProScreen } from "@/components/pro";
import { useLoad, useSave } from "@/lib/client/hooks";
import { formatDate } from "@/lib/time";

type Data = {
  experiment: { id: string; type: string; name: string; instruction: string; swap: string | null; source: string; phase: string; day: number; of: number; started_on: string };
  days: Array<{ date: string; answer: string }>; answered_today: boolean; today: string; wellbeing_due: boolean; helpline: string | null;
  stop_line: string; warning: string | null; result: null | { kind: string; text: string; help_link: boolean }; doctor_note: string | null; date_format: "MM/DD" | "DD/MM";
};
const ANSWER: Record<string, string> = { yes: "Yes", partly: "Partly", no: "No" };

// Screen 33: run an experiment and read its result in the fixed template.
export function Experiment({ id }: { id: string }) {
  const load = useLoad<Data>(`/v1/experiments/${id}/result`);
  const act = useSave<{ helpline?: string | null; message?: string | null; paused?: boolean }>();
  const [ending, setEnding] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [wb, setWb] = useState<Record<string, "yes" | "no" | null>>({});
  const [paused, setPaused] = useState<{ helpline: string | null; message: string | null } | null>(null);
  const post = async (path: string, body?: unknown) => { const out = await act.run("POST", `/v1/experiments/${id}/${path}`, body); if (out) load.reload(); return out; };

  return (
    <ProScreen title="Experiment" back="/experiments" load={load}>
      {(d) => {
        const e = d.experiment;
        const finished = e.phase === "COMPLETED" || e.phase === "ENDED_EARLY";
        return (
          <>
            <Card className="flex flex-col gap-2">
              <Label>{finished ? "Finished" : e.phase === "PAUSED" ? "Paused" : e.phase === "ADDING_BACK" ? `Adding back · day ${e.day} of ${e.of}` : `Day ${e.day} of ${e.of}`}</Label>
              <p className="t-title">{e.name}</p>
              {!finished && <p>{e.phase === "ADDING_BACK" ? "Eat it as you normally would this week. This shows what your scores do when it comes back." : e.instruction}</p>}
              {d.warning && <p className="font-semibold">{d.warning}</p>}
              <Caption>Source: {e.source} · started {formatDate(e.started_on, d.date_format, false)}</Caption>
            </Card>

            {!finished && <Caption>{d.stop_line}. <Link href="/help">When to get medical help</Link></Caption>}

            {e.phase === "RUNNING" && (
              <Card className="flex flex-col gap-3">
                <p className="t-body-strong">Did you do it today?</p>
                {d.answered_today ? <Caption>Today&apos;s answer is saved: {ANSWER[d.days.find((x) => x.date === d.today)?.answer ?? ""]}. Tap again to change it.</Caption> : null}
                <div className="grid grid-cols-3 gap-2">{(["yes", "partly", "no"] as const).map((a) => <Button key={a} variant="secondary" disabled={act.saving} onClick={() => post("days", { answer: a })}>{ANSWER[a]}</Button>)}</div>
              </Card>
            )}

            {d.wellbeing_due && e.phase !== "PAUSED" && (
              <Card className="flex flex-col gap-3">
                <p className="t-body-strong">A quick weekly check</p>
                {(["WB-01", "WB-02"] as const).map((q) => <QuestionField key={q} id={q} value={wb[q] ?? null} onChange={(v) => setWb((w) => ({ ...w, [q]: v as "yes" | "no" | null }))} />)}
                <Button variant="secondary" disabled={act.saving || !wb["WB-01"] || !wb["WB-02"]} onClick={async () => {
                  const out = await post("wellbeing", { wb01: wb["WB-01"], wb02: wb["WB-02"] });
                  if (out?.paused) setPaused({ helpline: out.helpline ?? null, message: out.message ?? null });
                }}>Save</Button>
              </Card>
            )}

            {e.phase === "PAUSED" && (
              <Card className="flex flex-col gap-3">
                <p>{paused?.message ?? "Your swap experiment is paused. You can end it or come back to it later. Support is available if food is a worry."}</p>
                {(paused?.helpline ?? d.helpline) && <p className="font-semibold">{paused?.helpline ?? d.helpline}</p>}
                <Button variant="secondary" disabled={act.saving} onClick={() => post("resume")}>Resume</Button>
              </Card>
            )}

            {e.type === "swap" && e.phase === "RUNNING" && e.day >= 7 && <Button variant="secondary" disabled={act.saving} onClick={() => post("add-back")}>Finish the swap and start adding back</Button>}

            {d.result && (
              <Card className="flex flex-col gap-2">
                <Label>Result</Label>
                <p>{d.result.text}</p>
                {d.result.help_link && <Link href="/help" className="font-semibold">When to get medical help</Link>}
                {d.doctor_note && <Caption>{d.doctor_note} Adapted from NHS, Bloating.</Caption>}
              </Card>
            )}

            {d.days.length > 0 && (
              <section className="flex flex-col gap-2" aria-labelledby="xdays">
                <Label id="xdays">Your answers</Label>
                <Card className="px-4 py-1"><ul>{d.days.map((x) => <li key={x.date} className="flex justify-between border-b border-line py-2 last:border-0"><span>{formatDate(x.date, d.date_format)}</span><span className="t-caption">{ANSWER[x.answer]}</span></li>)}</ul></Card>
              </section>
            )}

            {!ending && <SaveStatus state={act.state === "saved" ? "idle" : act.state} error={act.error} onCheck={async () => { if ((await act.check()).ok) load.reload(); }} />}
            {!finished && <Button variant="danger" onClick={() => { act.reset(); setEnding(true); }}>End early</Button>}

            <Sheet open={ending} onOpenChange={setEnding} title="End this experiment">
              <QuestionField id="XP-03" value={reason} onChange={(v) => setReason(v as string | null)} />
              {/* Shown inside the sheet, so a failed save is never hidden behind it. */}
              <SaveStatus state={act.state === "saved" ? "idle" : act.state} error={act.error} onCheck={async () => { if ((await act.check()).ok) { setEnding(false); load.reload(); } }} />
              <Button variant="danger" disabled={!reason || act.saving} onClick={async () => { const ok = await post("end", { reason }); if (ok) setEnding(false); }}>{act.saving ? "Ending…" : "End experiment"}</Button>
            </Sheet>
          </>
        );
      }}
    </ProScreen>
  );
}
