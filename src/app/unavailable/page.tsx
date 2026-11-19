"use client";
import { useState } from "react";
import { Button, Card, Caption, Field, Screen, inputClass } from "@/components/ui";
import { useRef } from "react";
import { api, ApiFailure, newKey } from "@/lib/client/api";

// Screen 03: honest unavailability with an optional waitlist. No health question is asked or stored.
export default function Unavailable() {
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [state, setState] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const key = useRef(newKey()); // kept after a lost reply, so trying again never adds the email twice
  return (
    <Screen title="Not available yet" back="/start">
      <p>Bloat isn&apos;t available in your country yet.</p>
      {state === "done" ? (
        <Card><p className="t-body-strong">You&apos;re on the waitlist</p><Caption>We&apos;ll email you once when Bloat opens in your country.</Caption></Card>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (state === "saving") return;
            if (!country.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
              setMessage("Enter your country and a valid email address.");
              return setState("error");
            }
            setState("saving");
            try {
              await api("POST", "/v1/waitlist", { email: email.trim(), country: country.trim() }, { key: key.current });
              setState("done");
            } catch (err) {
              const lost = err instanceof ApiFailure && err.unknownOutcome;
              if (!lost) key.current = newKey();
              setMessage(err instanceof ApiFailure && err.status === 422 ? "Enter your country and a valid email address." : lost ? "Connection lost. Try again. You won't be added twice." : "That didn't save. Try again.");
              setState("error");
            }
          }}
        >
          <Field label="Your country"><input className={inputClass} value={country} onChange={(e) => setCountry(e.target.value)} autoComplete="country-name" required maxLength={60} /></Field>
          <Field label="Email" hint="Only used to tell you when Bloat is available. Nothing else is stored."><input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
          <Button type="submit" disabled={state === "saving"}>{state === "saving" ? "Saving…" : "Join waitlist"}</Button>
          {state === "error" && <p role="alert" className="t-caption text-ink">{message}</p>}
        </form>
      )}
    </Screen>
  );
}
