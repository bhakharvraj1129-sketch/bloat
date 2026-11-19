"use client";
import Link from "next/link";
import { Caption, Card, Label, SaveStatus } from "@/components/ui";
import { ProScreen } from "@/components/pro";
import { useLoad, useSave } from "@/lib/client/hooks";

type CardItem = { id: string; kind: string; title: string; text: string; label: string; sources: Array<{ name: string; url: string }>; hidden: boolean };
type Article = { id: string; title: string; covers: string; sources: string[]; category: string; links_help_page?: boolean };
type Data = { cards: CardItem[]; articles: Article[]; what_helps: Array<{ text: string }>; footer: string; articles_note: string };

// Screen 35: every card and article, each with its source. Hidden cards can be un-hidden here.
export function Learn() {
  const load = useLoad<Data>("/v1/library");
  return (
    <ProScreen title="Learn" back="/me" load={load}>
      {(d) => {
        const categories = [...new Set(d.articles.map((a) => a.category))];
        const shown = d.cards.filter((c) => !c.hidden), hidden = d.cards.filter((c) => c.hidden);
        const cardRow = (c: CardItem) => (
          <Card as="li" key={c.id} className="flex flex-col gap-2">
            <Label>{c.kind === "mind_body" ? "Mind and body" : "Tip"} · {c.label}</Label>
            <p className="t-body-strong">{c.title}</p>
            <p>{c.text}</p>
            <Caption>Source: {c.sources.map((s, i) => <span key={s.url}>{i > 0 ? ", " : ""}<a href={s.url} target="_blank" rel="noreferrer">{s.name}</a></span>)}</Caption>
            {c.hidden && <Unhide id={c.id} onDone={load.reload} />}
          </Card>
        );
        return (
          <>
            {d.what_helps.length > 0 && (
              <section className="flex flex-col gap-2" aria-labelledby="helps">
                <Label id="helps">What helps you</Label>
                {d.what_helps.map((w) => <Card key={w.text}><p>{w.text}</p><Caption>This is a pattern in your own records, not a medical measure.</Caption></Card>)}
              </section>
            )}
            {categories.map((cat) => (
              <section key={cat} className="flex flex-col gap-2" aria-label={cat}>
                <Label>{cat}</Label>
                {d.articles.filter((a) => a.category === cat).map((a) => (
                  <Card key={a.id} className="flex flex-col gap-1">
                    <p className="t-body-strong">{a.title}</p>
                    <p>{a.covers}</p>
                    <Caption>Sources: {a.sources.join(", ")}</Caption>
                    {a.links_help_page && <Link href="/help" className="font-semibold">When to get medical help</Link>}
                  </Card>
                ))}
              </section>
            ))}
            <Caption>{d.articles_note}</Caption>
            <section className="flex flex-col gap-2" aria-labelledby="cards">
              <Label id="cards">Cards</Label>
              <ul className="flex flex-col gap-3">{shown.map(cardRow)}</ul>
            </section>
            {hidden.length > 0 && (
              <section className="flex flex-col gap-2" aria-labelledby="hidden">
                <Label id="hidden">Hidden cards</Label>
                <ul className="flex flex-col gap-3">{hidden.map(cardRow)}</ul>
              </section>
            )}
            <Caption>{d.footer}</Caption>
          </>
        );
      }}
    </ProScreen>
  );
}

function Unhide({ id, onDone }: { id: string; onDone: () => void }) {
  const save = useSave();
  return (
    <>
      <button type="button" disabled={save.saving} className="min-h-11 w-fit font-semibold text-brand disabled:text-ink-muted" onClick={async () => { if ((await save.run("POST", `/v1/cards/${id}/feedback`, { unhide: true })) !== null) onDone(); }}>{save.saving ? "Un-hiding…" : "Un-hide"}</button>
      <SaveStatus state={save.state === "saved" ? "idle" : save.state} error={save.error} onCheck={async () => { if ((await save.check()).ok) onDone(); }} />
    </>
  );
}
