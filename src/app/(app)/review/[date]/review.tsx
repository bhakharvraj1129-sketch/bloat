"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Caption, Card, Chip, ErrorState, Loading, SaveStatus, ScoreBadge, Screen, Segmented, StrengthScale } from "@/components/ui";
import { QuestionField } from "@/components/question";
import { useLoad, useSave } from "@/lib/client/hooks";
import { activity, question, tagLabel } from "@/lib/registry";
import { formatDate } from "@/lib/time";
import type { State } from "@/components/today/types";

type Day = { date: string; today: string; highest_logged: number | null; date_format: "MM/DD" | "DD/MM"; review: null | { worst: number | null; cannot_remember: boolean } };
type Result = { status: string; score: number | null; highest_logged: number | null; conflict_reason: string | null };
type YNN = "yes" | "no" | "not_sure";
const YES_NO = [{ value: "yes" as const, label: "Yes" }, { value: "no" as const, label: "No" }, { value: "not_sure" as const, label: "Not sure" }];

const STATUS: Record<string, { title: string; text: string }> = {
  CONFIRMED: { title: "Confirmed", text: "This is your Bloat Score for the day." },
  LATE: { title: "Saved as late", text: "It was entered after the review window, so it shows in History and the 7-day average but is left out of comparisons." },
  PROVISIONAL: { title: "Provisional", text: "Without a number for the whole day, this day has no confirmed score. You can come back to it from History." },
  CONFLICT: { title: "Check this day", text: "Your answer is lower than a strength you logged that day. Open the day to correct whichever is wrong." },
};

