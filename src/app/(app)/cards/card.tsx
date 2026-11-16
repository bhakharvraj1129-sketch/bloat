"use client";
import Link from "next/link";
import { useState } from "react";
import { Button, Caption, Card, Chip, Label, SaveStatus, StrengthScale } from "@/components/ui";
import { ProScreen } from "@/components/pro";
import { useLoad, useSave } from "@/lib/client/hooks";

type Data = {
  card: null | { id: string; kind: "tip" | "mind_body"; title: string; text: string; label: string; sources: Array<{ name: string; url: string }> };
  why: string; footer: string; feedback: null | { tried: string | null; result: string | null; other: string | null };
};

// Screen 34: one card a day. Each card restates one sentence from its source, linked underneath.
export function CardToday() {
  const load = useLoad<Data>("/v1/cards/today");
  const save = useSave<{ hidden: boolean }>();
  const [tried, setTried] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [before, setBefore] = useState<number | null>(null);
  const [after, setAfter] = useState<number | null>(null);
  const [scores, setScores] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  return (
    <ProScreen title="Today's card" back="/today" load={load}>
      {(d) => {
        if (!d.card) return <Card><p>No card today.</p><Caption>Every card is hidden for you. You can un-hide cards in the Learn library.</Caption><Link href="/learn" className="font-semibold">Open the Learn library</Link></Card>;
        const c = d.card;
        const send = async (body: Record<string, unknown>, message: string) => { const out = await save.run("POST", `/v1/cards/${c.id}/feedback`, body); if (out) setDone(out.hidden ? "This card is hidden for you. You can un-hide it in the Learn library." : message); };
        return (
          <>
            <Card className="flex flex-col gap-3">
              <Label>{c.kind === "mind_body" ? "Mind and body" : "Tip"} · {c.label}</Label>
              <h2 className="t-title">{c.title}</h2>
              <p>{c.text}</p>
              <Caption>Source: {c.sources.map((s, i) => <span key={s.url}>{i > 0 ? ", " : ""}<a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></span>)}</Caption>
              <Caption>{d.footer}</Caption>
            </Card>
            <Card><Label>Why you&apos;re seeing this</Label><p className="mt-1">{d.why}</p></Card>

            {done ? <Card><p role="status">{done}</p></Card> : (
              <section className="flex flex-col gap-3" aria-labelledby="fb">
                <Label id="fb">Your feedback</Label>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Did you try it?">
                  <Chip role="radio" selected={tried === "tried"} onClick={() => setTried("tried")}>Tried</Chip>
                  <Chip role="radio" selected={tried === "not_today"} onClick={() => setTried("not_today")}>Not today</Chip>
                </div>
                {tried === "tried" && (
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="How was it?">
                    {[["helpful", "Helpful"], ["no_difference", "No difference"], ["worse", "Worse"]].map(([v, l]) => <Chip key={v} role="radio" selected={result === v} onClick={() => setResult(v!)}>{l}</Chip>)}
                  </div>
                )}
                {tried === "tried" && c.kind === "mind_body" && (
                  scores ? (
                    <div className="flex flex-col gap-3">
                      <p className="t-body-strong">How bloated did you feel before?</p>
                      <StrengthScale name="Before, 0 to 10" min={0} value={before} onChange={setBefore} />
                      <p className="t-body-strong">And after?</p>
                      <StrengthScale name="After, 0 to 10" min={0} value={after} onChange={setAfter} />
                    </div>
                  ) : <Button variant="quiet" full={false} onClick={() => setScores(true)}>Add before and after scores (optional)</Button>
                )}
                <SaveStatus state={save.state === "saved" ? "idle" : save.state} error={save.error} />
                <Button disabled={!tried || save.saving} onClick={() => send({ tried, ...(result ? { result } : {}), ...(before !== null ? { before_score: before } : {}), ...(after !== null ? { after_score: after } : {}) }, "Thanks. Your feedback is saved.")}>Save feedback</Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="secondary" disabled={save.saving} onClick={() => send({ other: "not_relevant" }, "Thanks. Your feedback is saved.")}>Not relevant</Button>
                  <Button variant="secondary" disabled={save.saving} onClick={() => send({ other: "hide_this_card" }, "")}>Hide this card</Button>
                </div>
              </section>
            )}
            <Link href="/learn" className="font-semibold">All cards and articles</Link>
          </>
        );
      }}
    </ProScreen>
  );
}
