"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Caption, Field, Screen, inputClass } from "@/components/ui";
import { browserSupabase } from "@/lib/client/supabase";

// Screen 06: 6-digit email code. A new code can be asked for after 30 seconds.
export function CodeForm() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [wait, setWait] = useState(30);
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setMessage("");
    const { error } = await browserSupabase().auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setBusy(false);
    if (error) return setMessage("That code didn't work. Check it, or ask for a new one.");
    router.push("/today");
  }

  async function resend() {
    setWait(30); setMessage("");
    const { error } = await browserSupabase().auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
    setMessage(error ? "Please wait a little before asking for another code." : "If that address can sign in, a new code is on its way.");
  }

  return (
    <Screen title="Enter your code" back="/sign-in">
      <p className="text-ink-muted">If {email || "that address"} can sign in, we sent it a 6-digit code.</p>
      <form onSubmit={verify} className="flex flex-col gap-4">
        <Field label="6-digit code">
          <input className={`${inputClass} tabular text-center text-2xl tracking-[0.3em]`} inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} />
        </Field>
        <Button type="submit" disabled={busy || code.length !== 6}>{busy ? "Checking…" : "Continue"}</Button>
      </form>
      {message && <p role="status" className="t-caption text-ink">{message}</p>}
      <Button variant="quiet" onClick={resend} disabled={wait > 0}>{wait > 0 ? `Send a new code in ${wait} s` : "Send a new code"}</Button>
      <Caption>The email only contains your code. It never includes anything from your diary.</Caption>
    </Screen>
  );
}
