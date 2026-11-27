"use client";
import { useId, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, LoaderCircle } from "lucide-react";
import { Caption, inputClass } from "./ui";
import { FieldMessage } from "./field-message";
import { api, ApiFailure } from "@/lib/client/api";

const schema = z.object({ pin: z.string().trim().regex(/^[1-9]\d{5}$/, "A PIN code has 6 digits and doesn't start with 0.") });
type Place = { state: string; city: string };

/**
 * India only: type a PIN code and the state fills itself in, with the city shown to confirm it
 * (React Hook Form + Zod; the lookup runs on the server with india-pincode). The PIN code is used
 * only for this and is never saved.
 */
export function PinField({ onPlace }: { onPlace: (place: Place) => void }) {
  const id = useId();
  const [place, setPlace] = useState<Place | null>(null);
  const [looking, setLooking] = useState(false);
  const { register, handleSubmit, setError, clearErrors, formState: { errors } } = useForm<{ pin: string }>({
    resolver: zodResolver(schema), mode: "onTouched", defaultValues: { pin: "" },
  });
  const lookup = handleSubmit(async ({ pin }) => {
    setLooking(true);
    try {
      const found = await api<Place>("GET", `/v1/places/pincode/${pin}`);
      setPlace(found);
      clearErrors("pin");
      onPlace(found);
    } catch (e) {
      setPlace(null);
      setError("pin", { message: e instanceof ApiFailure && e.status === 404 ? "We couldn't find that PIN code. Choose your state from the list instead." : "That didn't load. Check your connection and try again." });
    } finally {
      setLooking(false);
    }
  });
  const field = register("pin", {
    onChange: (e: { target: { value: string } }) => {
      setPlace(null);
      if (/^[1-9]\d{5}$/.test(e.target.value.trim())) void lookup();
    },
  });
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`${id}-pin`} className="t-body-strong">PIN code (optional)</label>
      <div className="relative">
        <input id={`${id}-pin`} {...field} inputMode="numeric" autoComplete="postal-code" maxLength={6} placeholder="For example 380001"
          aria-invalid={errors.pin ? true : undefined} aria-describedby={`${id}-msg ${id}-hint`} className={inputClass} />
        {looking && <LoaderCircle size={18} strokeWidth={2.2} aria-hidden className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-ink-muted" />}
      </div>
      <FieldMessage id={`${id}-msg`} error={errors.pin?.message} />
      {place && <p role="status" className="rise-in flex items-center gap-1.5 t-caption font-semibold text-brand-text"><Check size={15} strokeWidth={2.8} aria-hidden />{place.city}, {place.state}</p>}
      <Caption><span id={`${id}-hint`}>Fills in your state. The PIN code itself isn&apos;t saved.</span></Caption>
    </div>
  );
}
