"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Caption, Card, ErrorState, Label, Loading, Screen, Chip } from "@/components/ui";
import { useLoad } from "@/lib/client/hooks";
import { api } from "@/lib/client/api";
import type { State } from "@/components/today/types";

type Ent = {
  plan: string; paused: boolean; checkout_enabled: boolean; recalled_check_offered: boolean;
  prices: { currency: string; tax: string; annual: string; three_month: string; monthly: string; annual_per_month: string; three_month_per_month: string };
};
type Recall = { offered: boolean; meals: Array<{ id: string; dish_text: string }> };
const ADDS = [
  "Ingredient check for typed dishes and photos, and saved dishes",
  "Chart, 7-day average and time-of-day pattern",
  "Possible triggers, with day counts on every result",
  "Habit and food-swap experiments",
  "Weekly report, Your journey and the doctor PDF",
  "Sleep, stress, travel and illness habits; bowel and exercise logs",
  "One card a day and the Learn library",
];

// Screen 38: explain and sell Pro honestly. Only true facts; no teaser of any finding.
export function Upgrade({ testMode }: { testMode: boolean }) {
  const ent = useLoad<Ent>("/v1/billing/entitlement");
  const st = useLoad<State>("/v1/me/state");
  const recall = useLoad<Recall>(ent.data?.plan === "pro" ? "/v1/meals/recalled-check" : null);
  const [plan, setPlan] = useState<"annual" | "three_month" | "monthly">("annual");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  if (ent.loading && !ent.data) return <Screen title="Bloat Pro" back="/me"><Loading /></Screen>;
  if (ent.error && !ent.data) return <Screen title="Bloat Pro" back="/me"><ErrorState error={ent.error} onRetry={ent.reload} /></Screen>;
  const e = ent.data!;
  const p = e.prices;

  if (e.plan === "pro") {
    return (
      <Screen title="You have Pro" back="/me">
        <Card><p>Everything in Pro is switched on.</p><Caption>Manage, pause or cancel in Me.</Caption></Card>
        {recall.data && !recall.data.offered && recall.data.meals.length > 0 && (
          <Card className="flex flex-col gap-3">
            <p className="t-body-strong">Add ingredients to your last 7 days of meals?</p>
            <Caption>You have {recall.data.meals.length} {recall.data.meals.length === 1 ? "meal" : "meals"} from the last 7 days with no ingredients. Anything you add is saved as &quot;added afterwards&quot; and labelled on results. This is offered once.</Caption>
            <Button disabled={busy} onClick={async () => { setBusy(true); await api("POST", "/v1/meals/recalled-check", { answer: "yes_go_through_them" }).catch(() => {}); location.href = "/meal/recall"; }}>Yes, go through them</Button>
            <Button variant="secondary" disabled={busy} onClick={async () => { setBusy(true); await api("POST", "/v1/meals/recalled-check", { answer: "not_now" }).catch(() => {}); recall.reload(); setBusy(false); }}>Not now</Button>
          </Card>
        )}
        <Link href="/health" className="font-semibold">Add your health background (optional)</Link>
        <Link href="/today" className="inline-flex min-h-12 items-center justify-center rounded-pill bg-brand px-5 font-semibold text-on-brand no-underline">Go to Today</Link>
      </Screen>
    );
  }
  const progress = st.data?.progress;
  return (
    <Screen title="Bloat Pro" back="/me">
      {progress && (
        <Card className="bg-brand-tint">
          <p>You have {progress.confirmed_days} confirmed {progress.confirmed_days === 1 ? "day" : "days"} and {progress.days_logged} {progress.days_logged === 1 ? "day" : "days"} logged. Pro shows your chart and compares your days once there are enough of them.</p>
        </Card>
      )}
      <section className="flex flex-col gap-2" aria-labelledby="adds">
        <Label id="adds">What Pro adds</Label>
        <Card><ul className="list-disc pl-5">{ADDS.map((a) => <li key={a} className="py-0.5">{a}</li>)}</ul></Card>
        <Caption>Free logging never stops, and safety information is never part of Pro.</Caption>
      </section>
      <section className="flex flex-col gap-2" aria-labelledby="price">
        <Label id="price">Price</Label>
        <div role="radiogroup" aria-label="Plan" className="flex flex-col gap-2">
          <Chip role="radio" selected={plan === "annual"} onClick={() => setPlan("annual")}>{p.annual} a year <span className="t-caption">· {p.annual_per_month} a month</span></Chip>
          <Chip role="radio" selected={plan === "three_month"} onClick={() => setPlan("three_month")}>{p.three_month} every 3 months <span className="t-caption">· {p.three_month_per_month} a month</span></Chip>
          <Chip role="radio" selected={plan === "monthly"} onClick={() => setPlan("monthly")}>{p.monthly} a month</Chip>
        </div>
        <Caption>
          {p.tax === "added at checkout" ? "Tax is added at checkout." : "Includes 18% GST."} The plan renews at the same price until you cancel or pause. Cancel in two taps in Me; your records and past reports are kept. You can pause for 1, 2 or 3 months instead. There is no free trial: the Free plan never expires.
        </Caption>
        <Caption>The price charged follows the country of your payment method.</Caption>
      </section>
      <Button disabled={busy} onClick={async () => {
        setBusy(true);
        try { const r = await api<{ message: string }>("POST", "/v1/billing/checkout", { interval: plan }); setMsg(r.message); } catch { setMsg("That didn't work. Nothing was charged."); }
        setBusy(false);
      }}>Upgrade</Button>
      {msg && <p role="status" className="t-caption text-ink">{msg}</p>}
      {testMode && (
        <Card className="flex flex-col gap-2">
          <p className="t-body-strong">Preview tools (synthetic accounts only)</p>
          <Caption>A mock purchase turns Pro on so its screens can be tried. No payment is involved.</Caption>
          <Button variant="secondary" disabled={busy} onClick={async () => { setBusy(true); await api("POST", "/v1/billing/mock-purchase", { interval: plan }).catch(() => {}); ent.reload(); setBusy(false); }}>Mock purchase</Button>
        </Card>
      )}
    </Screen>
  );
}
