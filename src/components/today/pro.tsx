"use client";
import Link from "next/link";
import { Button, Caption, Card, Label } from "@/components/ui";
import { useSave } from "@/lib/client/hooks";
import type { State } from "./types";

// Pro cards on Today: shortcuts ordered by the personal goal, the running experiment, today's card
// and the next best log. Each shows only what the records support.
export function ProToday({ state, onChanged }: { state: State; onChanged: () => void }) {
  const pro = state.pro;
  const xp = useSave();
  const dismiss = useSave();
  if (!pro) return null;
  return (
    <>
      {pro.shortcuts && pro.shortcuts.length > 0 && (
        <nav aria-label="Shortcuts" className="flex flex-wrap gap-2">
          {pro.shortcuts.map((s) => <Link key={s.href} href={s.href} className="inline-flex min-h-11 items-center rounded-sm border border-line bg-surface px-4 font-semibold text-ink no-underline">{s.label}</Link>)}
        </nav>
      )}
      {pro.experiment && (
        <Card className="flex flex-col gap-3">
          <Label>Experiment · {pro.experiment.phase === "ADDING_BACK" ? "adding back" : pro.experiment.phase === "PAUSED" ? "paused" : `day ${pro.experiment.day} of ${pro.experiment.of}`}</Label>
          <p className="t-body-strong">{pro.experiment.name}</p>
          {pro.experiment.phase === "RUNNING" && !pro.experiment.answered_today && (
            <div className="grid grid-cols-3 gap-2">
              {(["yes", "partly", "no"] as const).map((a) => (
                <Button key={a} variant="secondary" disabled={xp.saving} onClick={async () => { const ok = await xp.run("POST", `/v1/experiments/${pro.experiment!.id}/days`, { answer: a }); if (ok) onChanged(); }}>
                  {a === "yes" ? "Yes" : a === "partly" ? "Partly" : "No"}
                </Button>
              ))}
            </div>
          )}
          {pro.experiment.answered_today && <Caption>Today&apos;s answer is saved.</Caption>}
          <Link href={`/experiments/${pro.experiment.id}`} className="font-semibold">Open experiment</Link>
        </Card>
      )}
      {pro.card && (
        <Link href="/cards" className="flex flex-col gap-1 rounded-lg border border-line bg-surface p-4 text-ink no-underline">
          <Label>Today&apos;s card · {pro.card.kind === "mind_body" ? "mind and body" : "tip"}</Label>
          <span className="t-body-strong">{pro.card.title}</span>
        </Link>
      )}
      {pro.next_best_log && (
        <Card className="flex flex-col gap-2">
          <Label>Next best log</Label>
          <p>{pro.next_best_log.text}</p>
          <Button variant="quiet" full={false} disabled={dismiss.saving} onClick={async () => { const ok = await dismiss.run("POST", "/v1/insights/suggestions/dismiss", { id: pro.next_best_log!.id }); if (ok) onChanged(); }}>Not useful</Button>
        </Card>
      )}
    </>
  );
}
