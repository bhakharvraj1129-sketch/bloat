"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Caption, Field, Screen, inputClass } from "@/components/ui";
import { browserSupabase } from "@/lib/client/supabase";
import { readPre, writePre } from "@/lib/client/pre";
import { api, ApiFailure } from "@/lib/client/api";
import { codeRequestOutcome, type AuthErrorLike } from "@/lib/otp-messages";

// Screens 05: sign up or sign in with Google or an email code. No health question comes before this.
export function SignIn({ testLogin, google: googleOn }: { testLogin: boolean; google: boolean }) {
  const router = useRouter();
  const isNew = useSearchParams().get("new") === "1";
  const [email, setEmail] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    // New accounts see the help page first (test Q92).
    if (isNew && !readPre().help_viewed_at) router.replace("/start");
  }, [isNew, router]);

  const needAdult = isNew && !adult;

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    if (needAdult) return setMessage("Bloat is for adults. Tick the box to confirm you are 18 or older.");
    setBusy(true); setMessage("");
    writePre({ adult: isNew ? true : undefined });
    let error: AuthErrorLike = null;
    try {
      ({ error } = await browserSupabase().auth.signInWithOtp({ email: email.trim(), options: { shouldCreateUser: isNew } }));
    } catch {
      error = { status: 0 };
    }
    setBusy(false);
    // "No account" looks exactly like a sent code (see otp-messages.ts). Real failures are shown
    // here, so nobody is sent on to wait for an email that is not coming.
    const out = codeRequestOutcome(error);
    if (out.kind !== "sent") return setMessage(out.message);
    router.push(`/sign-in/code?email=${encodeURIComponent(email.trim())}${isNew ? "&new=1" : ""}`);
  }

  async function google() {
    if (needAdult) return setMessage("Bloat is for adults. Tick the box to confirm you are 18 or older.");
    writePre({ adult: isNew ? true : undefined });
    const { error } = await browserSupabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback` } });
    if (error) setMessage("Google sign-in isn't available right now. Use an email code instead.");
  }

  async function testSignIn() {
    if (needAdult) return setMessage("Tick the box to confirm you are 18 or older.");
    setBusy(true); setMessage("");
    try {
      writePre({ adult: isNew ? true : undefined });
      await api("POST", "/v1/auth/test-login", { email, password, create: isNew });
      router.push("/today");
    } catch (err) {
      setMessage(err instanceof ApiFailure ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen title={isNew ? "Create your account" : "Sign in"} back={isNew ? "/help?signup=1" : "/"}>
      {/* Shown only when Google sign-in is switched on in Supabase (see server/auth-settings.ts). */}
      {googleOn && <Button variant="secondary" onClick={google}>Continue with Google</Button>}
      <form onSubmit={sendCode} className="flex flex-col gap-4">
        <Field label="Email"><input className={inputClass} type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        {isNew && (
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="h-6 w-6 accent-(--brand)" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
            <span>I am 18 or older</span>
          </label>
        )}
        <Button type="submit" disabled={busy}>{busy ? "Sending…" : "Send code"}</Button>
      </form>
      {message && <p role="alert" className="t-caption text-ink">{message}</p>}
      {isNew ? <Link href="/sign-in" className="font-semibold">I already have an account</Link> : <Link href="/start" className="font-semibold">I&apos;m new here</Link>}
      {testLogin && (
        <Card className="flex flex-col gap-3">
          <p className="t-body-strong">Test sign-in (preview only)</p>
          <Caption>For synthetic @example.com accounts on this preview. Not part of the real app.</Caption>
          <Field label="Test password"><input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="off" /></Field>
          <Button variant="secondary" onClick={testSignIn} disabled={busy || !email || password.length < 8}>Sign in with test password</Button>
        </Card>
      )}
    </Screen>
  );
}
