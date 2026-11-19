import Link from "next/link";
import { Card, Caption } from "@/components/ui";
import { PublicPage } from "@/components/public";

export const metadata = { title: "Contact" };

export default function Contact() {
  return (
    <PublicPage title="Contact" eyebrow="Support">
      <Card><p className="t-body-strong">Preview build</p><Caption>Bloat is not open to the public yet, so there is no support address. One will be listed here before launch.</Caption></Card>
      <p>For anything worrying about your health, see <Link href="/help">When to get medical help</Link>. Bloat is not for emergencies.</p>
    </PublicPage>
  );
}