// Screen 25: the morning review sets the Bloat Score. "Mostly" is a fine answer.
export function Review({ date }: { date: string }) {
  const day = useLoad<Day>(`/v1/days/${date}`);
  const st = useLoad<State>("/v1/me/state");
  const [step, setStep] = useState(1);
  const [worst, setWorst] = useState<number | "i_cannot_remember" | null>(null);
  const [whole, setWhole] = useState<string | null>(null); // DY-02 is never pre-selected
  const [coverage, setCoverage] = useState<string | null>(null);
  const [impact, setImpact] = useState<string | null>(null);
  const [habits, setHabits] = useState<Record<string, YNN>>({});
  const [bowel, setBowel] = useState<YNN | null>(null);
  const [watched, setWatched] = useState<Record<string, YNN>>({});
  const [xp, setXp] = useState<"yes" | "partly" | "no" | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const save = useSave<Result>();

  if ((day.loading && !day.data) || (st.loading && !st.data)) return <Screen title="Review" back="/today"><Loading /></Screen>;
  if (day.error && !day.data) return <Screen title="Review" back="/today"><ErrorState error={day.error} onRetry={day.reload} /></Screen>;
  if (!day.data || !st.data) return null;
  const d = day.data; const s = st.data;
  const pro = s.plan === "pro";
  const dateLabel = formatDate(date, d.date_format);
  const prompt = (id: string) => question(id).prompt.replace("[date]", dateLabel);
  const keepEye = pro && s.profile.logging_mode === "keep_an_eye";
  const running = pro && s.pro?.experiment && s.pro.experiment.phase !== "PAUSED" ? s.pro.experiment : null;

  async function finish() {
    const body: Record<string, unknown> = { worst, whole_day: whole };
    if (coverage) body.food_coverage = coverage;
    if (Object.keys(habits).length) body.habits = habits;
    if (impact) body.weekly_impact = impact;
    if (pro && bowel) body.bowel = bowel;
    if (keepEye && Object.keys(watched).length) body.watched = watched;
    if (running && xp) body.experiment_answer = xp;
    const out = await save.run("PUT", `/v1/days/${date}/review`, body);
    if (out) setResult(out);
  }

  if (result) {
    const info = STATUS[result.status] ?? STATUS.PROVISIONAL!;
    return (
      <Screen title="Review saved">
        <Card className="flex items-center gap-4">
          <ScoreBadge size="lg" value={result.score} unknown={result.score === null} />
          <div><p className="t-title">{info.title}</p><Caption>{dateLabel}</Caption></div>
        </Card>
        <p>{info.text}</p>
        {result.status === "CONFLICT" && <Link className="font-semibold" href={`/day/${date}`}>Open this day</Link>}
        <Link href="/today" className="inline-flex min-h-12 items-center justify-center rounded-pill bg-brand px-5 font-semibold text-on-brand no-underline">Back to Today</Link>
      </Screen>
    );
  }

  return (
    <Screen title="Review yesterday" back="/today">
      <p className="t-caption">{dateLabel} · Step {step} of 3</p>

      {step === 1 && (
        <>
          <div className="flex flex-col gap-3">
            <p className="t-body-strong">{prompt("DY-01")}</p>
            {d.highest_logged !== null && <Caption>You logged up to {d.highest_logged} that day.</Caption>}
            <StrengthScale name="Strongest bloating, 0 to 10" min={0} value={typeof worst === "number" ? worst : null} onChange={setWorst} />
            <Chip role="radio" selected={worst === "i_cannot_remember"} onClick={() => setWorst("i_cannot_remember")}>I can&apos;t remember</Chip>
          </div>
          <div className="flex flex-col gap-3">
            <p className="t-body-strong">{prompt("DY-02")}</p>
            <QuestionField id="DY-02" value={whole} onChange={(v) => setWhole(v as string | null)} showPrompt={false} />
          </div>
          <Button disabled={worst === null || whole === null} onClick={() => setStep(2)}>Continue</Button>
          {(worst === null || whole === null) && <Caption>Answer both questions to continue.</Caption>}
        </>
      )}

      {step === 2 && (
        <>
          <div className="flex flex-col gap-3">
            <p className="t-body-strong">{prompt("DY-03")}</p>
            <QuestionField id="DY-03" value={coverage} onChange={(v) => setCoverage(v as string | null)} showPrompt={false} />
            <Caption>&quot;Mostly&quot; is a fine answer. Leave it blank to skip.</Caption>
          </div>
          {s.weekly_impact_due && (
            <div className="flex flex-col gap-3">
              <QuestionField id="WK-01" value={impact} onChange={(v) => setImpact(v as string | null)} hide={["skip"]} />
              <Caption>Asked once a week, about last week.</Caption>
            </div>
          )}
          <Button onClick={() => setStep(3)}>Continue</Button>
          <Button variant="quiet" onClick={() => setStep(1)}>Back</Button>
        </>
      )}

      {step === 3 && (
        <>
          {s.followed.length === 0 && !pro && <Card><Caption>You don&apos;t follow any habits yet. Choose up to 3 in Me to be asked about them here.</Caption></Card>}
          {s.followed.map((id) => (
            <div key={id} className="flex flex-col gap-2">
              <p className="t-body-strong">{question("DY-04").prompt.replace("[selected activity]", `"${activity(id)?.label ?? id}"`).replace("[date]", dateLabel)}</p>
              <Segmented label={activity(id)?.label ?? id} value={habits[id] ?? null} onChange={(v) => setHabits((h) => ({ ...h, [id]: v }))} options={YES_NO} />
            </div>
          ))}
          {pro && (
            <div className="flex flex-col gap-2">
              <p className="t-body-strong">{prompt("BW-01")}</p>
              <Segmented label="Bowel movement" value={bowel} onChange={setBowel} options={YES_NO} />
            </div>
          )}
          {running && (
            <div className="flex flex-col gap-2">
              <p className="t-body-strong">Did you do &quot;{running.name}&quot; on {dateLabel}?</p>
              <Segmented label="Experiment" value={xp} onChange={setXp} options={[{ value: "yes", label: "Yes" }, { value: "partly", label: "Partly" }, { value: "no", label: "No" }]} />
            </div>
          )}
          {keepEye && s.profile.watched_groups.length > 0 && (
            <div className="flex flex-col gap-3">
              <p className="t-body-strong">{question("KM-02").prompt}</p>
              {s.profile.watched_groups.map((g) => (
                <div key={g} className="flex flex-col gap-2">
                  <p>{tagLabel(g)}</p>
                  <Segmented label={tagLabel(g)} value={watched[g] ?? null} onChange={(v) => setWatched((w) => ({ ...w, [g]: v }))} options={YES_NO} />
                </div>
              ))}
            </div>
          )}
          <Caption>Anything you leave blank stays unknown. It is never saved as &quot;No&quot;.</Caption>
          <SaveStatus state={save.state} error={save.error} onCheck={async () => { const r = await save.check(); if (r.value) setResult(r.value); }} />
          <Button onClick={finish} disabled={save.saving}>{save.saving ? "Saving…" : "Finish"}</Button>
          <Button variant="quiet" onClick={() => setStep(2)}>Back</Button>
        </>
      )}
    </Screen>
  );
}
