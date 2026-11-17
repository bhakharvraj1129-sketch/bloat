import { Suspense } from "react";
import { SignIn } from "./form";
import { googleSignInEnabled } from "@/server/auth-settings";

export const metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function Page() {
  const google = await googleSignInEnabled();
  return <Suspense><SignIn testLogin={process.env.BLOAT_TEST_LOGIN === "1"} google={google} /></Suspense>;
}
