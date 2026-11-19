"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronRight, Lock } from "lucide-react";
import { Button, Caption, Card, Chip, ErrorState, Field, Label, Loading, ProTag, SaveStatus, Screen, Segmented, Sheet, inputClass } from "@/components/ui";
import { QuestionField } from "@/components/question";
import { useLoad, useSave } from "@/lib/client/hooks";
import { api, ApiFailure } from "@/lib/client/api";
import { browserSupabase } from "@/lib/client/supabase";
import { clearPre } from "@/lib/client/pre";
import { activities, ACTIVITY_GROUP_LABELS, country as countryCfg, foodTags, label as optionLabel, PRO_ACTIVITY_IDS, question, tagLabel } from "@/lib/registry";
import type { State } from "@/components/today/types";

type Med = { id: string; name: string; type: string; med_group: string | null; started_on: string | null; changes: Array<{ change: string; date: string | null }> };
type Consent = { type: string; version: string; granted_at: string | null; withdrawn_at: string | null };
type Ent = {
  plan: string; status: string; paused: boolean; pause_until: string | null; interval: string | null; renews_or_ends_at: string | null;
  prices: { annual: string; three_month: string; monthly: string };
};
const CONSENT_NAMES: Record<string, string> = {
  terms_privacy: "Terms and Privacy Policy", health_data: "Storing my health information", wellness_ack: "Bloat is a wellness tracker, not medical advice",
  ai_meal: "AI ingredient check", email: "Weekly email", research: "Research use", doctor_share: "Sharing a report by link",
};
const REQUIRED = ["terms_privacy", "health_data", "wellness_ack"];

function Row({ href, title, text, locked }: { href: string; title: string; text?: string; locked?: boolean }) {
  return (
    <Link href={href} className="flex min-h-14 items-center gap-3 border-b border-line py-3 text-ink no-underline last:border-0">
      {locked && <Lock size={18} strokeWidth={1.75} className="shrink-0 text-ink-muted" aria-hidden />}
      <span className="flex grow flex-col"><span className="font-semibold">{title}{locked && <ProTag />}</span>{text && <span className="t-caption">{text}</span>}</span>
      <ChevronRight size={20} strokeWidth={1.75} className="shrink-0 text-ink-muted" aria-hidden />
    </Link>
  );
}

export async function signOutEverywhere() {
  // Sign-out clears private caches so nothing is left on a shared device (plan B04).
  await browserSupabase().auth.signOut().catch(() => {});
  clearPre();
  try { sessionStorage.clear(); } catch { /* storage off */ }
  if ("caches" in window) { const keys = await caches.keys(); await Promise.all(keys.map((k) => caches.delete(k))); }
  navigator.serviceWorker?.controller?.postMessage("clear");
}

