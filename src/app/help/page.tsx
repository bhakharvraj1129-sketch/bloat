import { Suspense } from "react";
import { HelpContent } from "./content";

export const metadata = { title: "When to get medical help" };

export default function HelpPage() {
  return <Suspense><HelpContent /></Suspense>;
}
