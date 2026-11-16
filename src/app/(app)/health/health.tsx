"use client";
import { useState } from "react";
import { Button, Caption, Card, Chip, Field, Label, SaveStatus, Segmented, inputClass } from "@/components/ui";
import { QuestionField } from "@/components/question";
import { ProScreen } from "@/components/pro";
import { useLoad, useSave } from "@/lib/client/hooks";
import { api } from "@/lib/client/api";
import { options, question } from "@/lib/registry";

type Cond = { condition: string; status?: string | null; year?: number | null };
type Test = { id: string; test: string; date: string | null; result_text: string | null };
type Data = { conditions: Cond[]; lactose: { breath_test: string | null; after_dairy: string[] } | null; tests: Test[]; family_history: string[] | null };
const hc04 = question("HC-04").input.fields as { test: Array<{ value: string; label: string }> };
const hc03 = question("HC-03").input.fields as { breath_test: Array<{ value: string; label: string }>; after_dairy: Array<{ value: string; label: string }> };

// Screen 36: conditions and tests for the record. A record only: never used to suggest a condition.
export function Health() {
  const load = useLoad<Data>("/v1/health/conditions");
  const [conds, setConds] = useState<Cond[] | null>(null);
  const [breathEdit, setBreath] = useState<string | null | undefined>(undefined);
  const [afterEdit, setAfter] = useState<string[] | undefined>(undefined);
  const [familyEdit, setFamily] = useState<string[] | null | undefined>(undefined);
  const [test, setTest] = useState<string | null>(null);
  const [testDate, setTestDate] = useState("");
  const [testResult, setTestResult] = useState("");
  const save = useSave();
  const today = new Date().toISOString().slice(0, 10);

  return (
    <ProScreen title="Health background" back="/me" load={load}>
      {(d) => {
        const list = conds ?? d.conditions;
        const breath = breathEdit === undefined ? d.lactose?.breath_test ?? null : breathEdit;
        const after = afterEdit ?? d.lactose?.after_dairy ?? [];
        const family = familyEdit === undefined ? d.family_history : familyEdit;
        const has = (c: string) => list.some((x) => x.condition === c);
        const toggle = (c: string) => setConds(has(c) ? list.filter((x) => x.condition !== c) : [...list, { condition: c }]);
        const patch = (c: string, p: Partial<Cond>) => setConds(list.map((x) => (x.condition === c ? { ...x, ...p } : x)));
        return (
          <>
            <Caption>Optional. This is a record for you and for your doctor report. Bloat uses it only to decide whether food swap experiments are offered and to hide cards that don&apos;t fit. It is never used to suggest a condition.</Caption>
            <section className="flex flex-col gap-3" aria-labelledby="hc01">
              <p id="hc01" className="t-body-strong">{question("HC-01").prompt}</p>
              <div className="flex flex-wrap gap-2">{options("HC-01").map((o) => <Chip key={o.value} selected={has(o.value)} onClick={() => toggle(o.value)}>{o.label}</Chip>)}</div>
            </section>
            {list.map((c) => (
              <Card key={c.condition} className="flex flex-col gap-3">
                <p className="t-body-strong">{options("HC-01").find((o) => o.value === c.condition)?.label}</p>
                <QuestionField id="HC-02" value={c.status ?? null} onChange={(v) => patch(c.condition, { status: v as string | null })} />
                <Field label="Year (optional)"><input className={inputClass} inputMode="numeric" maxLength={4} value={c.year ?? ""} onChange={(e) => patch(c.condition, { year: e.target.value ? Number(e.target.value.replace(/\D/g, "")) : null })} /></Field>
              </Card>
            ))}
            {has("lactose_intolerance") && (
              <Card className="flex flex-col gap-3">
                <p className="t-body-strong">{question("HC-03").prompt}</p>
                <p>Breath test</p>
                <Segmented label="Breath test" value={breath} onChange={setBreath} options={hc03.breath_test} />
                <p>After dairy you get</p>
                <div className="flex flex-wrap gap-2">{hc03.after_dairy.map((o) => <Chip key={o.value} selected={after.includes(o.value)} onClick={() => setAfter(after.includes(o.value) ? after.filter((x) => x !== o.value) : o.value === "nothing" ? ["nothing"] : [...after.filter((x) => x !== "nothing"), o.value])}>{o.label}</Chip>)}</div>
              </Card>
            )}
            <Card><QuestionField id="FH-01" value={family} onChange={(v) => setFamily(v as string[] | null)} /><Caption className="mt-3">Shown only in your doctor report.</Caption></Card>
            <SaveStatus state={save.state} error={save.error} />
            <Button disabled={save.saving} onClick={async () => {
              const ok = await save.run("PUT", "/v1/health/conditions", { conditions: list.map((c) => ({ condition: c.condition, ...(c.status ? { status: c.status } : {}), ...(c.year && c.year >= 1900 ? { year: c.year } : {}) })) });
              if (!ok) return;
              if (has("lactose_intolerance")) await api("PUT", "/v1/health/lactose", { breath_test: breath, after_dairy: after }).catch(() => {});
              await api("PUT", "/v1/health/family", { value: family }).catch(() => {});
              load.reload();
            }}>{save.saving ? "Saving…" : "Save"}</Button>

            <section className="flex flex-col gap-3" aria-labelledby="tests">
              <Label id="tests">{question("HC-04").prompt}</Label>
              {d.tests.length > 0 && (
                <Card className="px-4 py-1"><ul>{d.tests.map((t) => (
                  <li key={t.id} className="flex items-center justify-between gap-3 border-b border-line py-2 last:border-0">
                    <span>{hc04.test.find((o) => o.value === t.test)?.label ?? t.test}{t.date ? ` · ${t.date}` : ""}{t.result_text ? <span className="t-caption"> · {t.result_text}</span> : null}</span>
                    <button type="button" className="min-h-11 px-2 font-semibold text-alert" onClick={async () => { await api("DELETE", `/v1/health/tests?id=${t.id}`); load.reload(); }}>Remove</button>
                  </li>
                ))}</ul></Card>
              )}
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Test">{hc04.test.map((o) => <Chip key={o.value} role="radio" selected={test === o.value} onClick={() => setTest(o.value)}>{o.label}</Chip>)}</div>
              {test && (
                <>
                  <Field label="Date (optional)"><input type="date" className={inputClass} max={today} value={testDate} onChange={(e) => setTestDate(e.target.value)} /></Field>
                  <Field label="Result, as your doctor wrote it (optional)" hint={`${testResult.length}/200`}><input className={inputClass} maxLength={200} value={testResult} onChange={(e) => setTestResult(e.target.value)} /></Field>
                  <Button variant="secondary" onClick={async () => { await api("POST", "/v1/health/tests", { test, ...(testDate ? { date: testDate } : {}), ...(testResult.trim() ? { result_text: testResult.trim() } : {}) }); setTest(null); setTestDate(""); setTestResult(""); load.reload(); }}>Add test</Button>
                </>
              )}
            </section>
          </>
        );
      }}
    </ProScreen>
  );
}