// Screen 39: settings and rights.
export function Me({ testMode }: { testMode: boolean }) {
  const router = useRouter();
  const st = useLoad<State>("/v1/me/state");
  const meds = useLoad<{ medicines: Med[] }>("/v1/medicines");
  const consents = useLoad<{ consents: Consent[] }>("/v1/consents");
  const ent = useLoad<Ent>("/v1/billing/entitlement");
  const [sheet, setSheet] = useState<null | "habits" | "zone" | "med" | "delete" | "eye" | "goal" | "context" | "pause" | "cancel">(null);
  const profile = useSave();
  const plan = useSave();
  const mode = useSave();
  const consent = useSave();
  const [exportMsg, setExportMsg] = useState("");
  const [exporting, setExporting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [withdraw, setWithdraw] = useState<string | null>(null);
  // A profile change being saved, and the data it was made against: once fresh data arrives, the saved value shows.
  const [pending, setPending] = useState<{ body: Record<string, unknown>; base: State | null }>({ body: {}, base: null });

  if (st.loading && !st.data) return <Screen title="Me"><Loading /></Screen>;
  if (st.error && !st.data) return <Screen title="Me"><ErrorState error={st.error} onRetry={st.reload} /></Screen>;
  const s = st.data;
  if (!s || !s.onboarded) return null;
  const pro = s.plan === "pro";
  // Profile switches show the new choice at once, stay locked while it saves, and go back to the
  // saved value (with a message) if the save fails.
  const patch = async (body: Record<string, unknown>) => {
    setPending({ body, base: st.data });
    const ok = await profile.run("PATCH", "/v1/me/profile", body);
    if (ok !== null) st.reload();
    else setPending({ body: {}, base: null });
    return ok;
  };
  const shown = <K extends keyof State["profile"]>(k: K): State["profile"][K] =>
    (pending.base === st.data && k in pending.body ? pending.body[k as string] : s.profile[k]) as State["profile"][K];
  const switchKey = Object.keys(pending.body)[0];
  const switchStatus = (keys: string[]) => (switchKey && keys.includes(switchKey) ? <SaveStatus state={profile.state === "saved" ? "idle" : profile.state} error={profile.error} onCheck={async () => { if ((await profile.check()).ok) st.reload(); }} /> : null);

  async function download(format: "json" | "csv") {
    if (exporting) return;
    setExporting(true);
    setExportMsg("Preparing your download…");
    try {
      const job = await api<{ download_url: string }>("POST", "/v1/export", { format });
      // Fetch the file first, so a failure shows here instead of a broken or partial file.
      const res = await fetch(job.download_url, { cache: "no-store", credentials: "same-origin" });
      if (!res.ok) {
        await res.text().catch(() => "");
        setExportMsg(res.status === 503 ? "Your download couldn't be finished, so nothing was saved. Try again in a moment." : "That didn't work. Try again.");
        return;
      }
      const blob = await res.blob();
      const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? `bloat-data.${format}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setExportMsg("Your download is complete.");
    } catch { setExportMsg("That didn't work. Check your connection and try again."); }
    finally { setExporting(false); }
  }
  const reloadPlan = () => { st.reload(); ent.reload(); };

  return (
    <Screen title="Me">
      <section className="flex flex-col gap-2" aria-labelledby="plan">
        <Label id="plan">Plan</Label>
        <Card className="flex flex-col gap-3">
          <p className="t-body-strong">{pro ? "Bloat Pro" : s.paused ? "Bloat Pro (paused)" : "Bloat Free"}</p>
          {pro && ent.data && <Caption>{ent.data.status === "cancelled" ? "Cancelled. Pro stays on until" : "Renews on"} {ent.data.renews_or_ends_at ? new Date(ent.data.renews_or_ends_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "the end of the period"}.</Caption>}
          {s.paused && ent.data && <Caption>Paused until {ent.data.pause_until ? new Date(ent.data.pause_until).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }) : "you resume"}. No charge while paused. Your records are kept.</Caption>}
          {!pro && !s.paused && <Caption>Free logging never expires. There is no trial: Free is yours to keep.</Caption>}
          {!pro && !s.paused && <Link href="/upgrade" className="inline-flex min-h-12 items-center justify-center rounded-pill bg-brand px-5 font-semibold text-on-brand no-underline">See what Pro adds</Link>}
          {s.paused && <Button disabled={plan.saving} onClick={async () => { if ((await plan.run("POST", "/v1/billing/resume")) !== null) reloadPlan(); }}>{plan.saving ? "Resuming…" : "Resume Pro"}</Button>}
          {pro && ent.data?.status !== "cancelled" && (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => setSheet("pause")}>Pause Pro</Button>
              <Button variant="secondary" onClick={() => setSheet("cancel")}>Cancel</Button>
            </div>
          )}
          <SaveStatus state={plan.state === "saved" ? "idle" : plan.state} error={plan.error} onCheck={async () => { if ((await plan.check()).ok) reloadPlan(); }} />
        </Card>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="profile">
        <Label id="profile">Profile</Label>
        <Card className="flex flex-col gap-4">
          <p>Country: <strong>{countryCfg(s.profile.country)?.name}</strong></p>
          <div className="flex items-center justify-between gap-3">
            <p>Time zone: <strong className="tabular">{s.profile.analysis_time_zone}</strong></p>
            <Button variant="quiet" full={false} onClick={() => setSheet("zone")}>Change</Button>
          </div>
          <div className="flex flex-col gap-2">
            <p className="t-body-strong">{question("ST-01").prompt}</p>
            <Segmented label="Units" value={shown("units")} onChange={(v) => { if (!profile.saving) patch({ units: v }); }} options={[{ value: "us", label: "US" }, { value: "metric", label: "Metric" }]} />
          </div>
          <div className="flex items-center justify-between gap-3">
            <p>What you want to find out: <strong>{s.profile.goals.length ? s.profile.goals.map((g) => optionLabel("ON-16", g)).join(", ") : "Not chosen"}</strong></p>
            <Button variant="quiet" full={false} onClick={() => setSheet("goal")}>Change</Button>
          </div>
          <Button variant="secondary" onClick={() => setSheet("context")}>Cycle, age and other optional context</Button>
          {switchStatus(["units", "goals", "answers"]) ?? (!switchKey && <SaveStatus state={profile.state === "saved" ? "idle" : profile.state} error={profile.error} />)}
        </Card>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="habits">
        <Label id="habits">Habits to follow</Label>
        <Card className="flex flex-col gap-3">
          <p>{s.followed.length ? s.followed.map((id) => activities.find((a) => a.id === id)?.label).join(" · ") : "None chosen"}</p>
          <Caption>Asked each morning. Only followed habits can be compared.</Caption>
          <Button variant="secondary" onClick={() => setSheet("habits")}>Change habits</Button>
        </Card>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="meds">
        <Label id="meds">Medicines and supplements</Label>
        <Card className="flex flex-col gap-3">
          {meds.data?.medicines.length ? (
            <ul>{meds.data.medicines.map((m) => (
              <li key={m.id} className="border-b border-line py-2 last:border-0">
                <span className="font-semibold">{m.name}</span>
                <span className="t-caption"> · {m.med_group ? optionLabel("MD-04", m.med_group) : m.type === "medicine" ? "Medicine" : "Supplement"}{m.started_on ? ` · started ${m.started_on}` : ""}{m.changes.map((c) => ` · ${c.change.replace("_", " ")}${c.date ? ` ${c.date}` : ""}`).join("")}</span>
              </li>
            ))}</ul>
          ) : <Caption>Nothing in your record yet.</Caption>}
          <Caption>A record only. Bloat never comments on medicines.</Caption>
          <Button variant="secondary" onClick={() => setSheet("med")}>Add or change</Button>
        </Card>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="pro">
        <Label id="pro">Pro</Label>
        <Card className="px-4 py-1">
          <Row href={pro ? "/health" : "/upgrade"} title="Health background" text="Conditions and tests for your record" locked={!pro} />
          <Row href={pro ? "/learn" : "/upgrade"} title="Learn library" text="Cards and articles, each with its source" locked={!pro} />
          <Row href={pro ? "/doctor" : "/upgrade"} title="Doctor PDF" text="A report to bring to an appointment" locked={!pro} />
          <Row href={pro ? "/journey" : "/upgrade"} title="Your journey" text="Your whole story on one screen" locked={!pro} />
        </Card>
        {pro && (
          <Card className="flex flex-col gap-3">
            <p className="t-body-strong">Keep an eye on it mode</p>
            <Caption>{s.profile.logging_mode === "keep_an_eye" ? `On. Watching: ${s.profile.watched_groups.map(tagLabel).join(", ")}. Meals are optional.` : "Off. A lighter way to keep logging: your daily score plus a yes or no for up to 5 food groups."}</Caption>
            {s.profile.logging_mode === "keep_an_eye" ? (
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setSheet("eye")}>Change groups</Button>
                <Button variant="secondary" disabled={mode.saving} onClick={async () => { if ((await mode.run("PUT", "/v1/me/logging-mode", { mode: "full" })) !== null) st.reload(); }}>{mode.saving ? "Saving…" : "Back to full logging"}</Button>
              </div>
            ) : <Button variant="secondary" onClick={() => setSheet("eye")}>Switch on</Button>}
            <SaveStatus state={mode.state} error={mode.error} onCheck={async () => { if ((await mode.check()).ok) st.reload(); }} />
            <label className="flex min-h-11 items-center gap-3">
              <input type="checkbox" className="h-6 w-6 accent-(--brand)" checked={shown("keep_meal_photos")} disabled={profile.saving} onChange={(e) => patch({ keep_meal_photos: e.target.checked })} />
              <span>Keep my meal photos <span className="t-caption">(off: a photo is deleted right after its check)</span></span>
            </label>
            {switchStatus(["keep_meal_photos"])}
          </Card>
        )}
        <label className="flex min-h-11 items-center gap-3 px-1">
          <input type="checkbox" className="h-6 w-6 accent-(--brand)" checked={shown("hide_charts")} disabled={profile.saving} onChange={(e) => patch({ hide_charts: e.target.checked })} />
          <span>Hide charts</span>
        </label>
        {switchStatus(["hide_charts"])}
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="consents">
        <Label id="consents">Consents</Label>
        <Card className="px-4 py-1">
          <ul>{(consents.data?.consents ?? []).map((c) => (
            <li key={c.type} className="flex items-center justify-between gap-3 border-b border-line py-3 last:border-0">
              <span className="flex flex-col"><span className="font-semibold">{CONSENT_NAMES[c.type] ?? c.type}</span><span className="t-caption">{c.withdrawn_at ? `Withdrawn ${c.withdrawn_at.slice(0, 10)}` : `Agreed ${c.granted_at?.slice(0, 10)}`} · version {c.version}</span></span>
              {!REQUIRED.includes(c.type) && !c.withdrawn_at && <button type="button" className="min-h-11 px-2 font-semibold text-brand" onClick={() => { consent.reset(); setWithdraw(c.type); }}>Withdraw</button>}
            </li>
          ))}</ul>
        </Card>
        <Caption>The first three are needed to use Bloat. To withdraw them, delete your account below. Withdrawing an optional consent never deletes your diary.</Caption>
      </section>

      <section className="flex flex-col gap-2" aria-labelledby="data">
        <Label id="data">Your data</Label>
        <Card className="flex flex-col gap-3">
          <p className="t-body-strong">Download my data</p>
          <Caption>Everything you have recorded, as a file. Free on every plan.</Caption>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" disabled={exporting} onClick={() => download("json")}>JSON</Button>
            <Button variant="secondary" disabled={exporting} onClick={() => download("csv")}>CSV</Button>
          </div>
          {exportMsg && <p role="status" className="t-caption text-ink">{exportMsg}</p>}
        </Card>
        <Card className="px-4 py-1">
          <Row href="/help" title="When to get medical help" />
          <Row href="/how-bloat-works" title="How Bloat works" text="How scores and comparisons are calculated" />
        </Card>
        <Button variant="secondary" disabled={signingOut} onClick={async () => { setSigningOut(true); await signOutEverywhere(); router.replace("/"); router.refresh(); }}>{signingOut ? "Signing out…" : "Sign out"}</Button>
        <Button variant="danger" onClick={() => setSheet("delete")}>Delete account</Button>
        {testMode && pro === false && !s.paused && (
          <Card className="flex flex-col gap-2">
            <p className="t-body-strong">Preview tools (synthetic accounts only)</p>
            <Caption>Turns on Pro with a mock purchase so Pro screens can be tried. No payment is involved.</Caption>
            <Button variant="secondary" disabled={plan.saving} onClick={async () => { if ((await plan.run("POST", "/v1/billing/mock-purchase", { interval: "three_month" })) !== null) reloadPlan(); }}>Mock purchase: Pro for 3 months</Button>
          </Card>
        )}
      </section>

      {sheet === "habits" && <HabitsSheet s={s} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); st.reload(); }} />}
      {sheet === "zone" && <ZoneSheet s={s} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); st.reload(); }} />}
      {sheet === "med" && <MedSheet meds={meds.data?.medicines ?? []} onClose={() => { setSheet(null); meds.reload(); }} />}
      {sheet === "delete" && <DeleteSheet onClose={() => setSheet(null)} />}
      {sheet === "eye" && <EyeSheet s={s} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); st.reload(); }} />}
      {sheet === "goal" && <GoalSheet s={s} onClose={() => setSheet(null)} onSaved={() => { setSheet(null); st.reload(); }} />}
      {sheet === "context" && <ContextSheet onClose={() => setSheet(null)} onSaved={() => { setSheet(null); st.reload(); }} />}
      {sheet === "pause" && <PauseSheet onClose={() => setSheet(null)} onDone={() => { setSheet(null); reloadPlan(); }} />}
      {sheet === "cancel" && <CancelSheet onClose={() => setSheet(null)} onPause={() => setSheet("pause")} onDone={() => { setSheet(null); reloadPlan(); }} />}
      {withdraw && (
        <Sheet open onOpenChange={(o) => { if (!o && !consent.saving) setWithdraw(null); }} title="Withdraw consent">
          <p>Withdraw <strong>{CONSENT_NAMES[withdraw] ?? withdraw}</strong>? This stops it from now on. Your diary is not deleted, and you can agree again later.</p>
          <SaveStatus state={consent.state} error={consent.error} onCheck={async () => { if ((await consent.check()).ok) { setWithdraw(null); consents.reload(); } }} />
          <Button variant="danger" disabled={consent.saving} onClick={async () => { if ((await consent.run("DELETE", `/v1/consents/${withdraw}`)) !== null) { setWithdraw(null); consents.reload(); } }}>{consent.saving ? "Withdrawing…" : "Withdraw"}</Button>
          <Button variant="secondary" disabled={consent.saving} onClick={() => setWithdraw(null)}>Keep it</Button>
        </Sheet>
      )}
    </Screen>
  );
}

function PauseSheet({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const save = useSave();
  const [months, setMonths] = useState<number | null>(null);
  return (
    <Sheet open onOpenChange={(o) => { if (!o && !save.saving) onClose(); }} title="Pause Pro">
      <p>No charge while paused. Your records are kept, free logging keeps working, and Pro screens are locked until you resume.</p>
      {[1, 2, 3].map((m) => (
        <Button key={m} variant="secondary" disabled={save.saving} onClick={async () => { setMonths(m); if ((await save.run("POST", "/v1/billing/pause", { months: m })) !== null) onDone(); }}>
          {save.saving && months === m ? "Pausing…" : `Pause for ${m} ${m === 1 ? "month" : "months"}`}
        </Button>
      ))}
      <SaveStatus state={save.state} error={save.error} onCheck={async () => { if ((await save.check()).ok) onDone(); }} />
    </Sheet>
  );
}

function CancelSheet({ onClose, onPause, onDone }: { onClose: () => void; onPause: () => void; onDone: () => void }) {
  const save = useSave();
  return (
    <Sheet open onOpenChange={(o) => { if (!o && !save.saving) onClose(); }} title="Cancel Pro">
      <p>Cancelling never deletes your records or past reports. Pro stays on until the end of the period you paid for.</p>
      <Link href="/doctor" className="inline-flex min-h-12 items-center justify-center rounded-pill border border-line bg-surface px-5 font-semibold text-ink no-underline">Download your doctor PDF first</Link>
      <Button variant="secondary" disabled={save.saving} onClick={onPause}>Pause instead</Button>
      <SaveStatus state={save.state} error={save.error} onCheck={async () => { if ((await save.check()).ok) onDone(); }} />
      <Button variant="danger" disabled={save.saving} onClick={async () => { if ((await save.run("POST", "/v1/billing/cancel")) !== null) onDone(); }}>{save.saving ? "Cancelling…" : "Cancel Pro"}</Button>
    </Sheet>
  );
}

function HabitsSheet({ s, onClose, onSaved }: { s: State; onClose: () => void; onSaved: () => void }) {
  const [picked, setPicked] = useState<string[]>(s.followed);
  const save = useSave();
  const pro = s.plan === "pro";
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }} title="Habits to follow">
      <p className="t-body-strong tabular" aria-live="polite">{picked.length}/3 chosen</p>
      {Object.entries(ACTIVITY_GROUP_LABELS).map(([group, name]) => (
        <div key={group} className="flex flex-col gap-2">
          <Label>{name}</Label>
          <div className="flex flex-wrap gap-2">
            {activities.filter((a) => a.group === group && a.id !== "ACT-16").map((a) => {
              const on = picked.includes(a.id);
              if (PRO_ACTIVITY_IDS.has(a.id) && !pro) return <span key={a.id} className="inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-line px-4 text-ink-muted"><Lock size={16} strokeWidth={1.75} aria-hidden />{a.label}<ProTag /></span>;
              return <Chip key={a.id} selected={on} disabled={!on && picked.length >= 3} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== a.id) : p.length < 3 ? [...p, a.id] : p))}>{a.label}</Chip>;
            })}
          </div>
        </div>
      ))}
      <SaveStatus state={save.state} error={save.error} />
      <Button disabled={save.saving} onClick={async () => { const ok = await save.run("PUT", "/v1/me/followed-activities", { activity_ids: picked }); if (ok) onSaved(); }}>{save.saving ? "Saving…" : "Save"}</Button>
    </Sheet>
  );
}

function ZoneSheet({ s, onClose, onSaved }: { s: State; onClose: () => void; onSaved: () => void }) {
  const [zone, setZone] = useState(() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone; } catch { return s.profile.analysis_time_zone; } });
  const [preview, setPreview] = useState<{ from: string; to: string; effective_from: string } | null>(null);
  const [msg, setMsg] = useState("");
  const save = useSave();
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }} title="Change time zone">
      <p>Your days are counted in <strong>{s.profile.analysis_time_zone}</strong>. Travelling does not change this by itself.</p>
      <Field label="New time zone" hint="For example America/Toronto or Asia/Kolkata"><input className={inputClass} value={zone} onChange={(e) => { setZone(e.target.value.trim()); setPreview(null); }} /></Field>
      {!preview ? (
        <Button variant="secondary" onClick={async () => {
          setMsg("");
          try { const r = await api<{ preview: typeof preview }>("PATCH", "/v1/me/profile", { analysis_time_zone: zone, preview: true }); if (r.preview) setPreview(r.preview); else setMsg("That is already your time zone."); }
          catch (e) { setMsg(e instanceof ApiFailure && (e.status === 400 || e.status === 422) ? "That time zone name isn't valid." : "That didn't load. Check your connection and try again."); }
        }}>Preview the change</Button>
      ) : (
        <>
          <Card><p>From <strong>{preview.effective_from}</strong>, your days will be counted in <strong>{preview.to}</strong>.</p><Caption className="mt-2">Days you have already recorded keep their dates. Nothing in your history moves.</Caption></Card>
          <Button disabled={save.saving} onClick={async () => { const ok = await save.run("PATCH", "/v1/me/profile", { analysis_time_zone: zone }); if (ok) onSaved(); }}>{save.saving ? "Saving…" : "Confirm change"}</Button>
        </>
      )}
      {msg && <p role="alert" className="t-caption text-ink">{msg}</p>}
      <SaveStatus state={save.state} error={save.error} />
    </Sheet>
  );
}

function MedSheet({ meds, onClose }: { meds: Med[]; onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"medicine" | "supplement">("medicine");
  const [group, setGroup] = useState<string | null>(null);
  const [started, setStarted] = useState("");
  const [list, setList] = useState(meds);
  const [changeFor, setChangeFor] = useState<string | null>(null);
  const [change, setChange] = useState<string | null>(null);
  const [changeDate, setChangeDate] = useState("");
  const save = useSave<{ medicine: Med }>();
  const edit = useSave();
  const [removeId, setRemoveId] = useState<string | null>(null);
  const today = new Date().toISOString().slice(0, 10);
  const saveChange = async (id: string) => {
    const out = await edit.run("POST", `/v1/medicines/${id}/changes`, { change, ...(changeDate ? { date: changeDate, precision: "exact" } : { precision: "not_sure" }) });
    if (out !== null) { setChangeFor(null); setChange(null); setChangeDate(""); }
  };
  const remove = async (id: string) => {
    if ((await edit.run("DELETE", `/v1/medicines/${id}`)) !== null) { setList((l) => l.filter((x) => x.id !== id)); setRemoveId(null); }
  };
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }} title="Medicines and supplements" dirty={!!name.trim() || !!change}>
      {list.map((m) => (
        <Card key={m.id} className="flex flex-col gap-2">
          <p className="t-body-strong">{m.name}</p>
          {changeFor === m.id ? (
            <>
              <Segmented label={question("MD-02").prompt} value={change} onChange={setChange} options={[{ value: "stopped", label: "Stopped" }, { value: "dose_changed", label: "Dose changed" }, { value: "restarted", label: "Restarted" }]} />
              <Field label="Date (optional)"><input type="date" className={inputClass} max={today} value={changeDate} onChange={(e) => setChangeDate(e.target.value)} /></Field>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" disabled={edit.saving} onClick={() => { setChangeFor(null); setChange(null); setChangeDate(""); edit.reset(); }}>Cancel</Button>
                <Button disabled={!change || edit.saving} onClick={() => saveChange(m.id)}>{edit.saving ? "Saving…" : "Save change"}</Button>
              </div>
              <SaveStatus state={edit.state} error={edit.error} onCheck={async () => { if ((await edit.check()).ok) { setChangeFor(null); setChange(null); setChangeDate(""); } }} />
            </>
          ) : removeId === m.id ? (
            <>
              <p>Remove {m.name} from your record? Past days keep what was logged.</p>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" disabled={edit.saving} onClick={() => { setRemoveId(null); edit.reset(); }}>Keep it</Button>
                <Button variant="danger" disabled={edit.saving} onClick={() => remove(m.id)}>{edit.saving ? "Removing…" : "Remove"}</Button>
              </div>
              <SaveStatus state={edit.state} error={edit.error} onCheck={async () => { if ((await edit.check()).ok) { setList((l) => l.filter((x) => x.id !== m.id)); setRemoveId(null); } }} />
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" disabled={edit.saving} onClick={() => { edit.reset(); setRemoveId(null); setChangeFor(m.id); }}>{question("MD-02").prompt}</Button>
              <Button variant="danger" disabled={edit.saving} onClick={() => { edit.reset(); setChangeFor(null); setRemoveId(m.id); }}>Remove</Button>
            </div>
          )}
        </Card>
      ))}
      <p className="t-title">{question("MD-01").prompt}</p>
      <Field label="Name"><input className={inputClass} maxLength={120} value={name} onChange={(e) => setName(e.target.value)} /></Field>
      <Segmented label="Type" value={type} onChange={setType} options={[{ value: "medicine", label: "Medicine" }, { value: "supplement", label: "Supplement" }]} />
      <QuestionField id="MD-04" value={group} onChange={(v) => setGroup(v as string | null)} />
      <Field label="Start date (optional)"><input type="date" className={inputClass} max={today} value={started} onChange={(e) => setStarted(e.target.value)} /></Field>
      <SaveStatus state={save.state} error={save.error} />
      <Button disabled={!name.trim() || save.saving} onClick={async () => {
        const out = await save.run("POST", "/v1/medicines", { name: name.trim(), type, ...(group ? { med_group: group } : {}), ...(started ? { started_on: started, started_precision: "exact" } : { started_precision: "not_sure" }) });
        if (out) { setList((l) => [...l, out.medicine]); setName(""); setGroup(null); setStarted(""); }
      }}>{save.saving ? "Saving…" : "Add to my record"}</Button>
    </Sheet>
  );
}

function EyeSheet({ s, onClose, onSaved }: { s: State; onClose: () => void; onSaved: () => void }) {
  const [groups, setGroups] = useState<string[]>(s.profile.watched_groups);
  const save = useSave();
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }} title="Keep an eye on it">
      <p>{question("KM-01").prompt}</p>
      <p className="t-body-strong tabular" aria-live="polite">{groups.length}/5 chosen</p>
      <div className="flex flex-wrap gap-2">
        {foodTags.map((t) => { const on = groups.includes(t.id); return <Chip key={t.id} selected={on} disabled={!on && groups.length >= 5} onClick={() => setGroups((g) => (on ? g.filter((x) => x !== t.id) : g.length < 5 ? [...g, t.id] : g))}>{t.label}</Chip>; })}
      </div>
      <Caption>Each morning the review asks whether you had each one. Meal logging becomes optional. One tap in Me returns to full logging.</Caption>
      <SaveStatus state={save.state} error={save.error} />
      <Button disabled={!groups.length || save.saving} onClick={async () => { const ok = await save.run("PUT", "/v1/me/logging-mode", { mode: "keep_an_eye", watched_groups: groups }); if (ok) onSaved(); }}>{save.saving ? "Saving…" : "Save"}</Button>
    </Sheet>
  );
}

function GoalSheet({ s, onClose, onSaved }: { s: State; onClose: () => void; onSaved: () => void }) {
  const [goals, setGoals] = useState<string[] | null>(s.profile.goals.length ? s.profile.goals : null);
  const save = useSave();
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }} title="Your goal">
      <QuestionField id="ON-16" value={goals} onChange={(v) => setGoals(v as string[] | null)} optionFilter={(o) => o.value !== "whether_my_cycle_plays_a_part" || s.cycle_context} />
      <Caption>This only changes the order things appear in. It never changes a rule, a threshold or a past result.</Caption>
      <SaveStatus state={save.state} error={save.error} />
      <Button disabled={save.saving} onClick={async () => { const ok = await save.run("PATCH", "/v1/me/profile", { goals: goals ?? [] }); if (ok) onSaved(); }}>{save.saving ? "Saving…" : "Save"}</Button>
    </Sheet>
  );
}

function ContextSheet({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [on10, setOn10] = useState<string[] | null>(null);
  const [on14, setOn14] = useState<string | null>(null);
  const [on15, setOn15] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const save = useSave();
  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose(); }} title="Optional context">
      <Caption>Optional, and used only as context in your own record. Choose an answer to change it; leave a question untouched to keep what you answered before.</Caption>
      <QuestionField id="ON-10" value={on10} onChange={(v) => { setOn10(v as string[] | null); setTouched((t) => ({ ...t, "ON-10": true })); }} hide={["skip"]} />
      <QuestionField id="ON-14" value={on14} onChange={(v) => { setOn14(v as string | null); setTouched((t) => ({ ...t, "ON-14": true })); }} />
      <QuestionField id="ON-15" value={on15} onChange={(v) => { setOn15(v as string | null); setTouched((t) => ({ ...t, "ON-15": true })); }} />
      <SaveStatus state={save.state} error={save.error} />
      <Button disabled={save.saving || !Object.keys(touched).length} onClick={async () => {
        const answers: Record<string, unknown> = {};
        if (touched["ON-10"]) answers["ON-10"] = on10;
        if (touched["ON-14"]) answers["ON-14"] = on14;
        if (touched["ON-15"]) answers["ON-15"] = on15;
        const ok = await save.run("PATCH", "/v1/me/profile", { answers });
        if (ok) onSaved();
      }}>{save.saving ? "Saving…" : "Save"}</Button>
    </Sheet>
  );
}

function DeleteSheet({ onClose }: { onClose: () => void }) {
  const [text, setText] = useState("");
  const del = useSave();
  const [leaving, setLeaving] = useState(false);
  const busy = del.saving || leaving;
  const finish = async () => { setLeaving(true); await signOutEverywhere(); location.href = "/"; };
  return (
    <Sheet open onOpenChange={(o) => { if (!o && !busy) onClose(); }} title="Delete account">
      <p>This deletes your account and every record in it for good: bloating, meals, reviews, reports and photos. It cannot be undone.</p>
      <Caption>You may want to download your data first.</Caption>
      <Field label="Type DELETE to confirm"><input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} autoCapitalize="characters" autoComplete="off" /></Field>
      {del.state === "error" && <p role="alert" className="t-caption text-ink">That didn&apos;t work. Nothing was deleted. Try again.</p>}
      {del.state === "unknown" && (
        <div role="alert" className="flex flex-col gap-2">
          <p className="t-caption text-ink">Connection lost. We can&apos;t tell yet whether your account was deleted.</p>
          <Button variant="secondary" onClick={async () => { if ((await del.check()).ok) await finish(); }}>Check and finish</Button>
        </div>
      )}
      <Button variant="danger" disabled={text !== "DELETE" || busy} onClick={async () => {
        if ((await del.run("POST", "/v1/account/delete", { confirm: "DELETE" })) !== null) await finish();
      }}>{busy ? "Deleting…" : "Delete my account"}</Button>
      <Button variant="secondary" disabled={busy} onClick={onClose}>Keep my account</Button>
    </Sheet>
  );
}
