"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { safeNext } from "@/lib/next-path";
import { useEffect, useState } from "react";
import { Button, Caption, Field, inputClass } from "@/components/ui";
import { AuthPage } from "@/components/public";
import { browserSupabase } from "@/lib/client/supabase";
import { CODE_COOLDOWN_SECONDS, codeRequestOutcome, verifyMessage, type AuthErrorLike } from "@/lib/otp-messages";

// Screen 06: 6-digit email code. A new code can be asked for after the cooldown (60 seconds, or
// whatever the server says).
export function CodeForm() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const isNew = params.get("new") === "1";
  const next = safeNext(params.get("next"));
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [wait, setWait] = useState(CODE_COOLDOWN_SECONDS);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage("");
    let error: AuthErrorLike = null;
    try {
      ({ error } = await browserSupabase().auth.verifyOtp({ email, token: code.trim(), type: "email" }));
    } catch {
      error = { status: 0 };
    }
    setBusy(false);
    const problem = verifyMessage(error);
    if (problem) return setMessage(problem);
    router.push(next ?? "/today");
  }

  async function resend() {
    setMessage(""); setSending(true);
    let error: AuthErrorLike = null;
    try {
      ({ error } = await browserSupabase().auth.signInWithOtp({ email, options: { shouldCreateUser: isNew } }));
    } catch {
      error = { status: 0 };
    }
    setSending(false);
    const out = codeRequestOutcome(error);
    setMessage(out.kind === "sent" ? "A new code is on its way if that address can sign in. Use the newest code." : out.message);
    if (out.kind === "sent") setWait(CODE_COOLDOWN_SECONDS);
    else if (out.kind === "rate_limited") setWait(out.retryAfter ?? CODE_COOLDOWN_SECONDS);
  }

  return (
    <AuthPage title="Enter your code" back={isNew ? "/sign-in?new=1" : "/sign-in"}>
      <p className="text-ink-muted">If {email || "that address"} can sign in, we sent it a 6-digit code. It can take a minute to arrive. Check your spam folder too.</p>
      <form onSubmit={verify} className="flex flex-col gap-4">
        <Field label="6-digit code">
          <input className={`${inputClass} tabular text-center text-2xl tracking-[0.3em]`} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Button type="submit" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Continue"}</Button>
      </form>
      {message && <p role="status" className="t-caption text-ink">{message}</p>}
      <Button variant="quiet" onClick={resend} disabled={wait > 0 || busy || sending}>{sending ? "Sending…" : wait > 0 ? `Send a new code in ${wait} s` : "Send a new code"}</Button>
      <Caption>The email only contains your code. It never includes anything from your diary.</Caption>
    </AuthPage>
  );
}
