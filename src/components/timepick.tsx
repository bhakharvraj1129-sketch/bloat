"use client";
import { useState } from "react";
import { Button, Caption, Chip, inputClass } from "./ui";
import { deviceZone, type ApiFailure } from "@/lib/client/api";
import { localParts } from "@/lib/time";

export type TimeValue =
  | { mode: "now"; zone: string }
  | { mode: "exact" | "approximate"; local: string; zone: string; offset_min?: number }
  | { mode: "unknown" };

/** The current wall-clock time, in `zone` when given, otherwise in this device's zone. */
function nowLocal(zone?: string): string {
  const p = (n: number) => String(n).padStart(2, "0");
  if (zone) {
    const t = localParts(Date.now(), zone);
    return `${t.y}-${p(t.m)}-${p(t.d)}T${p(t.h)}:${p(t.mi)}`;
  }
  const d = new Date();
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

type Props = {
  value: TimeValue;
  onChange: (v: TimeValue) => void;
  labels?: { now?: string; exact?: string; approximate?: string; unknown?: string };
  allowApproximate?: boolean;
  allowUnknown?: boolean;
  name: string;
  /** The time zone a typed time is in (and "now" for the latest allowed time). Defaults to this device's zone. */
  zone?: string;
};

/** Now / choose a time / roughly / I don't know. Times are never guessed for the user. */
export function TimePick({ value, onChange, labels = {}, allowApproximate = true, allowUnknown = false, name, zone: inZone }: Props) {
  const zone = inZone ?? deviceZone();
  const pick = (mode: "exact" | "approximate") => onChange({ mode, local: "local" in value ? value.local : nowLocal(inZone), zone });
  return (
    <div className="flex flex-col gap-3">
      <div role="radiogroup" aria-label={name} className="flex flex-wrap gap-2">
        <Chip role="radio" selected={value.mode === "now"} onClick={() => onChange({ mode: "now", zone })}>{labels.now ?? "Now"}</Chip>
        <Chip role="radio" selected={value.mode === "exact"} onClick={() => pick("exact")}>{labels.exact ?? "Choose time"}</Chip>
        {allowApproximate && <Chip role="radio" selected={value.mode === "approximate"} onClick={() => pick("approximate")}>{labels.approximate ?? "Roughly"}</Chip>}
        {allowUnknown && <Chip role="radio" selected={value.mode === "unknown"} onClick={() => onChange({ mode: "unknown" })}>{labels.unknown ?? "I don't know"}</Chip>}
      </div>
      {(value.mode === "exact" || value.mode === "approximate") && (
        <label className="flex flex-col gap-2">
          <span className="t-caption">{value.mode === "approximate" ? "About when? Your best estimate is fine; it is saved as approximate." : "Date and time"}</span>
          <input type="datetime-local" className={inputClass} value={value.local} max={nowLocal(inZone)} onChange={(e) => onChange({ mode: value.mode, local: e.target.value, zone })} />
        </label>
      )}
    </div>
  );
}

/** When the clocks changed and a time happened twice, the user chooses which one (never guessed). */
export function AmbiguousChoice({ error, onChoose }: { error: ApiFailure | null; onChoose: (offsetMin: number) => void }) {
  const [done, setDone] = useState(false);
  if (!error || error.code !== "AMBIGUOUS_TIME" || done) return null;
  const choices = ((error.details as { choices?: Array<{ offset_min: number }> } | null)?.choices ?? []).map((c) => c.offset_min).sort((a, b) => b - a);
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-line p-4">
      <p className="t-body-strong">That time happened twice</p>
      <Caption>The clocks went back that night. Which one do you mean?</Caption>
      {choices.map((c, i) => <Button key={c} variant="secondary" onClick={() => { setDone(true); onChoose(c); }}>{i === 0 ? "The first one (before the clocks changed)" : "The second one (after the clocks changed)"}</Button>)}
    </div>
  );
}
