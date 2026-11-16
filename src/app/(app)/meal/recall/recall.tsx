"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Caption, Card, Segmented, SaveStatus } from "@/components/ui";
import { ProScreen } from "@/components/pro";
import { useLoad, useSave } from "@/lib/client/hooks";
import { api, ApiFailure } from "@/lib/client/api";
import { tagLabel } from "@/lib/registry";
import { AI_FIXED_TEXT } from "@/lib/wording";

type MealRow = { id: string; dish_text: string; eaten_at: string; save_key: string };
type Item = { name: string; food_group: string };
type Answer = "had" | "didnt_have" | "not_sure";

// RC-01: after upgrading, add ingredients to meals from the last 7 days. Saved as "recalled".
export function Recall() {
  const load = useLoad<{ meals: MealRow[] }>("/v1/meals/recalled-check");
  const [index, setIndex] = useState(0);
  const [items, setItems] = useState<Item[] | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [busy, setBusy] = useState(false);
  const save = useSave();

  return (
    <ProScreen title="Add ingredients" back="/today" load={load}>
      {(d) => {
        const meal = d.meals[index];
        if (!meal) return <><Card><p>All done. There are no more meals from the last 7 days to go through.</p></Card><Link href="/today" className="inline-flex min-h-12 items-center justify-center rounded-pill bg-brand px-5 font-semibold text-on-brand no-underline">Back to Today</Link></>;
        const next = () => { setItems(null); setAnswers({}); setMessage(null); save.reset(); setIndex((i) => i + 1); };
        const check = async () => {
          setBusy(true);
          try {
            const r = await api<{ status: string; items: Item[]; message: string | null }>("POST", "/v1/food-suggestions", { save_key: meal.save_key, dish_text: meal.dish_text });
            if (r.status === "ok") setItems(r.items); else setMessage(r.message ?? "The check couldn't tell what is in this dish.");
          } catch (e) {
            if (e instanceof ApiFailure && e.code === "CONSENT_REQUIRED") { await api("POST", "/v1/consents", { type: "ai_meal" }); setBusy(false); return check(); }
            setMessage("The check didn't work. You can skip this meal.");
          }
          setBusy(false);
        };
        return (
          <>
            <Caption>Meal {index + 1} of {d.meals.length} · {new Date(meal.eaten_at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</Caption>
            <p className="t-title">{meal.dish_text}</p>
            {!items && !message && <><Caption>The first check asks for your agreement to send the dish name to an AI service. Only the dish name is sent.</Caption><Button disabled={busy} onClick={check}>{busy ? "Checking…" : "Check ingredients"}</Button></>}
            {message && <Card><p>{message}</p></Card>}
            {items && (
              <>
                <Caption>{AI_FIXED_TEXT}</Caption>
                <ul className="flex flex-col gap-3">{items.map((i) => (
                  <li key={i.name} className="flex flex-col gap-2 rounded-lg border border-line p-4">
                    <div><p className="t-body-strong capitalize">{i.name}</p><Caption>{tagLabel(i.food_group)} · Usually in this recipe</Caption></div>
                    <Segmented label={`Did you have ${i.name}?`} value={answers[i.name] ?? "not_sure"} onChange={(v) => setAnswers((a) => ({ ...a, [i.name]: v }))} options={[{ value: "had", label: "Had" }, { value: "didnt_have", label: "Didn't have" }, { value: "not_sure", label: "Not sure" }]} />
                  </li>
                ))}</ul>
                <SaveStatus state={save.state === "saved" ? "idle" : save.state} error={save.error} />
                <Button disabled={save.saving} onClick={async () => {
                  const ok = await save.run("PUT", `/v1/meals/${meal.id}/ingredients`, { mode: "marked", recalled: true, ingredients: items.map((i) => ({ name: i.name, answer: answers[i.name] ?? "not_sure", kind: "listed" })) });
                  if (ok) next();
                }}>{save.saving ? "Saving…" : "Save and next"}</Button>
              </>
            )}
            <Button variant="quiet" onClick={next}>Skip this meal</Button>
          </>
        );
      }}
    </ProScreen>
  );
}
