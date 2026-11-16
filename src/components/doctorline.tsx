"use client";
import Link from "next/link";
import { Caption } from "./ui";
import { useSave } from "@/lib/client/hooks";

export type DoctorLineData = { show: boolean; days: number; window: number; sentence: string; ovarianSentence: string | null; shortened: boolean; source: string; sourceUrl: string };

/** The doctor line: a quiet line quoting the NHS word for word. Never a pop-up, never on Today. */
export function DoctorLineBox({ line, onChanged }: { line: DoctorLineData; onChanged?: () => void }) {
  const save = useSave();
  return (
    <aside aria-label="A note from the NHS" className="flex flex-col gap-2 rounded-lg bg-brand-tint p-4">
      <p>{line.sentence}</p>
      {!line.shortened && (
        <>
          {line.ovarianSentence && <p>{line.ovarianSentence}</p>}
          <Caption>You logged bloating on {line.days} of the last {line.window} days. {line.source} · <Link href="/help">When to get medical help</Link></Caption>
          {onChanged && (
            <button type="button" className="min-h-11 w-fit text-left text-[0.8125rem] font-semibold text-brand underline" disabled={save.saving}
              onClick={async () => { const ok = await save.run("POST", "/v1/nudges/doctor/response", { response: "i_ve_spoken_to_a_doctor_about_this" }); if (ok) onChanged(); }}>
              I&apos;ve spoken to a doctor about this
            </button>
          )}
        </>
      )}
    </aside>
  );
}
