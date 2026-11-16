"use client";
import { useState } from "react";
import { Button, Card, Caption, Field, Screen, inputClass } from "@/components/ui";
import { api, ApiFailure } from "@/lib/client/api";

// Screen 03: honest unavailability with an optional waitlist. No health question is asked or stored.
export default function Unavailable() {
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  return (
    <Screen title="Not available yet" back="/start">
      <p>Bloat isn&apos;t available in your country yet.</p>
      {state === "done" ? (
        <Card><p className="t-body-strong">You&apos;re on the waitlist</p><Caption>We&apos;ll email you once when Bloat opens in your country.</Caption></Card>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setState("saving");
            try {
              await api("POST", "/v1/waitlist", { email, country });
              setState("done");
            } catch (err) {
              setMessage(err instanceof ApiFailure && err.status === 422 ? "Enter your country and a valid email address." : "That didn't save. Try again.");
              setState("error");
            }
          }}
        >
          <Field label="Your country"><input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" required maxLength={60} /></Field>
          <Field label="Email (optional)" hint="Only used to tell you when Bloat is available. Nothing else is stored."><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
          <Button type="submit" disabled={state === "saving"}>{state === "saving" ? "Saving…" : "Join waitlist"}</Button>
          {state === "error" && <p role="alert" className="t-caption text-ink">{message}</p>}
        </form>
      )}
    </Screen>
  );
}
