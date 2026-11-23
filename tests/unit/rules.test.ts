import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import acceptance from "@data/Bloat_Acceptance_v4.3.json";
import { config, questions, checkAnswer, emergencyNumber, helpline, prices, formatMoney, thresholds, aiProtection } from "@/lib/registry";
import { BANNED_PHRASES, helpPage, HELP_PAGE_VERSION, levelSentence, INTENDED_USE, COMPARISON_LINE, TRIGGERS_FOOTER, NHS_SOURCE_LABEL } from "@/lib/wording";
import { analysisDate, formatDate, formatRange, offsetMinutes, splitByDate, zonedToUtc, localDate } from "@/lib/time";
import { effectivePlan } from "@/lib/domain/plan";
import { buildDoctorLine } from "@/lib/domain/doctorline";
import { EXPERIMENTS, isNeverOffered, fxResult } from "@/lib/domain/experiments";
import { configCheck, aiOutput, APPROVED_MODELS, MAX_OUTPUT_TOKENS } from "@/server/ai/types";
import { MockProvider } from "@/server/ai/mock";
import { deriveGroup, groupsFor } from "@/lib/food-keywords";
import { offerFor } from "@/server/billing";
import { preparePhoto } from "@/server/photo";
import sharp from "sharp";

const ROOT = path.resolve(__dirname, "../..");
function files(dir: string, out: string[] = []): string[] {
  for (const f of readdirSync(dir)) {
    const p = path.join(dir, f);
    if (statSync(p).isDirectory()) files(p, out);
    else if (/\.(tsx?|css|json)$/.test(f)) out.push(p);
  }
  return out;
}
const SOURCE = [...files(path.join(ROOT, "src")), ...files(path.join(ROOT, "content"))];
const read = (p: string) => readFileSync(p, "utf8");
/** Text a person can see: string literals and JSX text in UI and content files. */
const uiFiles = SOURCE.filter((p) => /src\/(app|components)\/|content\//.test(p) && !p.includes("/v1/"));

describe("Data files from the plan PDF", () => {
  it("has 200 acceptance tests, 91 questions and the configuration", () => {
    expect(acceptance).toHaveLength(200);
    expect(questions).toHaveLength(91);
    expect(new Set(questions.map((q) => q.id)).size).toBe(91);
    expect(new Set(acceptance.map((a) => a.id)).size).toBe(200);
    expect(config.countries.map((c) => c.code)).toEqual(["US", "CA", "IN"]);
  });

  it("Q154 registry consistency: tests, questions and settings do not contradict each other", () => {
    expect(thresholds.cards_per_day).toBe(1);
    expect(thresholds.swap_max_weeks).toBe(2);
    expect(thresholds.swap_add_back_weeks).toBe(1);
    expect(thresholds.swap_max_per_180_days).toBe(2);
    expect(thresholds.comparison_min_each_group).toBe(config.metrics.comparison_group_display_minimum);
    expect(thresholds.seven_day_average_min).toBe(config.metrics.seven_day_average.min_usable_dates);
    expect(config.doctor_line.days_min).toBe(13);
    // experiment names in XP-01 match the experiments the app offers, one for one
    const xp = questions.find((q) => q.id === "XP-01")!.input.options!.map((o) => o.value).sort();
    expect(EXPERIMENTS.map((e) => e.key).sort()).toEqual(xp);
    // swap groups in the configuration match the swap experiments
    expect(EXPERIMENTS.filter((e) => e.type === "swap").map((e) => e.food_group).sort()).toEqual(config.swap_experiments.map((s) => s.group).sort());
    // every question's plan agrees with the feature list
    expect(config.plans.habit_taps_pro_only).toEqual(["ACT-11", "ACT-12", "ACT-14", "ACT-15", "ACT-18", "ACT-20", "ACT-21"]);
    expect(config.activities).toHaveLength(24);
    expect(config.food_tags).toHaveLength(12);
    // old rules must not come back: no test still says two cards a day
    expect(JSON.stringify(acceptance)).not.toMatch(/two cards a day/i);
  });

  it("Q186 every feature carries a release label: launch, later or future", () => {
    for (const [k, f] of Object.entries(config.features)) expect(["launch", "later", "future"], k).toContain(f.release);
    expect(Object.values(config.features).every((f) => f.production_enabled === false)).toBe(true); // all production flags false
  });

  it("Q85 exclusive options and Q86 number ranges are enforced from the registry", () => {
    expect(checkAnswer("ON-11", ["none", "gas"]).ok).toBe(false);
    expect(checkAnswer("ON-11", ["gas", "burping"]).ok).toBe(true);
    expect(checkAnswer("ON-16", ["which_foods_affect_me", "getting_ready_for_a_doctor_visit", "how_my_bloating_changes_over_time"]).ok).toBe(false);
    for (const v of [0, 11, 3.5]) expect(checkAnswer("EP-01", v).ok).toBe(false);
    expect(checkAnswer("DY-01", 0).ok).toBe(true);
    expect(checkAnswer("DY-01", 11).ok).toBe(false);
    expect(checkAnswer("DY-01", "i_cannot_remember").ok).toBe(true);
  });
});

describe("Wording and safety (plan A17)", () => {
  it("Q148 the help page matches the stored copy adapted from the NHS, and says it is adapted (never \"word for word\")", () => {
    const p = helpPage("US");
    expect(p.version).toBe(HELP_PAGE_VERSION);
    expect(p.title).toBe("When to get medical help");
    expect(p.intro).toBe("Bloat is a tracker. It can't tell you what is causing your symptoms or whether they are serious.");
    expect(p.sections[0]).toEqual({
      level: "emergency", heading: "Call 911 now if you have bloating with a swollen stomach and:",
      items: ["stomach pain that is severe and came on very suddenly", "you are vomiting blood, or your vomit looks like coffee grounds", "severe difficulty breathing – you're gasping, choking or unable to get words out"],
    });
    expect(p.sections[1]!.heading).toBe("Contact a doctor today or go to urgent care if you have bloating and:");
    expect(p.sections[1]!.items).toEqual(["vomiting, diarrhoea or constipation", "stomach pain", "a high temperature, or you feel hot, cold or shivery", "a swelling or lump in your tummy", "you can't pee, poo or pass gas", "a burning feeling in your chest from stomach acid (acid reflux)"]);
    expect(p.sections[2]!.heading).toBe("Book a regular appointment with a doctor if:");
    expect(p.sections[2]!.items).toEqual(["you feel bloated regularly", "you've tried changing what you eat and still keep feeling bloated", "you have bloating and are losing weight without trying", "you have bloating and blood in your poo"]);
    expect(config.doctor_line.sentence).toBe("The NHS suggests seeing a doctor if you feel bloated regularly or keep feeling bloated after changing your diet.");
    expect(p.source).toBe("Adapted from NHS, Bloating. Contact routes and the emergency number are changed for your country. This page is general information, not medical advice.");
    expect(p.sourceUrl).toBe("https://www.nhs.uk/symptoms/bloating/");
    expect(NHS_SOURCE_LABEL).toBe("Adapted from NHS, Bloating");
    // No user-facing text or label may claim the adapted text is quoted word for word.
    for (const f of SOURCE.filter((x) => /\.(tsx?|json)$/.test(x))) expect(read(f), f).not.toMatch(/quoted word for word|Source: NHS, Bloating/);
  });

  it("Q38, Q130, Q161: emergency numbers and helplines match the country; unknown countries get generic wording", () => {
    expect([emergencyNumber("US"), emergencyNumber("CA"), emergencyNumber("IN")]).toEqual(["911", "911", "112"]);
    expect(emergencyNumber("GB")).toBeNull();
    expect(levelSentence("emergency", "GB")).toBe("Call your local emergency number now.");
    expect(levelSentence("emergency", null)).toBe("Call your local emergency number now.");
    expect(helpline("US")).toContain("1-866-662-1235");
    expect(helpline("CA")).toContain("1-866-633-4220");
    expect(helpline("IN")).toContain("14416");
    expect(helpline("FR")).toBeNull();
  });

  it("Q93, Q120: no screen text uses a banned phrase (the fixed plan sentences are the only exceptions)", () => {
    const allowed = [INTENDED_USE, TRIGGERS_FOOTER, "proof that the change caused it", "proof that the food caused it", "proof the medicine caused it", "doesn't diagnose", "does not diagnose", "not a diagnosis", "never a diagnosis", "It does not diagnose", "can cause gas in some people", "what is causing your symptoms"];
    const hits: string[] = [];
    for (const f of [...uiFiles, path.join(ROOT, "src/lib/domain/focus.ts"), path.join(ROOT, "src/lib/domain/experiments.ts"), path.join(ROOT, "src/lib/domain/cards.ts"), path.join(ROOT, "src/server/reports.ts")]) {
      let text = read(f);
      for (const a of allowed) text = text.split(a).join("");
      // look only at text a person can see: quoted strings and JSX text, not code identifiers
      const visible = (text.match(/"[^"\n]*"|`[^`]*`|>[^<>{}\n]+</g) ?? []).join("\n").toLowerCase();
      for (const phrase of [...BANNED_PHRASES, "no warning signs", "nothing to worry about", "trigger found", "your trigger is", "clinically", "validated"]) {
        const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`);
        if (re.test(visible)) hits.push(`${path.relative(ROOT, f)}: "${phrase}"`);
      }
    }
    expect(hits).toEqual([]);
    expect(COMPARISON_LINE).toBe("This is a difference in your records, not a medical measure.");
  });

  it("Q96 Bloat names no condition in its own words: condition names appear only as registry options the user picks", () => {
    const names = /\b(ibs|irritable bowel|sibo|coeliac|celiac|crohn|colitis|gastroparesis|endometriosis|lactose intoleran|gluten intoleran)\b/i;
    const hits: string[] = [];
    // Learn article outlines are copied from the plan and listed apart.
    for (const f of uiFiles.filter((p) => !p.endsWith("content/articles.ts"))) {
      const visible = (read(f).match(/"[^"\n]*"|`[^`]*`|>[^<>{}\n]+</g) ?? []).filter((s) => !/^"(coeliac_disease|crohn_s_or_ulcerative_colitis|lactose_intolerance)"$/.test(s)).join("\n");
      const m = names.exec(visible);
      // card labels quote the source's own scope ("IBS-type advice"), copied from the plan
      if (m && !/IBS-type/.test(visible.slice(Math.max(0, m.index - 40), m.index + 40))) hits.push(`${path.relative(ROOT, f)}: ${m[0]}`);
    }
    expect(hits).toEqual([]);
  });

  it("Q104 no calorie or nutrient number anywhere in the app, and the AI output schema has no field for one", () => {
    for (const f of uiFiles) expect(read(f).toLowerCase(), f).not.toMatch(/\bkcal\b|\bcalories?\b(?! anywhere)|\bmacros\b/);
    expect(aiOutput.safeParse({ dishes: [], items: [], abstain: true, calories: 200 }).success).toBe(false);
    expect(config.ai.no_calories).toBe(true);
  });

  it("Q129 no advertising, social or analytics tracker is referenced anywhere in the source", () => {
    const trackers = /google-analytics|googletagmanager|gtag\(|facebook\.net|fbq\(|connect\.facebook|hotjar|fullstory|segment\.com|mixpanel|amplitude|clarity\.ms|doubleclick|posthog|sentry-replay|tiktok/i;
    for (const f of SOURCE) expect(read(f), f).not.toMatch(trackers);
    const pkg = JSON.parse(read(path.join(ROOT, "package.json")));
    for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.devDependencies })) expect(dep).not.toMatch(/analytics|gtag|pixel|hotjar|fullstory|mixpanel|amplitude|posthog|segment/);
  });

  it("Q201 no secret name or key reaches the browser bundle: only NEXT_PUBLIC values are read in client files", () => {
    for (const f of SOURCE.filter((p) => /\.tsx?$/.test(p))) {
      const text = read(f);
      if (!text.startsWith('"use client"')) continue;
      expect(text, f).not.toMatch(/process\.env\.(?!NEXT_PUBLIC_|NODE_ENV)/);
      expect(text, f).not.toMatch(/@\/server\//);
    }
    for (const f of SOURCE) expect(read(f), f).not.toMatch(/sk-ant-[A-Za-z0-9]|sb_secret_|service_role"\s*:/);
    expect(read(path.join(ROOT, ".gitignore"))).toContain(".env.local");
  });

  it("Q39 the service worker caches the public shell only and never a private screen or /v1 answer", () => {
    const sw = read(path.join(ROOT, "public/sw.js"));
    expect(sw).toContain('const PUBLIC = ["/", "/help", "/offline", "/manifest.webmanifest", "/icons/icon-192.png"]');
    expect(sw).toContain('url.pathname.startsWith("/v1/")');
    expect(sw).not.toMatch(/cache\.put|today|history/);
    expect(read(path.join(ROOT, "src/app/(app)/me/me.tsx"))).toContain("caches.delete");
  });
});

describe("Time rules (plan A03)", () => {
  const NY = [{ effective_from: "1970-01-01", zone: "America/New_York" }];
  it("Q04 an episode from 23:00 to 02:00 is split 1 h and 2 h across the two dates", () => {
    const s = Date.parse("2026-07-01T23:00:00-04:00"), e = Date.parse("2026-07-02T02:00:00-04:00");
    expect(splitByDate(s, e, NY)).toEqual({ "2026-07-01": 3600_000, "2026-07-02": 7200_000 });
  });
  it("Q05, Q66: DST. An ambiguous time has two instants, a skipped time has none, and elapsed time is real", () => {
    expect(zonedToUtc("2026-11-01T01:30", "America/New_York")).toHaveLength(2);
    expect(zonedToUtc("2026-03-08T02:30", "America/New_York")).toHaveLength(0);
    expect(zonedToUtc("2026-07-01T12:00", "America/New_York")).toEqual([Date.parse("2026-07-01T16:00:00Z")]);
    const day = splitByDate(Date.parse("2026-11-01T00:00:00-04:00"), Date.parse("2026-11-02T00:00:00-05:00"), NY);
    expect(day["2026-11-01"]).toBe(25 * 3600_000); // the day the clocks go back has 25 hours
    expect(offsetMinutes(Date.parse("2026-07-01T00:00:00Z"), "Asia/Kolkata")).toBe(330);
    expect(offsetMinutes(Date.parse("2026-07-01T00:00:00Z"), "Asia/Kathmandu")).toBe(345);
    expect(localDate(Date.parse("2026-07-01T19:00:00Z"), "Asia/Kolkata")).toBe("2026-07-02");
  });
  it("Q06 a zone change starts on its stated date and never moves earlier days", () => {
    const periods = [...NY, { effective_from: "2026-07-10", zone: "Asia/Kolkata" }];
    const before = Date.parse("2026-07-05T23:30:00-04:00");
    expect(analysisDate(before, periods)).toBe("2026-07-05"); // would be the 6th in India
    expect(analysisDate(Date.parse("2026-07-12T20:00:00Z"), periods)).toBe("2026-07-13");
  });
  it("Q65 dates are shown with the month as a word, so MM/DD and DD/MM can never be confused", () => {
    expect(formatDate("2026-04-03", "MM/DD")).toBe("Fri Apr 3");
    expect(formatDate("2026-04-03", "DD/MM")).toBe("Fri 3 Apr");
  });
  it("a date range is never shown backwards: no finished day yet gives no range (external report B3)", () => {
    expect(formatRange("2026-11-01", "2026-11-22", "MM/DD")).toBe("Nov 1 to Nov 22");
    expect(formatRange("2026-11-01", "2026-11-22", "DD/MM")).toBe("1 Nov to 22 Nov");
    expect(formatRange("2026-11-22", "2026-11-22", "DD/MM")).toBe("22 Nov to 22 Nov");
    expect(formatRange("2026-11-23", "2026-11-22", "DD/MM")).toBeNull();
  });
});

describe("Plans, prices and the doctor line", () => {
  it("Q213 the same price everywhere: US, Canada and India", () => {
    const show = (c: "US" | "CA" | "IN") => { const p = prices(c); return [p.monthly_minor, p.three_month_minor, p.annual_minor].map((m) => formatMoney(m, p.currency)); };
    expect(show("US")).toEqual(["US$5.99", "US$14.99", "US$39.99"]);
    expect(show("CA")).toEqual(["CA$7.99", "CA$19.99", "CA$54.99"]);
    expect(show("IN")).toEqual(["₹199", "₹549", "₹1,999"]);
    expect(config.pricing_hypotheses.same_price_on_web_and_app_stores).toBe(true);
    expect(config.pricing_hypotheses.trial).toBeNull(); // Q210: no trial
    expect(config.pricing_hypotheses.checkout_enabled).toBe(false);
  });
  it("Q71, Q72, Q212: the offer record keeps country, currency, exact amount and interval, by the payment method's country", () => {
    expect(offerFor("US", "three_month")).toMatchObject({ country: "US", currency: "USD", amount_minor: 1499, interval: "three_month", trial: null });
    expect(offerFor("IN", "annual")).toMatchObject({ currency: "INR", amount_minor: 199900, tax: "includes 18% GST" });
  });
  it("entitlement fails closed: anything uncertain is Free", () => {
    const base = { user_id: "u", billing_interval: null, started_at: null, pause_until: null, billing_country: null, provider: null, pro_since: null, recalled_check_offered_at: null, offer: null };
    const now = Date.parse("2026-07-01T00:00:00Z");
    expect(effectivePlan(null, now)).toBe("free");
    expect(effectivePlan({ ...base, plan: "pro", status: "active", ends_at: "2026-08-01T00:00:00Z" }, now)).toBe("pro");
    expect(effectivePlan({ ...base, plan: "pro", status: "active", ends_at: "2026-06-01T00:00:00Z" }, now)).toBe("free");
    for (const status of ["paused", "pending", "failed", "refunded", "chargeback", "none", "something_new"]) expect(effectivePlan({ ...base, plan: "pro", status, ends_at: "2026-08-01T00:00:00Z" }, now), status).toBe("free");
  });
  it("Q155, Q157, Q158: the doctor line rule", () => {
    expect(buildDoctorLine(12, null, null, null, "2026-07-01").show).toBe(false);
    expect(buildDoctorLine(13, null, null, null, "2026-07-01").show).toBe(true);
    expect(buildDoctorLine(13, "60", "yes", null, "2026-07-01").ovarianSentence).toBe(config.doctor_line.ovarian_sentence);
    for (const [age, ov] of [["40_49", "yes"], ["50_59", "no"], ["50_59", "prefer_not_to_say"], [undefined, "yes"], ["prefer_not_to_say", "yes"]]) expect(buildDoctorLine(13, age, ov, null, "2026-07-01").ovarianSentence).toBeNull();
    expect(buildDoctorLine(13, "60", "yes", "2026-08-01", "2026-07-01")).toMatchObject({ shortened: true, ovarianSentence: null });
  });
  it("swap safety check: 'prefer not to say' and 'not sure' are never treated as No", () => {
    for (const v of ["yes", "not_sure", "prefer_not_to_say"]) expect(fxResult({ fx01: v, fx02: "no", fx03: "no", fx04: "no" }, "US").passed).toBe(false);
    expect(fxResult({ fx01: "no", fx02: "no", fx03: "no", fx04: "no" }, "US").passed).toBe(true);
    expect(JSON.stringify(fxResult({ fx01: "no", fx02: "yes", fx03: "no", fx04: "no" }, "IN").notes)).toContain("Tele-MANAS 14416");
    expect(isNeverOffered("swap_wheat")).toBe(true);
    expect(isNeverOffered("swap_lactose_free_dairy", ["TAG-01"])).toBe(false);
  });
});

describe("AI layer (plan A11, 0.4)", () => {
  it("Q199 a model that is not on the approved list is refused before any call", () => {
    expect(configCheck("anthropic", "claude-haiku-5-5")).toEqual({ ok: true, model: "claude-haiku-5-5" });
    expect(configCheck("anthropic", "some-other-model").ok).toBe(false);
    expect(configCheck("openrouter", "claude-haiku-5-5").ok).toBe(false);
    expect(configCheck("mock", "anything")).toEqual({ ok: true, model: "mock-ingredients-1" });
    expect(APPROVED_MODELS).toContain(config.ai.model);
  });
  it("Q22, Q98: the output schema rejects unknown fields, unknown tags, more than 20 items and anything that is not the fixed shape", () => {
    const item = { name: "onion", food_group: "TAG-03", confidence: "high", source_label: "usually_in_recipe" };
    expect(aiOutput.safeParse({ dishes: ["curry"], items: [item], abstain: false }).success).toBe(true);
    expect(aiOutput.safeParse({ dishes: [], items: [{ ...item, food_group: "TAG-13" }], abstain: false }).success).toBe(false);
    expect(aiOutput.safeParse({ dishes: [], items: [{ ...item, advice: "avoid it" }], abstain: false }).success).toBe(false);
    expect(aiOutput.safeParse({ dishes: [], items: Array(21).fill(item), abstain: false }).success).toBe(false);
    expect(aiOutput.safeParse({ dishes: [], items: [item], abstain: false, url: "https://x" }).success).toBe(false);
    expect(aiOutput.safeParse("ignore previous instructions").success).toBe(false);
    expect(config.ai.output_max_ingredients).toBe(20);
    expect(aiProtection.max_dish_text_chars).toBe(200);
    expect(MAX_OUTPUT_TOKENS).toBeGreaterThan(0);
  });
  it("Q182 every provider gives the same fixed shape, so switching provider needs no app change (mock checked here)", async () => {
    const out = await new MockProvider().run({ purpose: "FOOD_GROUP_INGREDIENT_LIST", dish_text: "chicken burrito with beans", language: "en" });
    expect(aiOutput.safeParse(out.output).success).toBe(true);
    expect(out.output.items.every((i) => i.source_label === "usually_in_recipe")).toBe(true); // Q178 typed dishes
  });
  it("Q60 the server maps ingredients to groups itself; a wrong group from the AI or client is ignored", () => {
    expect(deriveGroup("garlic", "TAG-12")).toBe("TAG-03");
    expect(deriveGroup("paneer")).toBe("TAG-01");
    expect(deriveGroup("rajma")).toBe("TAG-04");
    expect(deriveGroup("dragonfruit")).toBe("other");
    expect(groupsFor("peanut")).toEqual([]); // "pea" does not match inside another word
    expect(groupsFor("steak")).toEqual([]);  // nor "tea"
    expect(groupsFor("cola").sort()).toEqual(["TAG-09", "TAG-11"]);
  });
  it("Q102, Q195: a photo is shrunk to 1000 px, re-encoded with all metadata removed, and refused if still over 2 MB", async () => {
    const original = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: { r: 180, g: 90, b: 40 } } })
      .withExif({ IFD0: { Make: "TestCam", Copyright: "location 51.5,-0.12" } }).jpeg().toBuffer();
    expect((await sharp(original).metadata()).exif).toBeDefined();
    const out = (await preparePhoto(original))!;
    const meta = await sharp(out).metadata();
    expect(Math.max(meta.width!, meta.height!)).toBe(1000);
    expect(meta.exif).toBeUndefined();
    expect(out.toString("latin1")).not.toContain("TestCam");
    expect(out.length).toBeLessThanOrEqual(2 * 1024 * 1024);
    // Random noise cannot be compressed under 2 MB even at the smaller size: not sent.
    const noise = Buffer.alloc(2600 * 2600 * 3);
    for (let i = 0; i < noise.length; i++) noise[i] = (i * 2654435761 + (i >>> 3) * 40503) % 251;
    const big = await sharp(noise, { raw: { width: 2600, height: 2600, channels: 3 } }).jpeg({ quality: 100 }).toBuffer();
    const result = await preparePhoto(big);
    if (result) expect(result.length).toBeLessThanOrEqual(2 * 1024 * 1024); // either refused or within the limit
    expect(aiProtection.photo_max_mb).toBe(2);
  });
});

describe("Kiwifruit experiment pause", () => {
  it("only the kiwifruit experiment is paused; its safety rules still hold underneath the pause", async () => {
    const { EXPERIMENTS: list, PAUSED_FOR_REVIEW } = await import("@/lib/domain/experiments");
    const { offerFor } = await import("@/server/experiments");
    expect(list.filter((e) => e.paused).map((e) => e.key)).toEqual(["kiwifruit_for_regularity"]);
    const kiwi = list.find((e) => e.key === "kiwifruit_for_regularity")!;
    const ok = { blockedByCondition: false, checkedRecently: true, fxPassed: true, fx03No: true, constipationLogged: true, swapsIn180: 0, active: null, priorConfirmed: 7 };
    expect(offerFor(kiwi, ok as never)).toMatchObject({ offered: false, reason: PAUSED_FOR_REVIEW });
    const unpaused = { ...kiwi, paused: undefined };
    expect(offerFor(unpaused, ok as never).offered).toBe(true);
    expect(offerFor(unpaused, { ...ok, fx03No: false } as never).reason).toBe("Answer the safety question about allergies first.");
    expect(offerFor(unpaused, { ...ok, blockedByCondition: true } as never).offered).toBe(false);
  });
});
