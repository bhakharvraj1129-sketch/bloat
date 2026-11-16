import { Suspense } from "react";
import { CodeForm } from "./form";

export const metadata = { title: "Enter your code" };
export default function Page() { return <Suspense><CodeForm /></Suspense>; }
