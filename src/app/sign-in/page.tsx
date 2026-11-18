import { Suspense } from "react";
import { redirect } from "next/navigation";
import { SignIn } from "./form";
import { AdultConfirm, PasswordSignIn } from "./password-form";
import { googleSignInEnabled, signInMethod } from "@/server/auth-settings";
import { cookieClient } from "@/server/supabase";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const fromHelp = (await searchParams).new === "1";
  // Already signed in: never show a second sign-in. From "Get started", confirm 18+ then go to setup.
  const { data } = await (await cookieClient()).auth.getUser();
  if (data.user) {
    if (fromHelp) return <AdultConfirm />;
    redirect("/today");
  }
  // One sign-in method at a time (BLOAT_SIGN_IN_METHOD). The email-code screens stay in the app
  // for a controlled restoration but are not shown while the password method is on.
  if (signInMethod() === "password") return <Suspense><PasswordSignIn /></Suspense>;
  const google = await googleSignInEnabled();
  return <Suspense><SignIn testLogin={process.env.BLOAT_TEST_LOGIN === "1"} google={google} /></Suspense>;
}
