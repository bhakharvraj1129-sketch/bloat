"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button, Caption, Card, ErrorState, Label, Loading, SaveStatus, ScoreBadge, Screen } from "@/components/ui";
import { useLoad, useSave } from "@/lib/client/hooks";
import { rememberOpener, returnFocus } from "@/lib/client/nav";
import { formatClock, formatDate, formatDuration } from "@/lib/time";
import type { State } from "@/components/today/types";
import { EndSheet, LogBloatingSheet, OngoingSheet, StillHappeningSheet } from "@/components/today/bloating";
import { MealSheet } from "@/components/today/meal";
import { ActivitySheet, BowelSheet, ExerciseSheet } from "@/components/today/activity";
import { ProToday } from "@/components/today/pro";
import { tagLabel } from "@/lib/registry";

type SheetName = null | "log" | "ongoing" | "end" | "end-earlier" | "still" | "meal" | "activity" | "exercise" | "bowel";
type Notice = { at: "bloating" | "add"; text: string };

/** Says what was just saved, next to where it was started. Always on the page, so screen readers announce each change. */
function SavedNotice({ text }: { text: string | null }) {
  return <p role="status" className={text ? "t-caption text-ink" : "sr-only"}>{text}</p>;
}

// Screen 15. Home: log fast and see today. Never a confirmed score for today, never a doctor card.
export function Today() {
  const router = useRouter();
  const { data: state, error, loading, reload } = useLoad<State>("/v1/me/state");
  const [sheet, setSheetState] = useState<SheetName>(null);
  const [stillDismissed, setStillDismissed] = useState(false);
  // A sheet closes as soon as the server confirms its save, so the confirmation is shown here (plan: "Meal saved.").
  const [notice, setNotice] = useState<Notice | null>(null);
  const setSheet = (s: SheetName) => { if (s) setNotice(null); setSheetState(s); };
  const savedThen = (n: Notice) => () => { setNotice(n); reload(); };
  const none = useSave();

  useEffect(() => { if (state && !state.onboarded) router.replace("/setup"); }, [state, router]);

  if (loading && !state) return <Screen title="Today" width="wide"><Loading what="Loading today" /></Screen>;
  if (error && !state) return <Screen title="Today" width="wide"><ErrorState error={error} onRetry={reload} /></Screen>;
  if (!state || !state.onboarded) return null;

  const { today, profile, open_episode: ep } = state;
  const sheetProps = { state, onSaved: reload };
  // EP-07: asked once on app open when an episode has been open 8 hours or more.
  const open: SheetName = sheet ?? (ep?.ask_still_happening && !stillDismissed ? "still" : null);
  const close = (o: boolean) => { if (!o) { if (open === "still") setStillDismissed(true); setSheet(null); } };
  const keepEye = profile.logging_mode === "keep_an_eye";

  const highest = today.highest_logged ?? (today.provisional_zero ? 0 : null);
  return (
    <Screen title="Today" width="wide" eyebrow={`${formatDate(today.date, profile.date_format)}${state.pro?.phase ? ` · ${state.pro.phase.label}` : ""}`}>
      {state.paused && <Card><p className="t-body-strong">Pro is paused</p><Caption>Your records are kept and free logging keeps working. <Link href="/me">Resume in Me</Link></Caption></Card>}

      {state.pending_review && (
        <Link href={`/review/${state.pending_review.date}`} className="flex min-h-16 items-center justify-between gap-3 rounded-lg border border-line bg-subtle px-5 py-4 text-ink no-underline hover:bg-line md:px-6">
          <span className="flex flex-col"><span className="font-semibold">Review yesterday</span><span className="t-caption">A few quick questions set your Bloat Score</span></span>
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card as="section" className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <Label>Highest logged so far</Label>
            {/* One spoken name for the figure, the same as what the screen shows (a provisional zero is 0). */}
            <p className="t-score" role="img" aria-label={highest !== null ? `${highest} out of 10` : "Nothing logged yet"}>
              {highest ?? "?"}{highest !== null && <span className="ml-2 align-baseline text-xl font-medium tracking-normal text-ink-muted">/ 10</span>}
            </p>
            <p className="font-semibold">
              {today.episodes === 0 ? (today.provisional_zero ? "No bloating so far" : "Nothing logged yet") : `${today.episodes} ${today.episodes === 1 ? "episode" : "episodes"} · ${formatDuration(today.duration_ms)}${today.duration_partial ? " so far" : ""}`}
            </p>
            <Caption>Your score is set in tomorrow&apos;s review</Caption>
          </div>
          <div className="flex flex-col gap-3 border-t border-line pt-6">
            {ep ? (
              <button type="button" data-focus-key="today-bloating" onClick={() => setSheet("ongoing")} className="flex min-h-16 items-center justify-between gap-3 rounded-sm bg-brand px-5 text-left text-on-brand hover:opacity-90">
                <span className="flex flex-col"><span className="text-lg font-semibold">Bloating ongoing</span><span className="text-[0.8125rem]">Since {formatClock(Date.parse(ep.started_at), profile.time_zone, profile.units)} · strength {ep.current_strength}</span></span>
                <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
              </button>
            ) : (
              <Button size="lg" data-focus-key="today-bloating" onClick={() => setSheet("log")}>I feel bloated</Button>
            )}
            {!ep && today.episodes === 0 && !today.provisional_zero && (
              <>
                {/* Saving removes this button: focus then moves to I feel bloated (same focus key), never to the page. */}
                <Button variant="quiet" data-focus-key="today-bloating" disabled={none.saving} onClick={async () => {
                  const back = rememberOpener();
                  const ok = await none.run("POST", `/v1/days/${today.date}/no-bloating-so-far`);
                  if (ok) { setNotice({ at: "bloating", text: "Noted: no bloating so far today." }); reload(); returnFocus(back); }
                }}>No bloating so far today</Button>
                <SaveStatus state={none.state === "saved" ? "idle" : none.state} error={none.error} onCheck={async () => { if ((await none.check()).ok) { setNotice({ at: "bloating", text: "Noted: no bloating so far today." }); reload(); } }} />
              </>
            )}
            <SavedNotice text={notice?.at === "bloating" ? notice.text : null} />
          </div>
        </Card>

        <Card as="section" className="flex flex-col gap-4">
          <h2 className="t-title">Add to today</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={() => setSheet("meal")}>{keepEye ? "Add meal (optional)" : "Add meal"}</Button>
            <Button variant="secondary" onClick={() => setSheet("activity")}>Add activity</Button>
            {state.plan === "pro" && <Button variant="secondary" className="col-span-2" onClick={() => setSheet("bowel")}>Log bowel movement</Button>}
          </div>
          <SavedNotice text={notice?.at === "add" ? notice.text : null} />
          {keepEye && (
            <div className="flex flex-col gap-1 border-t border-line pt-4">
              <Label>Keeping an eye on</Label>
              <p>{profile.watched_groups.map(tagLabel).join(" · ")}</p>
              <Caption>Tomorrow&apos;s review asks whether you had each of these. Meals are optional.</Caption>
            </div>
          )}
        </Card>
      </div>

      {state.plan === "pro" ? (
        <ProToday state={state} onChanged={reload} />
      ) : (
        <Card className="bg-subtle">
          <p className="t-body-strong tabular">{state.progress.days_logged} {state.progress.days_logged === 1 ? "day" : "days"} logged · {Math.min(state.progress.confirmed_days, state.progress.confirmed_needed)} of {state.progress.confirmed_needed} confirmed days needed for possible triggers</p>
          <Caption>A confirmed day is one where your morning review covers the whole day. <Link href="/upgrade">What Pro adds</Link></Caption>
        </Card>
      )}

      <section aria-labelledby="so-far" className="flex flex-col gap-3">
        <h2 id="so-far" className="t-title">Today so far</h2>
        {state.timeline.length === 0 ? (
          <Card><Caption>Nothing logged yet today. Entries appear here as you add them.</Caption></Card>
        ) : (
          <Card className="py-2 md:py-3">
            <ul>
              {state.timeline.map((t) => (
                <li key={`${t.kind}-${t.id}`} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                  <span className="w-16 shrink-0 t-caption tabular">{t.at ? formatClock(Date.parse(t.at), profile.time_zone, profile.units) : "Today"}</span>
                  <span className="grow">{t.kind === "episode" ? `Bloating${t.strongest ? `, strongest ${t.strongest}` : ""}${t.open ? " (ongoing)" : ""}` : t.text}</span>
                  {t.kind === "episode" ? <ScoreBadge size="sm" value={t.strongest ?? null} /> : <span className="t-caption">{t.kind === "meal" ? "Meal" : "Habit"}</span>}
                </li>
              ))}
            </ul>
            <Link href={`/day/${today.date}`} className="flex min-h-11 items-center font-semibold">Edit today&apos;s entries</Link>
          </Card>
        )}
      </section>

      {/* Sheets are mounted only while open, so each one starts with a clean form. */}
      {open === "log" && <LogBloatingSheet open onOpenChange={close} {...sheetProps} onSaved={savedThen({ at: "bloating", text: "Bloating saved." })} />}
      {open === "ongoing" && <OngoingSheet open onOpenChange={close} {...sheetProps} onEnd={(earlier) => setSheet(earlier ? "end-earlier" : "end")} />}
      {(open === "end" || open === "end-earlier") && <EndSheet open earlier={open === "end-earlier"} onOpenChange={close} {...sheetProps} />}
      {open === "still" && <StillHappeningSheet open onOpenChange={close} {...sheetProps} onEnd={() => { setStillDismissed(true); setSheet("end-earlier"); }} />}
      {open === "meal" && <MealSheet open onOpenChange={close} {...sheetProps} onSaved={savedThen({ at: "add", text: "Meal saved." })} />}
      {open === "activity" && <ActivitySheet open onOpenChange={close} {...sheetProps} onSaved={savedThen({ at: "add", text: "Activity saved." })} onExercise={() => setSheet("exercise")} />}
      {open === "exercise" && <ExerciseSheet open onOpenChange={close} {...sheetProps} onSaved={savedThen({ at: "add", text: "Exercise saved." })} />}
      {open === "bowel" && <BowelSheet open onOpenChange={close} {...sheetProps} onSaved={savedThen({ at: "add", text: "Bowel movement saved." })} />}
    </Screen>
  );
}
