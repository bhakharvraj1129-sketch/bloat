"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Chip, Screen } from "@/components/ui";
import { writePre } from "@/lib/client/pre";

const OPTIONS = [["US", "United States"], ["CA", "Canada"], ["IN", "India"], ["OTHER", "Other"]] as const;

// Screen 02: availability is decided before any health question.
export default function Country() {
  const router = useRouter();
  const [value, setValue] = useState<string | null>(null);
  return (
    <Screen title="Where do you live?" back="/">
      <p className="text-ink-muted">This sets your emergency number, units and date format.</p>
      <div role="radiogroup" aria-label="Country" className="flex flex-col gap-2">
        {OPTIONS.map(([code, name]) => (
          <Chip key={code} role="radio" selected={value === code} onClick={() => setValue(code)}>{name}</Chip>
        ))}
      </div>
      <Button
        disabled={!value}
        onClick={() => {
          if (value === "OTHER") return router.push("/unavailable");
          writePre({ country: value! });
          router.push("/help?signup=1");
        }}
      >
        Continue
      </Button>
      {!value && <p className="t-caption">Choose a country to continue.</p>}
    </Screen>
  );
}
