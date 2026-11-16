import { Suspense } from "react";
import { Doctor } from "./doctor";
export const metadata = { title: "Doctor report" };
export default function Page() { return <Suspense><Doctor /></Suspense>; }
