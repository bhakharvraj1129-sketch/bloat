"use client";
import { useMemo } from "react";
import { SearchSelect } from "./search-select";
import { REGIONS, allZones, zoneChoices, zoneLabel, type Country } from "@/lib/regions";

const COUNTRY_NAME: Record<Country, string> = { US: "the United States", CA: "Canada", IN: "India" };

/**
 * Pick a time zone by name ("Eastern time (New York)"), never by typing an ID. The country's zones
 * come first; searching also finds every other zone this browser knows ("Other places").
 */
export function ZoneSelect({ country, value, onChange, label, also = [] }: {
  country: Country; value: string; onChange: (zone: string) => void; label: string; also?: Array<string | null | undefined>;
}) {
  const choices = zoneChoices(country, value, ...also);
  const others = useMemo(() => allZones().filter((z) => !choices.includes(z)), [choices]);
  return (
    <SearchSelect label={label} value={value} onChange={onChange} searchLabel="Search time zones or cities"
      groups={[
        { heading: `In ${COUNTRY_NAME[country]}`, options: choices.map((z) => ({ value: z, label: zoneLabel(z) })) },
        { heading: "Other places", options: others.map((z) => ({ value: z, label: zoneLabel(z) })) },
      ]} />
  );
}

/** Pick a state, province or territory by name, with search; optional, so "Not chosen" is always there. */
export function RegionSelect({ country, value, onChange }: { country: Country; value: string; onChange: (name: string) => void }) {
  const { label, names } = REGIONS[country];
  // A value typed before this list existed is still shown as it was saved.
  const list = value && !names.includes(value) ? [value, ...names] : names;
  return (
    <SearchSelect label={`${label} (optional)`} value={value} onChange={onChange} searchLabel={`Search ${label.toLowerCase()}s`}
      groups={[{ options: [{ value: "", label: "Not chosen" }, ...list.map((n) => ({ value: n, label: n }))] }]} />
  );
}
