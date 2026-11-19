"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Caption, Card, Segmented, SaveStatus } from "@/components/ui";
import { ProScreen } from "@/components/pro";
import { useLoad, useSave } from "@/lib/client/hooks";
import { api, ApiFailure } from "@/lib/client/api";
import { question, tagLabel } from "@/lib/registry";
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
  const [needConsent, setNeedConsent] = useState(false);
  const save = useSave();
  const agree = useSave();

  return (
    <ProScreen title="Add ingredients" back="/today" load={load}>
      {(d) => {
        const meal = d.meals[index];
        if (!meal) return <><Card><p>All done. There are no more meals from the last 7 days to go through.</p></Card><Link href="/today" className="inline-flex min-h-12 items-center justify-center rounded-pill bg-brand px-5 font-semibold text-on-brand no-underline">Back to Today</Link></>;
        const next = () => { setItems(null); setAnswers({}); setMessage(null); save.reset(); setIndex((i) => i + 1); };
        const check = async () => {
          setBusy(true); setMessage(null);
          try {
            const r = await api<{ status: string; items: Item[]; message: string | null }>("POST", "/v1/food-suggestions", { save_key: meal.save_key, dish_text: meal.dish_text });
            if (r.status === "ok") setItems(r.items); else setMessage(r.message ?? "The check couldn't tell what is in this dish.");
          } catch (e) {
            // The AI check needs the person's own agreement first (CN-04): ask, never assume it.
            if (e instanceof ApiFailure && e.code === "CONSENT_REQUIRED") setNeedConsent(true);
            else setMessage("The check didn't work. You can skip this meal.");
          } finally { setBusy(false); }
        };
        const agreeAndCheck = async () => {
          if ((await agree.run("POST", "/v1/consents", { type: "ai_meal" })) === null) return;
          setNeedConsent(false);
          await check();
        };
        return (
          <>
            <Caption>Meal {index + 1} of {d.meals.length} · {new Date(meal.eaten_at).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" })}</Caption>
            <p className="t-title">{meal.dish_text}</p>
            {needConsent && (
              <Card className="flex flex-col gap-3">
                <p>{question("CN-04").prompt}</p>
                <Caption>Only the dish name is sent. Nothing about your symptoms, health or identity ever is. You can withdraw this in Me.</Caption>
                <Button disabled={agree.saving} onClick={agreeAndCheck}>{agree.saving ? "Saving…" : "I agree, check this dish"}</Button>
                <SaveStatus state={agree.state === "saved" ? "idle" : agree.state} error={agree.error} onCheck={async () => { if ((await agree.check()).ok) { setNeedConsent(false); await check(); } }} />
              </Card>
            )}
            {!items && !message && !needConsent && <><Caption>The first check asks for your agreement to send the dish name to an AI service. Only the dish name is sent.</Caption><Button disabled={busy} onClick={check}>{busy ? "Checking…" : "Check ingredients"}</Button></>}
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
                <SaveStatus state={save.state === "saved" ? "idle" : save.state} error={save.error} onCheck={async () => { if ((await save.check()).ok) next(); }} />
                <Button disabled={save.saving} onClick={async () => {
                  const ok = await save.run("PUT", `/v1/meals/${meal.id}/ingredients`, { mode: "marked", recalled: true, ingredients: items.map((i) => ({ name: i.name, answer: answers[i.name] ?? "not_sure", kind: "listed" })) });
                  if (ok !== null) next();
                }}>{save.saving ? "Saving…" : "Save and next"}</Button>
              </>
            )}
            <Button variant="quiet" disabled={save.saving || busy} onClick={() => { setNeedConsent(false); agree.reset(); next(); }}>Skip this meal</Button>
          </>
        );
      }}
    </ProScreen>
  );
}
