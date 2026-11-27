"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, CircleCheck, Droplet, Footprints, Sunrise, Utensils } from "lucide-react";
import { Button, Caption, Card, ErrorState, Label, Loading, SaveStatus, ScoreBadge, Screen, cx } from "@/components/ui";
import { LogoMark } from "@/components/logo";
import { savedToast } from "@/lib/client/feedback";
import { useLoad, useSave } from "@/lib/client/hooks";
import { rememberOpener, returnFocus } from "@/lib/client/nav";
import { formatClock, formatDate, formatDuration, weekday } from "@/lib/time";
import type { State } from "@/components/today/types";
import { EndSheet, LogBloatingSheet, OngoingSheet, StillHappeningSheet } from "@/components/today/bloating";
import { MealSheet } from "@/components/today/meal";
import { ActivitySheet, BowelSheet, ExerciseSheet } from "@/components/today/activity";
import { ProToday } from "@/components/today/pro";
import { question, tagLabel } from "@/lib/registry";
import { SmoothList } from "@/components/glide";
import { CountUp } from "@/components/count-up";

type SheetName = null | "log" | "ongoing" | "end" | "end-earlier" | "still" | "meal" | "activity" | "exercise" | "bowel";

const CONSENT_QUESTION = { health_data: "CN-02", wellness_ack: "CN-03" } as const;

/** D33: the app was renamed, so the two sentences that name it are confirmed again once. Logging is never blocked. */
function Reconfirm({ due, onDone }: { due: Array<keyof typeof CONSENT_QUESTION>; onDone: () => void }) {
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const save = useSave();
  const all = due.every((t) => ticks[t]);
  const confirm = async () => {
    const back = rememberOpener();
    const ok = await save.run("POST", "/v1/consents/reconfirm", { types: due });
    if (ok) { onDone(); returnFocus(back); }
  };
  return (
    <Card as="section" aria-labelledby="reconfirm" className="flex flex-col gap-4 border-brand">
      <div className="flex flex-col gap-1">
        <h2 id="reconfirm" className="t-title">Bloat is now Bloat Buddy</h2>
        <p className="text-ink-muted">The app has a new name. Please confirm {due.length === 1 ? "this sentence" : "these sentences"} with the new name. Nothing else has changed.</p>
      </div>
      {due.map((t) => (
        <label key={t} className="flex items-start gap-3 rounded-md border border-line bg-surface p-4">
          <input type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-(--brand)" checked={!!ticks[t]} onChange={(e) => setTicks((x) => ({ ...x, [t]: e.target.checked }))} />
          <span>{question(CONSENT_QUESTION[t]).prompt}</span>
        </label>
      ))}
      <Button data-focus-key="today-reconfirm" disabled={!all || save.saving} onClick={confirm}>{save.saving ? "Saving…" : "Confirm"}</Button>
      <SaveStatus state={save.state === "saved" ? "idle" : save.state} error={save.error} onCheck={async () => { if ((await save.check()).ok) onDone(); }} />
    </Card>
  );
}

const DAY_LETTER = ["S", "M", "T", "W", "T", "F", "S"];

