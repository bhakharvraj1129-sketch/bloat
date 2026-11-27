import { Suspense } from "react";
import { Loading, Screen } from "@/components/ui";
import { Today } from "./today";
export const metadata = { title: "Today" };
// Today reads ?log=1 (the log button in the tab bar), so it waits for the address on the client.
export default function Page() {
  return <Suspense fallback={<Screen title="Today" width="wide"><Loading what="Loading today" /></Screen>}><Today /></Suspense>;
}
