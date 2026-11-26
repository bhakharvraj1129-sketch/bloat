"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Caption, Card, Empty, ErrorState, Field, Label, Loading, SaveStatus, ScoreBadge, Screen, Sheet, inputClass } from "@/components/ui";
import { TimePick, AmbiguousChoice, timeMissing, type TimeValue } from "@/components/timepick";
import { useLoad, useSave } from "@/lib/client/hooks";
import { deviceZone } from "@/lib/client/api";
import { label as optionLabel, question } from "@/lib/registry";
import { formatClock, formatDate, formatDuration, localParts } from "@/lib/time";

type Ep = {
  id: string; started_at: string; ended_at: string | null; state: string; start_precision: string; end_precision: string | null; revision: number;
  samples: Array<{ strength: number; observed_at: string }>; warning_signs: string[]; symptoms: string[];
};
type MealRow = { id: string; eaten_at: string; dish_text: string; portion: string | null; ai_check_status: string; revision: number; ingredients: Array<{ name: string; group_label: string; answer: string; source: string }> };
type Data = {
  date: string; today: string; plan: string; date_format: "MM/DD" | "DD/MM"; units: "us" | "metric"; zone: string; status: string; score: number | null;
  highest_logged: number | null; provisional_zero: boolean; conflict_reason: string | null; duration_ms: number; duration_partial: boolean;
  review: null | { worst: number | null; cannot_remember: boolean; whole_day: string | null; food_coverage: string | null; late: boolean };
  episodes: Ep[]; meals: MealRow[]; activities: Array<{ id: string; activity_id: string; label: string; answer: string; source: string }>;
  bowel: Array<{ id: string; occurred_at: string; stool_type: string | null }>; exercise: Array<{ id: string; started_at: string; type: string; minutes: number }>;
};

const STATUS: Record<string, string> = { CONFIRMED: "Confirmed", LATE: "Late review", PROVISIONAL: "Provisional", CONFLICT: "Check this day", UNKNOWN: "No score" };
const ANSWER: Record<string, string> = { had: "Had", didnt_have: "Didn't have", not_sure: "Not sure", unknown: "Unknown" };
const MEAL_STATUS: Record<string, string> = {
  free_plan: "", not_requested: "Ingredients not added", checked: "Ingredients checked", abstained: "The check couldn't tell", failed: "The check didn't work. Ingredients unknown.",
  paused: "The check was paused. Ingredients unknown.", limited: "Ingredients unknown", manual: "Ingredients added by you", dont_know: "Ingredients unknown", recalled: "Ingredients added afterwards",
};

function toLocal(iso: string, zone: string): string {
  const p = localParts(Date.parse(iso), zone);
  const n = (x: number) => String(x).padStart(2, "0");
  return `${p.y}-${n(p.m)}-${n(p.d)}T${n(p.h)}:${n(p.mi)}`;
}

