import { Card, Caption } from "@/components/ui";
import { PublicPage } from "@/components/public";

export const metadata = { title: "Privacy" };

export default function Privacy() {
  return (
    <PublicPage title="Privacy" eyebrow="Policies">
      <Card><p className="t-body-strong">Preview build</p><Caption>This is a test preview that uses made-up accounts only. The final Privacy Policy is prepared before Bloat Buddy opens to real users.</Caption></Card>
      <h2 className="t-title">What Bloat Buddy already does</h2>
      <ul className="list-disc pl-5">
        <li>Your records are private to your account. Each account can only ever read its own rows.</li>
        <li>No advertising, no social trackers and no session replay, anywhere.</li>
        <li>Bloat Buddy counts how features are used, without any health values, food, symptoms or free text.</li>
        <li>The AI ingredient check (Pro, with your separate consent) only receives a dish name or a meal photo. Never your symptoms, scores, health background, age, cycle or identity.</li>
        <li>A meal photo is deleted right after its check unless you turn on &quot;Keep my meal photos&quot;.</li>
        <li>Nothing is used for research or any other purpose without your separate, explicit consent.</li>
        <li>Download my data and Delete account are in You, on every plan.</li>
      </ul>
    </PublicPage>
  );
}
