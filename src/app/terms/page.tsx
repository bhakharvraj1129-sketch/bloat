import { Card, Caption, Screen } from "@/components/ui";
import { PublicFooter } from "@/components/public";
import { INTENDED_USE } from "@/lib/wording";

export const metadata = { title: "Terms" };

export default function Terms() {
  return (
    <Screen title="Terms" back="/">
      <Card><p className="t-body-strong">Preview build</p><Caption>This is a test preview of Bloat that uses made-up accounts only. The final Terms are prepared before Bloat opens to real users. Until then, do not enter real health information.</Caption></Card>
      <p>{INTENDED_USE}</p>
      <ul className="list-disc pl-5">
        <li>Bloat is for adults aged 18 or older.</li>
        <li>Free logging never expires. Safety information is never behind a paywall.</li>
        <li>You can download or delete your records at any time in Me.</li>
        <li>Payments are switched off in this preview. Nothing can be charged.</li>
      </ul>
      <PublicFooter />
    </Screen>
  );
}
