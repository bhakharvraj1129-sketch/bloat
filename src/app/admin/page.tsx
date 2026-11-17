import { notFound } from "next/navigation";
import { Admin } from "./admin";

export const metadata = { title: "Founder tools", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default function Page() {
  if (!process.env.BLOAT_STAFF_EMAILS) notFound();
  return <Admin />;
}
