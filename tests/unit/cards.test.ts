import { describe, expect, it } from "vitest";
import { CARDS, cardSchema, publishedCards, CARD_FOOTER } from "@content/cards";
import { ARTICLES, articleSchema } from "@content/articles";
import { allowedCards, chooseCard, whatHelps, type CardContext } from "@/lib/domain/cards";
import { addDays } from "@/lib/time";
import { thresholds } from "@/lib/registry";

const T = "2026-07-01";
const base = (o: Partial<CardContext> = {}): CardContext => ({ today: T, counts: {}, hidden: [], history: [], previousTummySurgery: false, fx: null, ...o });

describe("Daily cards (plan A16)", () => {
  it("Q113 a card without a source link cannot be published; it stays a draft", () => {
    for (const c of CARDS) expect(cardSchema.safeParse(c).success, c.id).toBe(true);
    const bad = { ...CARDS[0]!, sources: [] };
    expect(cardSchema.safeParse(bad).success).toBe(false);
    expect(cardSchema.safeParse({ ...bad, status: "draft" }).success).toBe(true);
    expect(CARDS.filter((c) => c.status === "draft").every((c) => c.sources.length === 0)).toBe(true);
  });

  it("Q148 every published card links its source sentence and carries a label and version", () => {
    for (const c of publishedCards()) {
      expect(c.sources.length, c.id).toBeGreaterThan(0);
      for (const s of c.sources) expect(s.url).toMatch(/^https:\/\//);
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.version).toBeTruthy();
    }
    expect(CARD_FOOTER).toBe("General wellness information, not medical advice. If you have a diagnosed condition, follow your doctor's advice first.");
  });

  it("Q126 one card a day, alternating tip and mind–body, stable all day", () => {
    expect(thresholds.cards_per_day).toBe(1);
    const history: CardContext["history"] = [];
    const kinds: string[] = [];
    for (let i = 0; i < 6; i++) {
      const today = addDays(T, i);
      const first = chooseCard(base({ today, history }))!;
      history.push({ card_id: first.card.id, date: today });
      const again = chooseCard(base({ today, history }))!;
      expect(again.card.id).toBe(first.card.id); // stable all day
      kinds.push(first.card.kind);
    }
    expect(kinds).toEqual(["tip", "mind_body", "tip", "mind_body", "tip", "mind_body"]);
  });

  it("Q111 a card shown on day 1 is not shown again until day 15", () => {
    const history: CardContext["history"] = [];
    const seen: string[] = [];
    for (let i = 0; i < 16; i++) {
      const today = addDays(T, i);
      const c = chooseCard(base({ today, history }))!;
      history.push({ card_id: c.card.id, date: today });
      seen.push(c.card.id);
    }
    const first = seen[0]!;
    expect(seen.slice(1, 14)).not.toContain(first);
  });

  it("Q142 when every allowed card was shown within 14 days, the one shown longest ago is used; never a filler card", () => {
    const mind = publishedCards().filter((c) => c.kind === "mind_body");
    // Every mind-body card was shown in the last 14 days; a tip was shown yesterday.
    const history = [
      { card_id: "eat-slowly", date: addDays(T, -1) },
      ...mind.map((c, i) => ({ card_id: c.id, date: addDays(T, -(2 + i)) })),
    ];
    const c = chooseCard(base({ history }))!;
    expect(c.card.kind).toBe("mind_body");
    expect(c.card.id).toBe(mind[mind.length - 1]!.id); // the one shown longest ago
    expect(publishedCards().map((x) => x.id)).toContain(c.card.id);
  });

  it("triggers come before rotation and 'Why you're seeing this' gives the real reason", () => {
    const c = chooseCard(base({ counts: { fizzy: 4 } }))!;
    expect(c.card.id).toBe("fizzy");
    expect(c.why).toBe("You logged fizzy drinks on 4 of the last 7 days.");
    const none = chooseCard(base())!;
    expect(none.why).toBe("This is the next card in the regular rotation.");
  });

  it("Q126 exclusions: massage hidden after tummy surgery; kiwifruit hidden unless FX-03 is No", () => {
    expect(allowedCards(base({ previousTummySurgery: true })).map((c) => c.id)).not.toContain("massage");
    expect(allowedCards(base()).map((c) => c.id)).toContain("massage");
    expect(allowedCards(base()).map((c) => c.id)).not.toContain("kiwi"); // FX-03 not answered
    expect(allowedCards(base({ fx: { fx01: "no", fx02: "no", fx03: "yes" } })).map((c) => c.id)).not.toContain("kiwi");
    expect(allowedCards(base({ fx: { fx01: "no", fx02: "no", fx03: "no" } })).map((c) => c.id)).toContain("kiwi");
  });

  it("FX-02 other than No: no food-restriction tips are pushed", () => {
    const ids = allowedCards(base({ fx: { fx01: "no", fx02: "yes", fx03: "no" } })).map((c) => c.id);
    for (const id of ["gum-break", "fizzy", "sugar-free", "smaller-meals", "caffeine-alcohol"]) expect(ids).not.toContain(id);
    expect(ids).toContain("walk");
  });

  it("Q112 a hidden card is never chosen", () => {
    const c = chooseCard(base({ counts: { fizzy: 5 }, hidden: ["fizzy"] }))!;
    expect(c.card.id).not.toBe("fizzy");
  });

  it("Q159 card choice takes no age, ovaries, cycle, menopause or family-history input", () => {
    const keys = Object.keys(base());
    expect(keys.sort()).toEqual(["counts", "fx", "hidden", "history", "previousTummySurgery", "today"]);
  });

  it("Q127 'What helps you' appears only after 3 or more tries of the same activity", () => {
    const row = (b: number, a: number) => ({ ref_kind: "card", ref_id: "walk", before_score: b, after_score: a });
    const name = () => "Walk after meals";
    expect(whatHelps([row(5, 4), row(6, 4)], name)).toEqual([]);
    const out = whatHelps([row(5, 4), row(6, 4), row(5, 3), row(4.8, 4.2)], name);
    expect(out[0]!.text).toBe("Walk after meals: bloating went from 5.2 to 3.8 on average across 4 tries.");
    expect(whatHelps([row(5, 4), row(6, 4), { ref_kind: "card", ref_id: "walk", before_score: 5, after_score: null }], name)).toEqual([]);
  });
});

describe("Learn library (plan A16)", () => {
  it("Q189 contains the four v4.4 articles and the warning-signs article, each with sources", () => {
    for (const a of ARTICLES) expect(articleSchema.safeParse(a).success, a.id).toBe(true);
    const titles = ARTICLES.map((a) => a.title);
    for (const t of ["Medicines and bloating", "Bloating, periods and menopause", "When normal gas feels like too much", "Bloating during eating-disorder recovery", "Warning signs explained"]) expect(titles).toContain(t);
    expect(ARTICLES.every((a) => a.sources.length > 0)).toBe(true);
    expect(ARTICLES.find((a) => a.id === "ed-recovery")!.never_pushed_by_cards).toBe(true);
    expect(ARTICLES).toHaveLength(15);
  });
});
