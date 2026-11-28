"use client";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, LoaderCircle } from "lucide-react";
import { Caption, inputClass } from "./ui";
import { FieldMessage } from "./field-message";
import { api, ApiFailure } from "@/lib/client/api";

const PIN = /^[1-9]\d{5}$/;
const schema = z.object({ pin: z.string().trim().regex(PIN, "A PIN code has 6 digits and doesn't start with 0.") });
type Place = { state: string; city: string };

/**
 * India only: type a PIN code and the state fills itself in, with the city shown to confirm it
 * (React Hook Form + Zod; the lookup runs on the server with india-pincode). The PIN code is used
 * only for this and is never saved; it is sent in the request body, not the address.
 *
 * Only the answer for the PIN on screen now may fill in the state (review of 28 Nov 2026, finding 3):
 * each lookup is numbered, and an answer is dropped if a newer lookup started, the field changed or
 * was cleared, the person picked a state themselves (`region` changed), or the screen was left.
 */
export function PinField({ onPlace, region }: { onPlace: (place: Place) => void; region?: string | null }) {
  const id = useId();
  const [place, setPlace] = useState<Place | null>(null);
  const [looking, setLooking] = useState(false);
  const latest = useRef(0); // number of the lookup whose answer may apply
  const regionNow = useRef(region ?? null);
  useEffect(() => { regionNow.current = region ?? null; }, [region]);
  // Leaving the screen drops a pending answer (in You, a found state is saved at once).
  useEffect(() => () => { latest.current++; }, []);
  const { register, setError, clearErrors, formState: { errors } } = useForm<{ pin: string }>({
    resolver: zodResolver(schema), mode: "onTouched", defaultValues: { pin: "" },
  });

  const lookup = async (pin: string) => {
    const mine = ++latest.current;
    const regionAtStart = regionNow.current;
    setLooking(true);
    try {
      const found = await api<Place>("POST", "/v1/places/pincode", { pin });
      if (mine !== latest.current) return; // a newer PIN, a cleared field or a left screen
      if (regionNow.current !== regionAtStart) return; // the person chose a state meanwhile: keep it
      setPlace(found);
      clearErrors("pin");
      onPlace(found);
    } catch (e) {
      if (mine !== latest.current) return;
      setPlace(null);
      setError("pin", { message: e instanceof ApiFailure && e.status === 404 ? "We couldn't find that PIN code. Choose your state from the list instead." : "That didn't load. Check your connection and try again." });
    } finally {
      if (mine === latest.current) setLooking(false);
    }
  };
  const field = register("pin");
  const onPinChange = (e: ChangeEvent<HTMLInputElement>) => {
    void field.onChange(e);
    // Any change makes a pending answer out of date.
    latest.current++;
    setLooking(false);
    setPlace(null);
    const pin = e.target.value.trim();
    if (PIN.test(pin)) void lookup(pin);
  };
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`${id}-pin`} className="t-body-strong">PIN code (optional)</label>
      <div className="relative">
        <input id={`${id}-pin`} {...field} onChange={onPinChange} inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder="For example 380001"
          aria-invalid={errors.pin ? true : undefined} aria-describedby={`${id}-msg ${id}-hint`} className={inputClass} />
        {looking && <LoaderCircle size={18} strokeWidth={2.2} aria-hidden className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink-muted" />}
      </div>
      <FieldMessage id={`${id}-msg`} error={errors.pin?.message} />
      {place && <p role="status" className="rise-in flex items-center gap-1.5 t-caption font-semibold text-brand-text"><Check size={15} strokeWidth={2.8} aria-hidden />{place.city}, {place.state}</p>}
      <Caption><span id={`${id}-hint`}>Fills in your state. The PIN code itself isn&apos;t saved.</span></Caption>
    </div>
  );
}
