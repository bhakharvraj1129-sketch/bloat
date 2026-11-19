"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Button, Caption, Screen, inputClass } from "@/components/ui";
import { browserSupabase } from "@/lib/client/supabase";
import { readPre, writePre } from "@/lib/client/pre";
import { passwordSignInMessage, validateSignIn, type FieldErrors } from "@/lib/sign-in-messages";
import type { AuthErrorLike } from "@/lib/otp-messages";
import { safeNext } from "@/lib/next-path";

// Screen 05, testing version: email and password for test accounts the owner set up in Supabase.
// There is no sign-up here, and sign-ups are switched off in Supabase itself, so a new account
// cannot be made from this screen or by calling Supabase directly.
// The password goes from the browser straight to Supabase Auth. It never reaches Bloat's server,
// never appears in a URL (the inputs have no "name", so even a form sent before the page is ready
// carries nothing), and is cleared from memory after each try.
export function PasswordSignIn() {
  const router = useRouter();
  const params = useSearchParams();
  const fromHelp = params.get("new") === "1";
  // False on the server and before hydration, true once the page can sign in.
  const ready = useSyncExternalStore(() => () => {}, () => true, () => false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const adultRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // People coming from "Get started" see the help page first (test Q92).
    if (fromHelp && !readPre().help_viewed_at) router.replace("/start");
  }, [fromHelp, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setMessage("");
    const found = validateSignIn({ email, password, needAdult: fromHelp, adult });
    setErrors(found);
    if (found.email) return emailRef.current?.focus();
    if (found.password) return passwordRef.current?.focus();
    if (found.adult) return adultRef.current?.focus();
    setBusy(true);
    let error: AuthErrorLike = null;
    try {
      ({ error } = await browserSupabase().auth.signInWithPassword({ email: email.trim(), password }));
    } catch {
      error = { status: 0 };
    }
    setPassword("");
    setBusy(false);
    const problem = passwordSignInMessage(error);
    if (problem) {
      setMessage(problem);
      return passwordRef.current?.focus();
    }
    if (fromHelp) writePre({ adult: true });
    router.replace(safeNext(params.get("next")) ?? "/today");
    router.refresh();
  }

  const describe = (field: keyof FieldErrors, hint?: string) => [errors[field] ? `${field}-error` : null, hint ?? null].filter(Boolean).join(" ") || undefined;

  return (
    <Screen title="Sign in" back={fromHelp ? "/help?signup=1" : "/"}>
      <Caption>This preview uses test accounts set up by the owner. New accounts can&apos;t be created here.</Caption>
      <form onSubmit={submit} method="post" noValidate className="flex flex-col gap-4" aria-describedby={message ? "signin-error" : undefined}>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="t-body-strong">Email</label>
          <input
            ref={emailRef} id="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false}
            className={`${inputClass} ${errors.email ? "border-alert" : ""}`} value={email} required
            aria-invalid={errors.email ? true : undefined} aria-describedby={describe("email")}
            onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: undefined }); }}
          />
          {errors.email && <p id="email-error" className="t-caption text-alert">{errors.email}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className="t-body-strong">Password</label>
          <input
            ref={passwordRef} id="password" type={show ? "text" : "password"} autoComplete="current-password" autoCapitalize="none" spellCheck={false}
            className={`${inputClass} ${errors.password ? "border-alert" : ""}`} value={password} required
            aria-invalid={errors.password ? true : undefined} aria-describedby={describe("password")}
            onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: undefined }); }}
          />
          {errors.password && <p id="password-error" className="t-caption text-alert">{errors.password}</p>}
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="h-6 w-6 accent-(--brand)" checked={show} onChange={(e) => setShow(e.target.checked)} />
            <span>Show password</span>
          </label>
        </div>
        {fromHelp && (
          <div className="flex flex-col gap-1">
            <label className="flex min-h-11 items-center gap-3">
              <input
                ref={adultRef} type="checkbox" className="h-6 w-6 accent-(--brand)" checked={adult}
                aria-invalid={errors.adult ? true : undefined} aria-describedby={describe("adult")}
                onChange={(e) => { setAdult(e.target.checked); if (errors.adult) setErrors({ ...errors, adult: undefined }); }}
              />
              <span>I am 18 or older</span>
            </label>
            {errors.adult && <p id="adult-error" className="t-caption text-alert">{errors.adult}</p>}
          </div>
        )}
        <Button type="submit" disabled={!ready || busy} aria-busy={busy || undefined}>{busy ? "Signing in…" : "Sign in"}</Button>
      </form>
      {message && <p id="signin-error" role="alert" className="t-caption text-ink">{message}</p>}
    </Screen>
  );
}

/**
 * Someone who is already signed in but came here from "Get started" (country and help page done):
 * confirm they are 18 or older, then carry on to setup. Setup sends this answer to the server, so it
 * is asked here rather than assumed.
 */
export function AdultConfirm() {
  const router = useRouter();
  const [adult, setAdult] = useState(false);
  const [error, setError] = useState("");
  return (
    <Screen title="You're signed in" back="/">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!adult) return setError("Bloat is for adults. Tick the box to confirm you are 18 or older.");
          writePre({ adult: true });
          router.replace("/setup");
        }}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-1">
          <label className="flex min-h-11 items-center gap-3">
            <input type="checkbox" className="h-6 w-6 accent-(--brand)" checked={adult} aria-invalid={error ? true : undefined} aria-describedby={error ? "adult-confirm-error" : undefined} onChange={(e) => { setAdult(e.target.checked); setError(""); }} />
            <span>I am 18 or older</span>
          </label>
          {error && <p id="adult-confirm-error" className="t-caption text-alert">{error}</p>}
        </div>
        <Button type="submit">Continue</Button>
      </form>
    </Screen>
  );
}
