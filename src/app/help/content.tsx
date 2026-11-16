"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Screen } from "@/components/ui";
import { helpPage } from "@/lib/wording";
import { readPre, writePre } from "@/lib/client/pre";

// Screen 04. Fixed NHS-based text; works without login; never says or implies all clear.
export function HelpContent() {
  const router = useRouter();
  const signup = useSearchParams().get("signup") === "1";
  const [country, setCountry] = useState<string | null>(null);
  const viewedAt = useRef(new Date().toISOString());
  useEffect(() => {
    const pre = readPre().country;
    if (pre) return setCountry(pre);
    // Signed-in users: the country from their settings. Signed out: generic wording.
    fetch("/v1/me/state", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((s) => setCountry(s?.profile?.country ?? null)).catch(() => {});
  }, []);
  const page = useMemo(() => helpPage(country), [country]);
  return (
    <Screen title={page.title} back={signup ? "/start" : undefined}>
      <p>{page.intro}</p>
      {page.sections.map((s) => (
        <Card key={s.level} as="section">
          <h2 className="t-body-strong">{s.heading}</h2>
          <ul className="mt-2 list-disc pl-5">
            {s.items.map((i) => <li key={i} className="py-0.5">{i}</li>)}
          </ul>
        </Card>
      ))}
      <p className="t-caption">{page.source} <a href={page.sourceUrl} rel="noreferrer" target="_blank">nhs.uk/symptoms/bloating</a></p>
      {signup ? (
        <Button onClick={() => { writePre({ help_viewed_at: viewedAt.current, help_version: page.version }); router.push("/sign-in?new=1"); }}>
          I&apos;ve read this
        </Button>
      ) : (
        <Button variant="secondary" onClick={() => router.back()}>Back</Button>
      )}
    </Screen>
  );
}
