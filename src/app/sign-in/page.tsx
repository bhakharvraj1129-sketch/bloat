import { Suspense } from "react";
import { SignIn } from "./form";

export const metadata = { title: "Sign in" };

export default function Page() {
  return <Suspense><SignIn testLogin={process.env.BLOAT_TEST_LOGIN === "1"} /></Suspense>;
}
