import { Suspense } from "react";
import { redirect } from "next/navigation";
import { CodeForm } from "./form";
import { signInMethod } from "@/server/auth-settings";

export const metadata = { title: "Enter your code" };
export const dynamic = "force-dynamic";

export default function Page() {
  // Not offered while the password method is on (see sign-in/page.tsx).
  if (signInMethod() === "password") redirect("/sign-in");
  return <Suspense><CodeForm /></Suspense>;
}
