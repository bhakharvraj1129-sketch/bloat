import { Card, Caption } from "@/components/ui";
import { PublicPage } from "@/components/public";
import { COMPARISON_LINE, TRIGGERS_FOOTER } from "@/lib/wording";
import { MethodDiagram } from "@/components/method-diagram";

export const metadata = { title: "How Bloat Buddy works" };

// The methodology page: how scores and comparisons are calculated, in plain words.
export default function Method() {
  return (
    <PublicPage title="How Bloat Buddy works" eyebrow="Method">
      <p>Bloat Buddy shows what your own records say. Every number comes from a fixed rule, not from AI, and every result shows how many days it is based on.</p>
      <Card as="section">
        <h2 className="t-title">Bloat Score</h2>
        <p className="mt-2">Your Bloat Score for a day is the strongest bloating you say you felt that day, from 0 to 10. You confirm it in the next morning&apos;s review.</p>
        <ul className="mt-2 list-disc pl-5">
          <li><strong>Confirmed:</strong> you gave a number and said it covers the whole day, by the end of the next day.</li>
          <li><strong>Late:</strong> the same, entered later. Shown in History and the 7-day average; left out of comparisons.</li>
          <li><strong>Provisional:</strong> not reviewed yet, or the answer covers only part of the day.</li>
          <li><strong>Check this day:</strong> the review is lower than a strength you logged. It is left out until you correct it.</li>
          <li><strong>?:</strong> nothing logged and no review. Unknown is never treated as zero.</li>
        </ul>
        <Caption className="mt-2">Today shows &quot;Highest logged so far&quot; instead, because the day is not finished.</Caption>
      </Card>
      <Card as="section">
        <h2 className="t-title">7-day average</h2>
        <p className="mt-2">The average of confirmed and late scores in the last 7 finished days. It needs at least 4 scored days and always shows how many days it used.</p>
      </Card>
      <Card as="section">
        <h2 className="t-title">Possible triggers (Pro)</h2>
        <p className="mt-2">For each food group and each habit you follow, Bloat Buddy compares your average score on days with it and days without it.</p>
        <ul className="mt-2 list-disc pl-5">
          <li>A day counts only with a confirmed score and when Bloat Buddy knows whether the food was there. &quot;Not sure&quot; stays unknown.</li>
          <li>Food counts for a day if you had it that day or from 18:00 the evening before, and before your strongest bloating started.</li>
          <li>A comparison needs at least 7 days with and 7 days without.</li>
          <li>&quot;Worth watching&quot; means a difference of 1 point or more that points the same way in both halves of the period.</li>
          <li>Results are listed alphabetically, never by size, because differences can appear by chance.</li>
        </ul>
        <Caption className="mt-2">{COMPARISON_LINE} {TRIGGERS_FOOTER}</Caption>
      </Card>
      <MethodDiagram />
      <Card as="section">
        <h2 className="t-title">Ingredient check (Pro)</h2>
        <p className="mt-2">An AI service lists ingredients that are often linked to gas or bloating. It only ever receives the dish name or the photo. It can be wrong, so you mark every item yourself, and anything left untouched is saved as &quot;Not sure&quot;.</p>
      </Card>
      <Card as="section">
        <h2 className="t-title">What Bloat Buddy does not do</h2>
        <p className="mt-2">Bloat Buddy is a wellness tracker. It does not name conditions, rate your symptoms or give medical advice. Check with your doctor before changing your diet.</p>
      </Card>
    </PublicPage>
  );
}