// Screen 27: correct any record. Edits make a new revision; deleting removes the record.
export function DayDetail({ date }: { date: string }) {
  const { data, error, loading, reload } = useLoad<Data>(`/v1/days/${date}`);
  const [editEp, setEditEp] = useState<Ep | null>(null);
  const [editMeal, setEditMeal] = useState<MealRow | null>(null);
  const [confirm, setConfirm] = useState<{ path: string; what: string; rev?: number } | null>(null);
  const del = useSave();

  if (loading && !data) return <Screen title="Day" back="/history"><Loading /></Screen>;
  if (error && !data) return <Screen title="Day" back="/history"><ErrorState error={error} onRetry={reload} /></Screen>;
  if (!data) return null;
  const clock = (iso: string) => formatClock(Date.parse(iso), data.zone, data.units);
  const finished = data.date < data.today;
  const empty = !data.episodes.length && !data.meals.length && !data.activities.length && !data.bowel.length && !data.exercise.length;

  return (
    <Screen title={formatDate(date, data.date_format)} back="/history">
      <Card className="flex items-center gap-4">
        <ScoreBadge size="lg" value={data.score ?? data.highest_logged ?? (data.provisional_zero ? 0 : null)} unknown={data.score === null && data.highest_logged === null && !data.provisional_zero} />
        <div className="flex flex-col gap-0.5">
          <Label>{data.score !== null ? "Bloat Score" : data.highest_logged !== null ? "Highest logged" : "Bloat Score"}</Label>
          <p className="t-title">{STATUS[data.status]}</p>
          <Caption>
            {data.status === "CONFLICT" && (data.conflict_reason === "zero_after_episode" ? "The review says no bloating, but bloating was logged this day. Correct whichever is wrong." : "The review is lower than a strength logged this day. Correct whichever is wrong.")}
            {data.status === "PROVISIONAL" && "Not confirmed by a whole-day review yet."}
            {data.status === "LATE" && "Reviewed after the window. Kept in history and the 7-day average; left out of comparisons."}
            {data.status === "UNKNOWN" && (empty ? "Nothing was logged and there is no review." : "No bloating was logged and there is no review.")}
            {data.status === "CONFIRMED" && (data.episodes.length ? `Time bloated: ${formatDuration(data.duration_ms)}${data.duration_partial ? " (partial: an end time is unknown)" : ""}` : "Confirmed by your review.")}
          </Caption>
        </div>
      </Card>
      {finished && (
        <Link href={`/review/${date}`} className="inline-flex min-h-12 items-center justify-center rounded-sm border border-line bg-surface px-5 font-semibold text-ink no-underline">
          {data.review ? "Change the review" : "Review this day"}
        </Link>
      )}

      {empty && <Empty title="Nothing logged this day">Entries you add on Today appear here.</Empty>}

      {data.episodes.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="eps">
          <Label id="eps" heading>Bloating</Label>
          {data.episodes.map((e) => {
            const strongest = e.samples.length ? Math.max(...e.samples.map((s) => s.strength)) : null;
            return (
              <Card key={e.id} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <ScoreBadge value={strongest} size="md" />
                  <div className="grow">
                    <p className="t-body-strong">{e.start_precision === "approximate" ? "About " : ""}{clock(e.started_at)} – {e.state === "OPEN" ? "ongoing" : e.ended_at ? `${e.end_precision === "approximate" ? "about " : ""}${clock(e.ended_at)}` : "end not known"}</p>
                    <Caption>{e.samples.length} strength {e.samples.length === 1 ? "reading" : "readings"}: {e.samples.map((s) => s.strength).join(", ")}</Caption>
                  </div>
                </div>
                {e.warning_signs.length > 0 && <Caption>Also logged: {e.warning_signs.map((c) => optionLabel("EP-08a", c)).join(", ")}. <Link href="/help">When to get medical help</Link></Caption>}
                {e.symptoms.length > 0 && <Caption>With it: {e.symptoms.map((c) => optionLabel("EP-08", c)).join(", ")}</Caption>}
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" onClick={() => setEditEp(e)} disabled={e.state === "OPEN"}>Edit times</Button>
                  <Button variant="danger" onClick={() => setConfirm({ path: `/v1/episodes/${e.id}`, what: "this bloating record and its readings", rev: e.revision })}>Delete</Button>
                </div>
                {e.state === "OPEN" && <Caption>This one is still open. End it on Today before editing its times.</Caption>}
              </Card>
            );
          })}
        </section>
      )}

      {data.meals.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="meals">
          <Label id="meals" heading>Meals</Label>
          {data.meals.map((m) => (
            <Card key={m.id} className="flex flex-col gap-3">
              <div>
                <p className="t-body-strong">{m.dish_text}</p>
                <Caption>{clock(m.eaten_at)}{m.portion ? ` · ${optionLabel("ML-04", m.portion)}` : ""}{MEAL_STATUS[m.ai_check_status] ? ` · ${MEAL_STATUS[m.ai_check_status]}` : ""}</Caption>
              </div>
              {m.ingredients.length > 0 && (
                <ul className="t-caption">
                  {m.ingredients.map((i) => <li key={i.name} className="py-0.5"><span className="capitalize text-ink">{i.name}</span> · {i.group_label} · {ANSWER[i.answer]}{i.source === "guess" ? " (guess, left out of comparisons)" : i.source === "recalled" ? " (added afterwards)" : ""}</li>)}
                </ul>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setEditMeal(m)}>Edit</Button>
                <Button variant="danger" onClick={() => setConfirm({ path: `/v1/meals/${m.id}`, what: "this meal" })}>Delete</Button>
              </div>
            </Card>
          ))}
        </section>
      )}

      {data.activities.length > 0 && (
        <section className="flex flex-col gap-2" aria-labelledby="acts">
          <Label id="acts" heading>Habits</Label>
          <Card className="px-4 py-1"><ul>
            {data.activities.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
                <span>{a.label}</span><span className="t-caption">{a.answer === "yes" ? "Yes" : a.answer === "no" ? "No" : "Not sure"}{a.source === "review" ? " · review" : ""}</span>
              </li>
            ))}
          </ul></Card>
        </section>
      )}

      {(data.bowel.length > 0 || data.exercise.length > 0) && (
        <section className="flex flex-col gap-2" aria-labelledby="other">
          <Label id="other" heading>Bowel and exercise</Label>
          <Card className="px-4 py-1"><ul>
            {data.bowel.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                <span>Bowel movement{b.stool_type ? `: ${optionLabel("BW-02", b.stool_type).toLowerCase()}` : ""} <span className="t-caption">· {clock(b.occurred_at)}</span></span>
                <button type="button" className="min-h-11 px-2 font-semibold text-alert" onClick={() => setConfirm({ path: `/v1/bowel/${b.id}`, what: "this bowel record" })}>Delete</button>
              </li>
            ))}
            {data.exercise.map((x) => (
              <li key={x.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                <span>{optionLabel("EX-01", x.type)}, {x.minutes} min <span className="t-caption">· {clock(x.started_at)}</span></span>
                <button type="button" className="min-h-11 px-2 font-semibold text-alert" onClick={() => setConfirm({ path: `/v1/exercise/${x.id}`, what: "this exercise record" })}>Delete</button>
              </li>
            ))}
          </ul></Card>
        </section>
      )}

      {data.review && (
        <section className="flex flex-col gap-2" aria-labelledby="rev">
          <Label id="rev" heading>Review answers</Label>
          <Card>
            <p>Strongest bloating: <strong>{data.review.cannot_remember ? "I can't remember" : data.review.worst}</strong></p>
            <p>Covers the whole day: <strong>{data.review.whole_day ? optionLabel("DY-02", data.review.whole_day) : "Not answered"}</strong></p>
            <p>Food and drink recorded: <strong>{data.review.food_coverage ? optionLabel("DY-03", data.review.food_coverage) : "Not answered"}</strong></p>
          </Card>
        </section>
      )}

      {editEp && <EpisodeEdit ep={editEp} zone={data.zone} clock={clock} onClose={() => setEditEp(null)} onSaved={() => { setEditEp(null); reload(); }} />}
      {editMeal && <MealEdit meal={editMeal} zone={data.zone} clock={clock} onClose={() => setEditMeal(null)} onSaved={() => { setEditMeal(null); reload(); }} />}

      <Sheet open={!!confirm} onOpenChange={(o) => { if (!o) { setConfirm(null); del.reset(); } }} title="Delete this?">
        <p>This removes {confirm?.what} for good. Anything worked out from it is recalculated.</p>
        <SaveStatus state={del.state === "saved" ? "idle" : del.state} error={del.error} onCheck={async () => { if ((await del.check()).ok) { setConfirm(null); del.reset(); reload(); } }} />
        <Button variant="danger" disabled={del.saving} onClick={async () => {
          // Close only once the server has confirmed the delete; a failure stays on screen.
          if ((await del.run("DELETE", confirm!.path, undefined, confirm!.rev !== undefined ? { ifMatch: confirm!.rev } : {})) === null) return;
          setConfirm(null); del.reset(); reload();
        }}>{del.saving ? "Deleting…" : "Delete"}</Button>
        <Button variant="secondary" disabled={del.saving} onClick={() => setConfirm(null)}>Keep it</Button>
      </Sheet>
    </Screen>
  );
}

