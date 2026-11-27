"use client";
import { useState } from "react";
import { Field, inputClass } from "./ui";
import { REGIONS, allZones, zoneChoices, zoneLabel, type Country } from "@/lib/regions";

/**
 * Pick a time zone by name ("Eastern time (New York)"), never by typing an ID. The country's zones
 * come first; "My time zone isn't listed" adds every other zone this browser knows.
 */
export function ZoneSelect({ country, value, onChange, label, also = [] }: {
  country: Country; value: string; onChange: (zone: string) => void; label: string; also?: Array<string | null | undefined>;
}) {
  const [all, setAll] = useState<string[] | null>(null);
  const choices = zoneChoices(country, value, ...also);
  const others = all?.filter((z) => !choices.includes(z)) ?? [];
  return (
    <div className="flex flex-col gap-2">
      <Field label={label}>
        <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
          {choices.map((z) => <option key={z} value={z}>{zoneLabel(z)}</option>)}
          {others.length > 0 && <optgroup label="Other places">{others.map((z) => <option key={z} value={z}>{zoneLabel(z)}</option>)}</optgroup>}
        </select>
      </Field>
      {!all && (
        <button type="button" className="min-h-11 self-start font-semibold text-ink underline underline-offset-4" onClick={() => setAll(allZones())}>
          My time zone isn&apos;t listed
        </button>
      )}
    </div>
  );
}

/** Pick a state, province or territory by name; optional, so "Not chosen" is always there. */
export function RegionSelect({ country, value, onChange }: { country: Country; value: string; onChange: (name: string) => void }) {
  const { label, names } = REGIONS[country];
  // A value typed before this list existed is still shown as it was saved.
  const list = value && !names.includes(value) ? [value, ...names] : names;
  return (
    <Field label={`${label} (optional)`}>
      <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)} autoComplete="address-level1">
        <option value="">Not chosen</option>
        {list.map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </Field>
  );
}