/** This week, Monday first. A day fills in once anything is logged on it; it shows no score. */
function WeekStrip({ state }: { state: State }) {
  const { week, today, profile } = state;
  if (!week?.length) return null;
  return (
    <Card as="section" aria-labelledby="week-title" className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="week-title" className="t-body-strong">This week</h2>
        <span className="t-caption">Days you log fill in</span>
      </div>
      <ol className="grid grid-cols-7 gap-1 text-center">
        {week.map((d) => {
          const isToday = d.date === today.date;
          const n = Number(d.date.slice(8));
          return (
            <li key={d.date} className="flex flex-col items-center gap-1.5">
              <span aria-hidden className={cx("text-xs", isToday ? "font-bold text-ink" : "text-ink-muted")}>{DAY_LETTER[weekday(d.date)]}</span>
              <span aria-hidden className={cx(
                "inline-flex h-8 w-8 items-center justify-center rounded-full text-xs tabular",
                d.logged ? "bg-brand font-semibold text-on-brand" : isToday ? "border-2 border-brand font-semibold text-ink" : d.future ? "border border-dashed border-line text-ink-muted" : "border border-line text-ink-muted",
                isToday && d.logged && "outline-2 outline-offset-2 outline-brand",
              )}>{n}</span>
              <span className="sr-only">{formatDate(d.date, profile.date_format)}{isToday ? ", today" : ""}{d.future ? "" : d.logged ? ", logged" : ", nothing logged"}</span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

/** A quick-add tile: an icon and a short word. The spoken name says what it does. */
function AddTile({ label, name, icon: Icon, hint, onClick }: { label: string; name: string; icon: typeof Utensils; hint?: string; onClick: () => void }) {
  return (
    <button type="button" aria-label={name} onClick={onClick}
      className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-md border border-line bg-surface px-2 py-3 text-ink transition-colors duration-150 hover:bg-subtle">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-brand-tint text-brand-text"><Icon size={20} strokeWidth={2} aria-hidden /></span>
      <span className="text-[0.9375rem] font-semibold leading-tight">{label}</span>
      {hint && <span className="t-caption -mt-1.5">{hint}</span>}
    </button>
  );
}

// Screen 15. Home: log fast and see today. Never a confirmed score for today, never a doctor card.
export function Today() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: state, error, loading, reload } = useLoad<State>("/v1/me/state");
  const [sheet, setSheetState] = useState<SheetName>(null);
  const [stillDismissed, setStillDismissed] = useState(false);
  // A sheet closes as soon as the server confirms its save; a toast with a tick says what was saved
  // (the plan's sentences: "Meal saved."), visible wherever the person has scrolled.
  const setSheet = (s: SheetName) => setSheetState(s);
  const savedThen = (text: string) => () => { savedToast(text); reload(); };
  const none = useSave();
  const wantLog = params.get("log") === "1";

  useEffect(() => { if (state && !state.onboarded) router.replace("/setup"); }, [state, router]);
  // The log button in the tab bar opens /today?log=1: open Log bloating (or Bloating now) once, then tidy the address.
  const [logOpened, setLogOpened] = useState(false);
  if (wantLog && state?.onboarded && !logOpened) {
    setLogOpened(true);
    setSheetState(state.open_episode ? "ongoing" : "log");
  }
  if (!wantLog && logOpened) setLogOpened(false);
  useEffect(() => { if (wantLog && logOpened) router.replace("/today", { scroll: false }); }, [wantLog, logOpened, router]);

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
  const pro = state.plan === "pro";
  const { progress } = state;
  const confirmed = Math.min(progress.confirmed_days, progress.confirmed_needed);
  return (
    <Screen title="Today" width="wide" eyebrow={`${formatDate(today.date, profile.date_format)}${state.pro?.phase ? ` · ${state.pro.phase.label}` : ""}`}
      action={<LogoMark size={36} className="md:hidden" />}>
      {state.paused && <Card><p className="t-body-strong">Pro is paused</p><Caption>Your records are kept and free logging keeps working. <Link href="/me">Resume in You</Link></Caption></Card>}

      {!!state.consents_due?.length && <Reconfirm due={state.consents_due} onDone={() => { savedToast("Confirmed. Thank you."); reload(); }} />}

      {state.pending_review && (
        <Link href={`/review/${state.pending_review.date}`} data-press className="flex min-h-16 items-center gap-4 rounded-lg border border-brand bg-brand-tint px-5 py-4 text-ink no-underline md:px-6">
          <Sunrise size={24} strokeWidth={2} aria-hidden className="shrink-0 text-brand-text" />
          <span className="flex grow flex-col"><span className="font-bold">Review yesterday</span><span className="t-caption">A few quick questions set your Bloat Score</span></span>
          <ChevronRight size={20} strokeWidth={2} aria-hidden />
        </Link>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
        <div className="flex flex-col gap-4 lg:gap-6">
          <Card as="section" aria-labelledby="feeling" className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <h2 id="feeling" className="t-title">How are you feeling?</h2>
              {highest === null && !ep && <p className="text-ink-muted">Nothing logged yet today.</p>}
            </div>
            {highest !== null && (
              <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 rounded-md bg-subtle px-4 py-3.5">
                <div className="flex flex-col gap-1">
                  <Label>Highest logged so far</Label>
                  {/* One spoken name for the figure, the same as what the screen shows (a provisional zero is 0). */}
                  <p className="font-display text-[2.5rem] font-extrabold leading-none tracking-[-0.02em] tabular" role="img" aria-label={`${highest} out of 10`}>
                    <CountUp value={highest} /><span className="ml-1.5 align-baseline font-body text-lg font-medium tracking-normal text-ink-muted">/ 10</span>
                  </p>
                </div>
                <p className="font-semibold">
                  {today.episodes === 0 ? "No bloating so far" : `${today.episodes} ${today.episodes === 1 ? "episode" : "episodes"} · ${formatDuration(today.duration_ms)}${today.duration_partial ? " so far" : ""}`}
                </p>
              </div>
            )}
            <div className="flex flex-col gap-3">
              {ep ? (
                <>
                  <button type="button" data-focus-key="today-bloating" onClick={() => setSheet("ongoing")} className="flex min-h-20 items-center gap-4 rounded-md bg-brand px-4 py-3.5 text-left text-on-brand hover:opacity-90">
                    {ep.current_strength !== null && (
                      <span aria-hidden className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-on-brand font-display text-xl font-extrabold tabular">{ep.current_strength}</span>
                    )}
                    <span className="flex grow flex-col"><span className="text-lg font-bold">Bloating ongoing</span><span className="text-[0.875rem]">Since {formatClock(Date.parse(ep.started_at), profile.time_zone, profile.units)}{ep.current_strength !== null ? ` · strength ${ep.current_strength}` : ""}</span></span>
                    <ChevronRight size={20} strokeWidth={2} aria-hidden />
                  </button>
                  <Button variant="secondary" onClick={() => setSheet("end")}>It&apos;s gone</Button>
                </>
              ) : (
                <Button size="lg" data-focus-key="today-bloating" onClick={() => setSheet("log")}>I feel bloated</Button>
              )}
              {!ep && today.episodes === 0 && !today.provisional_zero && (
                <>
                  {/* Saving removes this button: focus then moves to I feel bloated (same focus key), never to the page. */}
                  <Button variant="secondary" data-focus-key="today-bloating" disabled={none.saving} onClick={async () => {
                    const back = rememberOpener();
                    const ok = await none.run("POST", `/v1/days/${today.date}/no-bloating-so-far`);
                    if (ok) { savedToast("Noted: no bloating so far today."); reload(); returnFocus(back); }
                  }}>No bloating so far today</Button>
                  <SaveStatus state={none.state === "saved" ? "idle" : none.state} error={none.error} onCheck={async () => { if ((await none.check()).ok) { savedToast("Noted: no bloating so far today."); reload(); } }} />
                </>
              )}
              {(highest !== null || ep) && <Caption>Tomorrow morning, a short review sets today&apos;s Bloat Score.</Caption>}
            </div>
          </Card>

          <WeekStrip state={state} />
        </div>

        <div className="flex flex-col gap-4 lg:gap-6">
          <section aria-labelledby="add-title" className="flex flex-col gap-3">
            <h2 id="add-title" className="t-title">Add to today</h2>
            <div className={cx("grid gap-2.5", pro ? "grid-cols-3" : "grid-cols-2")}>
              <AddTile label="Meal" name={keepEye ? "Add meal (optional)" : "Add meal"} hint={keepEye ? "Optional" : undefined} icon={Utensils} onClick={() => setSheet("meal")} />
              <AddTile label="Activity" name="Add activity" icon={Footprints} onClick={() => setSheet("activity")} />
              {pro && <AddTile label="Bowel movement" name="Log bowel movement" icon={Droplet} onClick={() => setSheet("bowel")} />}
            </div>
            {keepEye && (
              <Card className="flex flex-col gap-1">
                <Label>Keeping an eye on</Label>
                <p>{profile.watched_groups.map(tagLabel).join(" · ")}</p>
                <Caption>Tomorrow&apos;s review asks whether you had each of these. Meals are optional.</Caption>
              </Card>
            )}
          </section>

          {pro ? (
            <ProToday state={state} onChanged={reload} />
          ) : (
            <section aria-labelledby="first-patterns" className="flex flex-col gap-3 rounded-lg bg-brand-tint p-5 md:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <h2 id="first-patterns" className="font-bold text-brand-text">Your first patterns</h2>
                <span className="text-sm font-semibold text-brand-text tabular">{confirmed} of {progress.confirmed_needed} confirmed days</span>
              </div>
              <div aria-hidden className="h-2 overflow-hidden rounded-pill bg-surface">
                <div className="h-full rounded-pill bg-brand" style={{ width: `${Math.round((confirmed / Math.max(1, progress.confirmed_needed)) * 100)}%` }} />
              </div>
              <p className="t-body-strong tabular">{progress.days_logged} {progress.days_logged === 1 ? "day" : "days"} logged · {confirmed} of {progress.confirmed_needed} confirmed days needed for possible triggers</p>
              <Caption>A confirmed day is one where your morning review covers the whole day. <Link href="/upgrade">What Pro adds</Link></Caption>
            </section>
          )}
        </div>
      </div>

      <section aria-labelledby="so-far" className="flex flex-col gap-3">
        <h2 id="so-far" className="t-title">Today so far</h2>
        {state.timeline.length === 0 ? (
          <Card className="flex items-center gap-3"><CircleCheck size={20} strokeWidth={1.75} aria-hidden className="shrink-0 text-control" /><Caption>Entries appear here as you add them.</Caption></Card>
        ) : (
          <Card className="py-2 md:py-3">
            <SmoothList>
              {state.timeline.map((t) => (
                <li key={`${t.kind}-${t.id}`} className="flex items-center gap-3 border-b border-line py-3 last:border-0">
                  <span className="w-16 shrink-0 t-caption tabular">{t.at ? formatClock(Date.parse(t.at), profile.time_zone, profile.units) : "Today"}</span>
                  <span className="grow">{t.kind === "episode" ? `Bloating${t.strongest ? `, strongest ${t.strongest}` : ""}${t.open ? " (ongoing)" : ""}` : t.text}</span>
                  {t.kind === "episode" ? <ScoreBadge size="sm" value={t.strongest ?? null} /> : <span className="t-caption">{t.kind === "meal" ? "Meal" : "Activity"}</span>}
                </li>
              ))}
            </SmoothList>
            <Link href={`/day/${today.date}`} className="flex min-h-11 items-center font-semibold">Edit today&apos;s entries</Link>
          </Card>
        )}
      </section>

      {/* Sheets are mounted only while open, so each one starts with a clean form. */}
      {open === "log" && <LogBloatingSheet open onOpenChange={close} {...sheetProps} onSaved={savedThen("Bloating saved.")} />}
      {open === "ongoing" && <OngoingSheet open onOpenChange={close} {...sheetProps} onEnd={(earlier) => setSheet(earlier ? "end-earlier" : "end")} />}
      {(open === "end" || open === "end-earlier") && <EndSheet open earlier={open === "end-earlier"} onOpenChange={close} {...sheetProps} />}
      {open === "still" && <StillHappeningSheet open onOpenChange={close} {...sheetProps} onEnd={() => { setStillDismissed(true); setSheet("end-earlier"); }} />}
      {open === "meal" && <MealSheet open onOpenChange={close} {...sheetProps} onSaved={savedThen("Meal saved.")} />}
      {open === "activity" && <ActivitySheet open onOpenChange={close} {...sheetProps} onSaved={savedThen("Activity saved.")} onExercise={() => setSheet("exercise")} />}
      {open === "exercise" && <ExerciseSheet open onOpenChange={close} {...sheetProps} onSaved={savedThen("Exercise saved.")} />}
      {open === "bowel" && <BowelSheet open onOpenChange={close} {...sheetProps} onSaved={savedThen("Bowel movement saved.")} />}
    </Screen>
  );
}
