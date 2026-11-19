"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button, Caption, Card, ErrorState, Label, Loading, SaveStatus, ScoreBadge } from "@/components/ui";
import { useLoad, useSave } from "@/lib/client/hooks";
import { formatClock, formatDate, formatDuration } from "@/lib/time";
import type { State } from "@/components/today/types";
import { EndSheet, LogBloatingSheet, OngoingSheet, StillHappeningSheet } from "@/components/today/bloating";
import { MealSheet } from "@/components/today/meal";
import { ActivitySheet, BowelSheet, ExerciseSheet } from "@/components/today/activity";
import { ProToday } from "@/components/today/pro";
import { tagLabel } from "@/lib/registry";

type SheetName = null | "log" | "ongoing" | "end" | "end-earlier" | "still" | "meal" | "activity" | "exercise" | "bowel";

// Screen 15. Home: log fast and see today. Never a confirmed score for today, never a doctor card.
export function Today() {
  const router = useRouter();
  const { data: state, error, loading, reload } = useLoad<State>("/v1/me/state");
  const [sheet, setSheet] = useState<SheetName>(null);
  const [stillDismissed, setStillDismissed] = useState(false);
  const none = useSave();

  useEffect(() => { if (state && !state.onboarded) router.replace("/setup"); }, [state, router]);

  if (loading && !state) return <main className="mx-auto max-w-md px-4 pt-8"><h1 className="t-headline mb-6">Today</h1><Loading what="Loading today" /></main>;
  if (error && !state) return <main className="mx-auto max-w-md px-4 pt-8"><h1 className="t-headline mb-6">Today</h1><ErrorState error={error} onRetry={reload} /></main>;
  if (!state || !state.onboarded) return null;

  const { today, profile, open_episode: ep } = state;
  const sheetProps = { state, onSaved: reload };
  // EP-07: asked once on app open when an episode has been open 8 hours or more.
  const open: SheetName = sheet ?? (ep?.ask_still_happening && !stillDismissed ? "still" : null);
  const close = (o: boolean) => { if (!o) { if (open === "still") setStillDismissed(true); setSheet(null); } };
  const keepEye = profile.logging_mode === "keep_an_eye";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-4 pb-32 pt-8">
      <header className="flex items-baseline justify-between">
        <h1 className="t-headline">Today</h1>
        <span className="t-caption">{formatDate(today.date, profile.date_format)}{state.pro?.phase ? ` · ${state.pro.phase.label}` : ""}</span>
      </header>

      {state.paused && <Card><p className="t-body-strong">Pro is paused</p><Caption>Your records are kept and free logging keeps working. <Link href="/me">Resume in Me</Link></Caption></Card>}

      {state.pending_review && (
        <Link href={`/review/${state.pending_review.date}`} className="flex items-center justify-between gap-3 rounded-lg bg-brand-tint px-4 py-3 text-ink no-underline">
          <span className="flex flex-col"><span className="font-semibold">Review yesterday</span><span className="t-caption">A few quick questions set your Bloat Score</span></span>
          <ChevronRight size={20} strokeWidth={1.75} className="text-brand" aria-hidden />
        </Link>
      )}

      <Card className="flex items-center gap-4">
        <ScoreBadge size="lg" value={today.highest_logged ?? (today.provisional_zero ? 0 : null)} unknown={today.highest_logged === null && !today.provisional_zero} label={today.highest_logged !== null ? `Highest logged so far: ${today.highest_logged}` : "Nothing logged yet"} />
        <div className="flex flex-col gap-0.5">
          <Label>Highest logged so far</Label>
          <span className="font-semibold">
            {today.episodes === 0 ? (today.provisional_zero ? "No bloating so far" : "Nothing logged yet") : `${today.episodes} ${today.episodes === 1 ? "episode" : "episodes"} · ${formatDuration(today.duration_ms)}${today.duration_partial ? " so far" : ""}`}
          </span>
          <Caption>Your score is set in tomorrow&apos;s review</Caption>
        </div>
      </Card>

      {ep ? (
        <button type="button" onClick={() => setSheet("ongoing")} className="flex min-h-16 items-center justify-between gap-3 rounded-pill bg-brand px-6 text-left text-on-brand">
          <span className="flex flex-col"><span className="text-lg font-semibold">Bloating ongoing</span><span className="text-[0.8125rem]">Since {formatClock(Date.parse(ep.started_at), profile.time_zone, profile.units)} · strength {ep.current_strength}</span></span>
          <ChevronRight size={20} strokeWidth={1.75} aria-hidden />
        </button>
      ) : (
        <Button size="lg" onClick={() => setSheet("log")}>I feel bloated</Button>
      )}

      {!ep && today.episodes === 0 && !today.provisional_zero && (
        <>
          <Button variant="quiet" disabled={none.saving} onClick={async () => { const ok = await none.run("POST", `/v1/days/${today.date}/no-bloating-so-far`); if (ok) reload(); }}>No bloating so far today</Button>
          <SaveStatus state={none.state === "saved" ? "idle" : none.state} error={none.error} onCheck={async () => { if ((await none.check()).ok) reload(); }} />
        </>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={() => setSheet("meal")}>{keepEye ? "Add meal (optional)" : "Add meal"}</Button>
        <Button variant="secondary" onClick={() => setSheet("activity")}>Add activity</Button>
        {state.plan === "pro" && <Button variant="secondary" className="col-span-2" onClick={() => setSheet("bowel")}>Log bowel movement</Button>}
      </div>

      {keepEye && (
        <Card>
          <Label>Keeping an eye on</Label>
          <p className="mt-1">{profile.watched_groups.map(tagLabel).join(" · ")}</p>
          <Caption>Tomorrow&apos;s review asks whether you had each of these. Meals are optional.</Caption>
        </Card>
      )}

      {state.plan === "pro" ? (
        <ProToday state={state} onChanged={reload} />
      ) : (
        <Card className="bg-brand-tint">
          <p className="t-body-strong tabular">{state.progress.days_logged} {state.progress.days_logged === 1 ? "day" : "days"} logged · {Math.min(state.progress.confirmed_days, state.progress.confirmed_needed)} of {state.progress.confirmed_needed} confirmed days needed for possible triggers</p>
          <Caption>A confirmed day is one where your morning review covers the whole day. <Link href="/upgrade">What Pro adds</Link></Caption>
        </Card>
      )}

      <section aria-labelledby="so-far" className="flex flex-col gap-2">
        <Label id="so-far">Today so far</Label>
        {state.timeline.length === 0 ? (
          <Card><Caption>Nothing logged yet today. Entries appear here as you add them.</Caption></Card>
        ) : (
          <Card className="px-4 py-1">
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
      {open === "log" && <LogBloatingSheet open onOpenChange={close} {...sheetProps} />}
      {open === "ongoing" && <OngoingSheet open onOpenChange={close} {...sheetProps} onEnd={(earlier) => setSheet(earlier ? "end-earlier" : "end")} />}
      {(open === "end" || open === "end-earlier") && <EndSheet open earlier={open === "end-earlier"} onOpenChange={close} {...sheetProps} />}
      {open === "still" && <StillHappeningSheet open onOpenChange={close} {...sheetProps} onEnd={() => { setStillDismissed(true); setSheet("end-earlier"); }} />}
      {open === "meal" && <MealSheet open onOpenChange={close} {...sheetProps} />}
      {open === "activity" && <ActivitySheet open onOpenChange={close} {...sheetProps} onExercise={() => setSheet("exercise")} />}
      {open === "exercise" && <ExerciseSheet open onOpenChange={close} {...sheetProps} />}
      {open === "bowel" && <BowelSheet open onOpenChange={close} {...sheetProps} />}
    </main>
  );
}
