"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { Button, Caption, Card, Chip, Field, Label, ProTag, SaveStatus, Segmented, inputClass } from "@/components/ui";
import { QuestionField } from "@/components/question";
import { Logo } from "@/components/logo";
import { clearPre, readPre } from "@/lib/client/pre";
import { deviceZone } from "@/lib/client/api";
import { useSave } from "@/lib/client/hooks";
import { useUnsavedGuard } from "@/lib/client/nav";
import { activities, ACTIVITY_GROUP_LABELS, country as countryCfg, PRO_ACTIVITY_IDS, question } from "@/lib/registry";
import { HELP_PAGE_VERSION, HOW_BLOAT_WORKS } from "@/lib/wording";

type Answer = { value: string | string[] | null; at: string };
type Med = { name: string; type: "medicine" | "supplement"; med_group?: string };

const STEPS = ["Consent", "Location, time and units", "About your bloating", "Other symptoms you often get", "Your food", "Health context", "What you want to find out", "Habits to follow", "How Bloat Buddy works"];
const CONSENTS = [
  ["terms_privacy", "CN-01"], ["health_data", "CN-02"], ["wellness_ack", "CN-03"],
] as const;

// Screens 07–14. Answers live in memory only (never in the URL or browser storage) and are sent
// in one atomic commit at the end, with the time each one was answered.
export function Setup() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [country, setCountry] = useState<string>("");
  const [region, setRegion] = useState("");
  const [zone, setZone] = useState("UTC");
  const [zoneConfirmed, setZoneConfirmed] = useState(false);
  const [units, setUnits] = useState<"us" | "metric">("metric");
  const [ticks, setTicks] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [subcuisines, setSubcuisines] = useState<string[]>([]);
  const [meds, setMeds] = useState<Med[]>([]);
  const [medName, setMedName] = useState("");
  const [medType, setMedType] = useState<"medicine" | "supplement">("medicine");
  const [medGroup, setMedGroup] = useState<string | null>(null);
  const [followed, setFollowed] = useState<string[]>([]);
  const help = useRef<{ viewed_at: string; page_version: string } | null>(null);
  const save = useSave();
  const top = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // Already set up? Go to Today. Otherwise pick up the country and help-page acknowledgement.
    fetch("/v1/me/state", { cache: "no-store" }).then((r) => r.json()).then((s) => {
      if (s?.onboarded) return router.replace("/today");
      const pre = readPre();
      // Country, the help page and the 18+ confirmation all come before any health question.
      if (!pre.country || !pre.help_viewed_at) return router.replace("/start");
      if (!pre.adult) return router.replace("/sign-in?new=1");
      help.current = { viewed_at: pre.help_viewed_at, page_version: pre.help_version ?? HELP_PAGE_VERSION };
      setCountry(pre.country);
      setUnits((countryCfg(pre.country)?.units_default as "us" | "metric") ?? "metric");
      setZone(deviceZone());
      setReady(true);
    }).catch(() => setReady(true));
  }, [router]);

  useEffect(() => { top.current?.focus(); window.scrollTo(0, 0); }, [step]);

  // Each step gets its own browser history entry, so the phone's Back button goes to the previous
  // step instead of leaving setup and losing every answer. Only steps already reached can be
  // returned to, so Forward can never skip the consent step.
  const reached = useRef(0);
  useEffect(() => {
    try { history.replaceState({ ...(history.state ?? {}), setupStep: 0 }, ""); } catch { /* history unavailable */ }
    const onPop = (e: PopStateEvent) => {
      const n = (e.state as { setupStep?: unknown } | null)?.setupStep;
      setStep(typeof n === "number" ? Math.max(0, Math.min(n, reached.current)) : 0);
    };
    addEventListener("popstate", onPop);
    return () => removeEventListener("popstate", onPop);
  }, []);
  const next = () => {
    const n = step + 1;
    reached.current = Math.max(reached.current, n);
    try { history.pushState({ ...(history.state ?? {}), setupStep: n }, ""); } catch { /* history unavailable */ }
    setStep(n);
  };
  const previous = () => {
    if ((history.state as { setupStep?: unknown } | null)?.setupStep === step && step > 0) history.back();
    else setStep((s) => Math.max(0, s - 1));
  };
  // Answers live only in this tab's memory until "Go to Today", so leaving asks first.
  const started = step > 0 || Object.values(ticks).some(Boolean) || Object.keys(answers).length > 0 || meds.length > 0 || followed.length > 0;
  useUnsavedGuard(started && save.state !== "saved");

  const set = (id: string) => (value: string | string[] | null) => setAnswers((a) => ({ ...a, [id]: { value, at: new Date().toISOString() } }));
  const val = (id: string) => answers[id]?.value ?? null;
  const on10 = (val("ON-10") as string[] | null) ?? [];
  const cuisines = (val("ON-04") as string[] | null) ?? [];
  const cuisineOrder = useMemo(() => (country === "IN" ? ["south_asian"] : ["north_american"]), [country]);
  const subOptions = ((question("ON-04").subcuisines?.south_asian as Array<{ value: string; label: string }> | undefined) ?? []);
  const canContinue = step === 0 ? CONSENTS.every(([t]) => ticks[t]) : step === 1 ? zoneConfirmed : true;

  async function finish() {
    const now = new Date().toISOString();
    const ids = ["ON-04", "ON-05", "ON-06", "ON-07", "ON-08", "ON-09", "ON-10", "ON-11", "ON-12", "ON-14", "ON-15", "ON-16"];
    const out = await save.run("POST", "/v1/onboarding/commit", {
      age_18_or_older: "yes", country, region: region || undefined, time_zone: zone, units,
      help: help.current, consents: CONSENTS.filter(([t]) => ticks[t]).map(([t]) => t),
      // A question that was not answered is sent as skipped: it stays unknown.
      answers: ids.map((id) => (answers[id]?.value != null ? { question_id: id, value: answers[id]!.value, answered_at: answers[id]!.at } : { question_id: id, skipped: true, answered_at: now })),
      subcuisines: cuisines.includes("south_asian") ? subcuisines : [],
      medicines: val("ON-09") === "yes_add_names" ? meds : [],
      followed,
    });
    if (out) { clearPre(); router.replace("/today"); }
  }

  if (!ready) return <main className="mx-auto max-w-[38rem] px-5 pt-10"><p role="status">Loading…</p></main>;

  return (
    <main className="mx-auto flex min-h-dvh max-w-[38rem] flex-col gap-6 px-5 pb-12 pt-8 md:pt-14">
      <Logo />
      <div>
        <p className="t-caption">Step {step + 1} of {STEPS.length}</p>
        <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-line" aria-hidden><div className="h-full rounded-pill bg-brand transition-all duration-200" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>
      </div>
      <h1 ref={top} tabIndex={-1} className="t-headline outline-none">{STEPS[step]}</h1>

      {step === 0 && (
        <>
          <Card>
            <ul className="flex list-disc flex-col gap-2 pl-5">
              <li>Bloat Buddy stores what you log: bloating, meals, habits and the answers you give here.</li>
              <li>Your records are private to your account. No ads, and nothing is sold.</li>
              <li>Bloat Buddy is a tracker. It does not diagnose or treat anything.</li>
              <li>You can download or delete everything at any time in Me.</li>
            </ul>
          </Card>
          {CONSENTS.map(([type, id]) => (
            <label key={type} className="flex items-start gap-3 rounded-lg border border-line bg-surface p-4">
              <input type="checkbox" className="mt-0.5 h-6 w-6 shrink-0 accent-(--brand)" checked={!!ticks[type]} onChange={(e) => setTicks((t) => ({ ...t, [type]: e.target.checked }))} />
              <span>{question(id).prompt} {type === "terms_privacy" && <><Link href="/terms" target="_blank">Terms</Link> · <Link href="/privacy" target="_blank">Privacy</Link></>}</span>
            </label>
          ))}
          {!canContinue && <Caption>Tick all three to continue. You can see them again in Me.</Caption>}
        </>
      )}

      {step === 1 && (
        <>
          <Field label="Country"><input className={inputClass} value={countryCfg(country)?.name ?? country} readOnly aria-readonly /></Field>
          <Field label="State or province (optional)"><input className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)} maxLength={80} autoComplete="address-level1" /></Field>
          <Card className="flex flex-col gap-3">
            <p className="t-body-strong">Your time zone</p>
            <p className="tabular">{zone}</p>
            <Caption>This decides where each day starts and ends in your diary. It stays the same when you travel; you can change it in Me.</Caption>
            <Chip selected={zoneConfirmed} onClick={() => setZoneConfirmed((z) => !z)}>This is right</Chip>
            {!zoneConfirmed && <Field label="Or type another time zone" hint="For example America/Toronto or Asia/Kolkata"><input className={inputClass} value={zone} onChange={(e) => setZone(e.target.value.trim())} /></Field>}
          </Card>
          <div className="flex flex-col gap-2">
            <p className="t-body-strong">{question("ST-01").prompt}</p>
            <Segmented label="Units" value={units} onChange={setUnits} options={[{ value: "us", label: "US (oz, cups, °F)" }, { value: "metric", label: "Metric (ml, °C)" }]} />
          </div>
        </>
      )}

      {step === 2 && ["ON-06", "ON-07", "ON-08", "ON-12"].map((id) => (
        <Card key={id}><QuestionField id={id} value={val(id)} onChange={set(id)} /><Caption className="mt-3">Leave blank to skip.</Caption></Card>
      ))}

      {step === 3 && (
        <>
          <QuestionField id="ON-11" value={val("ON-11")} onChange={set("ON-11")} />
          <Caption>This is context for your record only. <Link href="/help">When to get medical help</Link></Caption>
        </>
      )}

      {step === 4 && (
        <>
          <QuestionField id="ON-04" value={val("ON-04")} onChange={set("ON-04")} order={cuisineOrder} />
          {cuisines.includes("south_asian") && (
            <div className="flex flex-col gap-3">
              <p className="t-body-strong">Which South Asian food?</p>
              <div className="flex flex-wrap gap-2">
                {subOptions.map((o) => <Chip key={o.value} selected={subcuisines.includes(o.value)} onClick={() => setSubcuisines((s) => (s.includes(o.value) ? s.filter((x) => x !== o.value) : [...s, o.value]))}>{o.label}</Chip>)}
              </div>
            </div>
          )}
          <QuestionField id="ON-05" value={val("ON-05")} onChange={set("ON-05")} />
          <Caption>This only orders suggestions. You can always log any food.</Caption>
        </>
      )}

      {step === 5 && (
        <>
          <Caption>Everything here is optional and used only as context in your own record.</Caption>
          <Card className="flex flex-col gap-4">
            <QuestionField id="ON-09" value={val("ON-09")} onChange={set("ON-09")} hide={["skip"]} />
            {val("ON-09") === "yes_add_names" && (
              <div className="flex flex-col gap-3">
                {meds.map((m, i) => (
                  <div key={`${m.name}-${i}`} className="flex items-center justify-between gap-2 rounded-sm border border-line p-3">
                    <span>{m.name} <span className="t-caption">· {m.type === "medicine" ? "Medicine" : "Supplement"}</span></span>
                    <button type="button" className="min-h-11 px-2 font-semibold text-brand" onClick={() => setMeds((x) => x.filter((_, j) => j !== i))}>Remove</button>
                  </div>
                ))}
                <Field label="Name"><input className={inputClass} value={medName} onChange={(e) => setMedName(e.target.value)} maxLength={120} /></Field>
                <Segmented label="Type" value={medType} onChange={setMedType} options={[{ value: "medicine", label: "Medicine" }, { value: "supplement", label: "Supplement" }]} />
                <QuestionField id="MD-04" value={medGroup} onChange={(v) => setMedGroup(v as string | null)} />
                <Button variant="secondary" disabled={!medName.trim()} onClick={() => { setMeds((x) => [...x, { name: medName.trim(), type: medType, med_group: medGroup ?? undefined }]); setMedName(""); setMedGroup(null); }}>Add to my record</Button>
              </div>
            )}
          </Card>
          <Card><QuestionField id="ON-10" value={val("ON-10")} onChange={set("ON-10")} hide={["skip"]} /></Card>
          <Card><QuestionField id="ON-14" value={val("ON-14")} onChange={set("ON-14")} /></Card>
          <Card><QuestionField id="ON-15" value={val("ON-15")} onChange={set("ON-15")} /></Card>
        </>
      )}

      {step === 6 && (
        <>
          <QuestionField id="ON-16" value={val("ON-16")} onChange={set("ON-16")} optionFilter={(o) => o.value !== "whether_my_cycle_plays_a_part" || on10.includes("cycle_context")} />
          <Caption>This only changes the order things appear in. It never changes a rule or a result.</Caption>
        </>
      )}

      {step === 7 && (
        <>
          <p>Pick up to 3. Each morning Bloat Buddy asks whether they happened yesterday. Only habits you follow can be compared later.</p>
          <p className="t-body-strong tabular" aria-live="polite">{followed.length}/3 chosen</p>
          {Object.entries(ACTIVITY_GROUP_LABELS).map(([group, name]) => (
            <div key={group} className="flex flex-col gap-2">
              <Label>{name}</Label>
              <div className="flex flex-wrap gap-2">
                {activities.filter((a) => a.group === group && (a.id !== "ACT-16" || on10.includes("cycle_context"))).map((a) => {
                  const pro = PRO_ACTIVITY_IDS.has(a.id);
                  const on = followed.includes(a.id);
                  return pro ? (
                    <span key={a.id} className="inline-flex min-h-11 items-center gap-1.5 rounded-sm border border-line bg-surface px-4 text-ink-muted">
                      <Lock size={16} strokeWidth={1.75} aria-hidden />{a.label}<ProTag />
                    </span>
                  ) : (
                    <Chip key={a.id} selected={on} disabled={!on && followed.length >= 3} onClick={() => setFollowed((f) => (on ? f.filter((x) => x !== a.id) : f.length < 3 ? [...f, a.id] : f))}>{a.label}</Chip>
                  );
                })}
              </div>
            </div>
          ))}
          <Caption>Habits marked Pro are part of Bloat Buddy Pro. You can change your habits in Me.</Caption>
        </>
      )}

      {step === 8 && (
        <ol className="flex flex-col gap-3">
          {HOW_BLOAT_WORKS.map((text, i) => (
            <Card as="li" key={i} className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-pill bg-brand-tint font-display text-lg font-semibold">{i + 1}</span>
              <p>{i === 3 ? <>{text.replace(" For worrying symptoms, see When to get medical help.", "")} For worrying symptoms, see <Link href="/help" target="_blank">When to get medical help</Link>.</> : text}</p>
            </Card>
          ))}
        </ol>
      )}

      <div className="mt-2 flex flex-col gap-3">
        {step < 8 ? (
          <Button disabled={!canContinue} onClick={next}>Continue</Button>
        ) : (
          <Button onClick={finish} disabled={save.saving}>{save.saving ? "Saving…" : "Go to Today"}</Button>
        )}
        {step > 0 && <Button variant="quiet" onClick={previous}>Back</Button>}
        {step === 8 && <SaveStatus state={save.state} error={save.error} onCheck={async () => { const ok = await save.check(); if (ok.ok) { clearPre(); router.replace("/today"); } }} />}
      </div>
    </main>
  );
}
