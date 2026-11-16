import { Suspense } from "react";
import { Experiments } from "./experiments";
export const metadata = { title: "Experiments" };
export default function Page() { return <Suspense><Experiments /></Suspense>; }