/**
 * A saved time in an edit sheet. "Keep" is chosen first and sends nothing, so the saved time stays
 * exactly as it is (to the second). A new time is entered in the account's time zone, the zone the
 * day screen shows times in; when this device is in another zone, the sheet says so.
 * `value` null means Keep.
 */
function SavedTimePick({ name, saved, savedText, zone, value, onChange, allowApproximate = true, allowUnknown = false }: {
  name: string; saved: string | null; savedText: string; zone: string; value: TimeValue | null; onChange: (v: TimeValue | null) => void;
  allowApproximate?: boolean; allowUnknown?: boolean;
}) {
  const original = saved ? toLocal(saved, zone) : null;
  return (
    <>
      <TimePick
        name={name} zone={zone} labels={{ now: "Keep" }} allowApproximate={allowApproximate} allowUnknown={allowUnknown}
        value={value ?? { mode: "now", zone }}
        onChange={(v) => {
          if (v.mode === "now") return onChange(null);
          // Leaving Keep for a time starts from the saved time, not from now.
          if (value === null && original && (v.mode === "exact" || v.mode === "approximate")) return onChange({ ...v, local: original });
          onChange(v);
        }}
      />
      {value === null ? <Caption>Keeps the saved time: {savedText}.</Caption>
        : value.mode !== "unknown" && zone !== deviceZone() ? <Caption>Times here are in your Bloat time zone, {zone}.</Caption> : null}
    </>
  );
}

