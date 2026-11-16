"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { Camera, Lock } from "lucide-react";
import { Button, Caption, Card, Chip, Field, Label, ProTag, SaveStatus, Segmented, Sheet, inputClass } from "@/components/ui";
import { QuestionField } from "@/components/question";
import { AmbiguousChoice, TimePick, type TimeValue } from "@/components/timepick";
import { useSave } from "@/lib/client/hooks";
import { api, ApiFailure, deviceZone, newKey } from "@/lib/client/api";
import { question, tagLabel } from "@/lib/registry";
import { AI_FIXED_TEXT } from "@/lib/wording";
import type { State } from "./types";

type Item = { name: string; food_group: string; source_label: "seen_in_photo" | "usually_in_recipe" };
type Check = { status: string; dishes: string[]; items: Item[]; message: string | null; provider_label: string };
type Answer = "had" | "didnt_have" | "not_sure";
const UNITS = ["slices", "pieces", "cups", "bowls", "plates", "cans_or_bottles", "fl_oz", "ml"];
const SOURCE_LABEL = { seen_in_photo: "Seen in photo", usually_in_recipe: "Usually in this recipe" } as const;

type Props = { open: boolean; onOpenChange: (o: boolean) => void; state: State; onSaved: () => void };

// Screens 20 and 21. A meal always saves: on Free at once, on Pro with or without the ingredient check.
export function MealSheet({ open, onOpenChange, state, onSaved }: Props) {
  const pro = state.plan === "pro";
  const zone = deviceZone();
  const saveKey = useRef(newKey());
  const [step, setStep] = useState<"details" | "consent" | "check">("details");
  const [text, setText] = useState("");
  const [when, setWhen] = useState<TimeValue>({ mode: "now", zone });
  const [portion, setPortion] = useState<string | null>(null);
  const [count, setCount] = useState("");
  const [unit, setUnit] = useState("pieces");
  const [pace, setPace] = useState<string | null>(null);
  const [origin, setOrigin] = useState<string | null>(null);
  const [source, setSource] = useState<"typed" | "photo" | "recent" | "saved_dish">("typed");
  const [dishId, setDishId] = useState<string | null>(null);
  const [check, setCheck] = useState<Check | null>(null);
  const [checking, setChecking] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [added, setAdded] = useState<string[]>([]);
  const [addText, setAddText] = useState("");
  const [asDish, setAsDish] = useState(false);
  const [place, setPlace] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const save = useSave<{ meal: { ai_check_status: string } }>();

  const shortcuts = [...new Set([...(state.pro?.frequent_dishes ?? []), ...(state.recent_dishes ?? [])])].slice(0, 6);

  function base(offset?: number): Record<string, unknown> {
    const eaten = when.mode === "now" || when.mode === "unknown" ? { mode: "now", zone } : { ...when, ...(offset !== undefined ? { offset_min: offset } : {}) };
    const body: Record<string, unknown> = { save_key: saveKey.current, dish_text: text.trim(), eaten, source: dishId ? "typed" : source };
    if (portion) body.portion = portion;
    if (count && Number(count) > 0) body.amount = { count: Number(count), unit };
    if (pace) body.pace = pace;
    if (origin) body.origin = origin;
    if (!pro && (source === "photo" || source === "saved_dish")) body.source = "typed";
    return body;
  }

  async function finish(body: Record<string, unknown>) {
    const out = await save.run("POST", "/v1/meals", body);
    if (out) { onSaved(); onOpenChange(false); }
  }

  async function runCheck() {
    setChecking(true); setNotice(null);
    try {
      const res = await api<Check>("POST", "/v1/food-suggestions", { save_key: saveKey.current, dish_text: text.trim() });
      setCheck(res); setStep("check");
    } catch (e) {
      if (e instanceof ApiFailure && e.code === "CONSENT_REQUIRED") setStep("consent");
      else { setCheck({ status: "failed", dishes: [], items: [], message: "Your meal is saved when you tap Save. Add ingredients yourself, or try the check again later.", provider_label: "" }); setStep("check"); }
    } finally { setChecking(false); }
  }

  async function onPhoto(file: File) {
    setChecking(true); setNotice(null);
    const form = new FormData();
    form.set("photo", file); form.set("save_key", saveKey.current);
    try {
      const res = await api<Check>("POST", "/v1/meal-photos", undefined, { form });
      if (res.status === "ok") { setSource("photo"); setText((t) => t || res.dishes.join(", ").slice(0, 300)); setCheck(res); setStep("check"); }
      else setNotice(res.message ?? "The photo didn't show clearly what the dish is. Type the dish instead.");
    } catch (e) {
      if (e instanceof ApiFailure && e.code === "CONSENT_REQUIRED") setStep("consent");
      else setNotice(e instanceof ApiFailure ? e.message : "The photo could not be checked. Type the dish instead.");
    } finally { setChecking(false); }
  }

  const title = step === "details" ? "Add meal" : step === "consent" ? "Before the first check" : "Ingredient check";
  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={title}>
      {step === "details" && (
        <>
          <Field label={question("ML-01").prompt} hint={`${text.length}/300`}>
            <textarea className={`${inputClass} min-h-20 py-3`} maxLength={300} value={text} onChange={(e) => { setText(e.target.value); setDishId(null); if (source !== "photo") setSource("typed"); }} placeholder="For example: chicken burrito with beans" />
          </Field>
          {(shortcuts.length > 0 || (pro && (state.pro?.saved_dishes?.length ?? 0) > 0)) && (
            <div className="flex flex-col gap-2">
              {pro && (state.pro?.saved_dishes?.length ?? 0) > 0 && (
                <>
                  <Label>Your saved dishes</Label>
                  <div className="flex flex-wrap gap-2">
                    {state.pro!.saved_dishes!.map((d) => <Chip key={d.id} role="radio" selected={dishId === d.id} onClick={() => { setDishId(d.id); setText(d.place ? `${d.name} – ${d.place}` : d.name); setSource("saved_dish"); }}>{d.name}{d.place ? ` – ${d.place}` : ""}</Chip>)}
                  </div>
                </>
              )}
              {shortcuts.length > 0 && (
                <>
                  <Label>Recent</Label>
                  <div className="flex flex-wrap gap-2">{shortcuts.map((d) => <Chip key={d} role="radio" selected={text === d && !dishId} onClick={() => { setText(d); setDishId(null); setSource("recent"); }}>{d}</Chip>)}</div>
                </>
              )}
            </div>
          )}
          {pro ? (
            <>
              <input ref={fileRef} type="file" accept="image/*" capture="environment" className="sr-only" tabIndex={-1} aria-hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onPhoto(f); e.target.value = ""; }} />
              <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={checking}><Camera size={20} strokeWidth={1.75} aria-hidden />{checking ? "Checking photo…" : "Take a photo"}</Button>
            </>
          ) : (
            <div className="flex items-center justify-between gap-2 rounded-lg border border-line p-4 text-ink-muted">
              <span className="inline-flex items-center gap-2"><Lock size={18} strokeWidth={1.75} aria-hidden />Photo and ingredient check</span>
              <Link href="/upgrade" className="inline-flex min-h-11 items-center font-semibold">See Pro<ProTag /></Link>
            </div>
          )}
          {notice && <p role="status" className="t-caption text-ink">{notice}</p>}
          <div className="flex flex-col gap-3">
            <p className="t-body-strong">{question("ML-02").prompt}</p>
            <TimePick name="When did you have it?" value={when} onChange={setWhen} allowApproximate={false} />
          </div>
          <div className="flex flex-col gap-3">
            <QuestionField id="ML-04" value={portion} onChange={(v) => setPortion(v as string | null)} />
            <div className="flex gap-2">
              <label className="flex-1"><span className="sr-only">Amount (optional)</span><input className={inputClass} inputMode="decimal" placeholder="Amount (optional)" value={count} onChange={(e) => setCount(e.target.value.replace(/[^0-9.]/g, ""))} /></label>
              <label className="flex-1"><span className="sr-only">Unit</span>
                <select className={inputClass} value={unit} onChange={(e) => setUnit(e.target.value)}>{UNITS.map((u) => <option key={u} value={u}>{u.replace(/_/g, " ")}</option>)}</select>
              </label>
            </div>
          </div>
          <QuestionField id="ML-05" value={pace} onChange={(v) => setPace(v as string | null)} hide={["skip"]} />
          <QuestionField id="ML-06" value={origin} onChange={(v) => setOrigin(v as string | null)} hide={["skip"]} />
          <AmbiguousChoice error={save.error} onChoose={(o) => finish(dishId ? { ...base(o), saved_dish_id: dishId } : base(o))} />
          <SaveStatus state={save.state} error={save.error?.code === "AMBIGUOUS_TIME" ? null : save.error} onCheck={async () => { await save.check(); onSaved(); onOpenChange(false); }} />
          {pro && !dishId ? (
            <>
              <Button onClick={runCheck} disabled={!text.trim() || checking || save.saving}>{checking ? "Checking…" : "Next: check ingredients"}</Button>
              <Button variant="secondary" onClick={() => finish(base())} disabled={!text.trim() || save.saving}>Save without the check</Button>
            </>
          ) : (
            <Button onClick={() => finish(dishId ? { ...base(), saved_dish_id: dishId } : base())} disabled={!text.trim() || save.saving}>{save.saving ? "Saving…" : "Save"}</Button>
          )}
          {!text.trim() && <Caption>Type what you had to save.</Caption>}
        </>
      )}

      {step === "consent" && (
        <>
          <Card><p>{question("CN-04").prompt}</p><Caption className="mt-2">Only the dish name or the photo is sent. Nothing about your symptoms, health or identity ever is. You can withdraw this in Me.</Caption></Card>
          <Button onClick={async () => { try { await api("POST", "/v1/consents", { type: "ai_meal" }); await runCheck(); } catch { setNotice("That didn't save. Try again."); } }} disabled={checking}>I agree</Button>
          <Button variant="secondary" onClick={() => finish(base())} disabled={save.saving}>No thanks, save the meal</Button>
          {notice && <p role="alert" className="t-caption text-ink">{notice}</p>}
        </>
      )}

      {step === "check" && check && (
        <>
          <p className="t-body-strong">{text}</p>
          {check.status === "ok" ? (
            <>
              <Caption>{AI_FIXED_TEXT}{check.provider_label && check.provider_label !== "AI suggestion" ? ` (${check.provider_label})` : ""}</Caption>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setAnswers(Object.fromEntries(check.items.map((i) => [i.name, "had"])))}>Had all of these</Button>
                <Button variant="secondary" onClick={() => setAnswers(Object.fromEntries(check.items.map((i) => [i.name, "didnt_have"])))}>None of these</Button>
              </div>
              <ul className="flex flex-col gap-3">
                {check.items.map((i) => (
                  <li key={i.name} className="flex flex-col gap-2 rounded-lg border border-line p-4">
                    <div><p className="t-body-strong capitalize">{i.name}</p><Caption>{tagLabel(i.food_group)} · {SOURCE_LABEL[i.source_label]}</Caption></div>
                    <Segmented label={`Did you have ${i.name}?`} value={answers[i.name] ?? "not_sure"} onChange={(v) => setAnswers((a) => ({ ...a, [i.name]: v }))}
                      options={[{ value: "had", label: "Had" }, { value: "didnt_have", label: "Didn't have" }, { value: "not_sure", label: "Not sure" }]} />
                  </li>
                ))}
              </ul>
              <Caption>Anything you leave untouched is saved as Not sure, never as Didn&apos;t have.</Caption>
            </>
          ) : (
            <Card><p>{check.message ?? "The check couldn't tell what is in this dish."}</p><Caption className="mt-2">Your meal still saves. You can add ingredients yourself below.</Caption></Card>
          )}
          <div className="flex flex-col gap-2">
            <Label>Add an ingredient</Label>
            {added.length > 0 && <div className="flex flex-wrap gap-2">{added.map((a) => <Chip key={a} selected onClick={() => setAdded((x) => x.filter((y) => y !== a))}>{a}</Chip>)}</div>}
            <div className="flex gap-2">
              <input className={inputClass} maxLength={60} value={addText} onChange={(e) => setAddText(e.target.value)} aria-label="Ingredient not in this list" placeholder="For example: garlic" />
              <Button variant="secondary" full={false} disabled={!addText.trim()} onClick={() => { setAdded((x) => [...new Set([...x, addText.trim().toLowerCase()])]); setAddText(""); }}>Add</Button>
            </div>
          </div>
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="h-6 w-6 accent-(--brand)" checked={asDish} onChange={(e) => setAsDish(e.target.checked)} />
            <span>{question("ML-12").prompt}</span>
          </label>
          {asDish && <Field label="Place (optional)" hint="For example: Chipotle"><input className={inputClass} maxLength={80} value={place} onChange={(e) => setPlace(e.target.value)} /></Field>}
          <SaveStatus state={save.state} error={save.error} onCheck={async () => { await save.check(); onSaved(); onOpenChange(false); }} />
          <Button disabled={save.saving} onClick={() => finish({
            ...base(), mode: "marked",
            ingredients: [
              ...(check.status === "ok" ? check.items.map((i) => ({ name: i.name, answer: answers[i.name] ?? "not_sure", kind: "listed" })) : []),
              ...added.map((name) => ({ name, answer: "had", kind: "added" })),
            ],
            ...(asDish ? { save_as_dish: place.trim() ? { place: place.trim() } : {} } : {}),
          })}>{save.saving ? "Saving…" : "Save"}</Button>
          {check.status === "ok" && (
            <div className="grid grid-cols-1 gap-2">
              <Button variant="secondary" disabled={save.saving} onClick={() => finish({ ...base(), mode: "dont_know" })}>{question("ML-10").prompt}</Button>
              <Button variant="secondary" disabled={save.saving} onClick={() => finish({ ...base(), mode: "assume_usual" })}>{question("ML-11").prompt}</Button>
              <Caption>&quot;Assume the usual recipe&quot; is saved as a guess. It shows in your history but is left out of comparisons.</Caption>
            </div>
          )}
        </>
      )}
    </Sheet>
  );
}