function EpisodeEdit({ ep, zone, clock, onClose, onSaved }: { ep: Ep; zone: string; clock: (iso: string) => string; onClose: () => void; onSaved: () => void }) {
  const [start, setStart] = useState<TimeValue | null>(null); // null: keep the saved time
  const [end, setEnd] = useState<TimeValue | null>(null);
  const save = useSave();
  const submit = async (offset?: number) => {
    if (start === null && end === null) return onClose(); // nothing changed
    const fix = (t: TimeValue) => (t.mode === "exact" || t.mode === "approximate" ? { ...t, ...(offset !== undefined ? { offset_min: offset } : {}) } : t);
    const body = { ...(start ? { started: fix(start) } : {}), ...(end ? { ended: fix(end) } : {}) };
    const ok = await save.run("PATCH", `/v1/episodes/${ep.id}`, body, { ifMatch: ep.revision });
    if (ok) onSaved();
  };
  const about = (precision: string | null) => (precision === "approximate" ? "about " : "");
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }} title="Edit times">
      <div className="flex flex-col gap-3"><p className="t-body-strong">{question("EP-02").prompt}</p>
        <SavedTimePick name="Start" saved={ep.started_at} savedText={`${about(ep.start_precision)}${clock(ep.started_at)}`} zone={zone} value={start} onChange={setStart} /></div>
      <div className="flex flex-col gap-3"><p className="t-body-strong">{question("EP-06").prompt}</p>
        <SavedTimePick name="End" saved={ep.ended_at} savedText={ep.ended_at ? `${about(ep.end_precision)}${clock(ep.ended_at)}` : "not known"} zone={zone} value={end} onChange={setEnd} allowUnknown /></div>
      <AmbiguousChoice error={save.error} onChoose={(o) => submit(o)} />
      <SaveStatus state={save.state} error={save.error?.code === "AMBIGUOUS_TIME" ? null : save.error} onCheck={async () => { if ((await save.check()).ok) onSaved(); }} />
      {save.error?.code === "REVISION_CONFLICT" && <Button variant="secondary" onClick={onSaved}>Reload this day</Button>}
      <Button onClick={() => submit()} disabled={timeMissing(start) || timeMissing(end) || save.saving}>{save.saving ? "Saving…" : "Save changes"}</Button>
    </Sheet>
  );
}

function MealEdit({ meal, zone, clock, onClose, onSaved }: { meal: MealRow; zone: string; clock: (iso: string) => string; onClose: () => void; onSaved: () => void }) {
  const [text, setText] = useState(meal.dish_text);
  const [when, setWhen] = useState<TimeValue | null>(null); // null: keep the saved time
  const save = useSave();
  const submit = async (offset?: number) => {
    if (text.trim() === meal.dish_text && when === null) return onClose(); // nothing changed
    // A name-only change sends no time, so the saved time stays exactly as it is.
    const eaten = when && (when.mode === "exact" || when.mode === "approximate") && offset !== undefined ? { ...when, offset_min: offset } : when;
    const ok = await save.run("PATCH", `/v1/meals/${meal.id}`, { dish_text: text.trim(), ...(eaten ? { eaten } : {}) }, { ifMatch: meal.revision });
    if (ok) onSaved();
  };
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }} title="Edit meal" dirty={text !== meal.dish_text && !save.saving}>
      <Field label="What did you have?" hint={`${text.length}/300`}><textarea className={`${inputClass} min-h-20 py-3`} maxLength={300} value={text} onChange={(e) => setText(e.target.value)} /></Field>
      <div className="flex flex-col gap-3"><p className="t-body-strong">When did you have it?</p>
        <SavedTimePick name="When" saved={meal.eaten_at} savedText={clock(meal.eaten_at)} zone={zone} value={when} onChange={setWhen} allowApproximate={false} /></div>
      <AmbiguousChoice error={save.error} onChoose={(o) => submit(o)} />
      <SaveStatus state={save.state} error={save.error?.code === "AMBIGUOUS_TIME" ? null : save.error} onCheck={async () => { if ((await save.check()).ok) onSaved(); }} />
      {save.error?.code === "REVISION_CONFLICT" && <Button variant="secondary" onClick={onSaved}>Reload this day</Button>}
      <Button disabled={!text.trim() || timeMissing(when) || save.saving} onClick={() => submit()}>{save.saving ? "Saving…" : "Save changes"}</Button>
    </Sheet>
  );
}
