import { createHash } from "node:crypto";
import { Caption } from "@/components/ui";
import { DoctorReportView } from "@/components/report/doctor-report";
import { privateDoctorSnapshot } from "@/lib/domain/report-privacy";
import { srv } from "@/server/db";
import type { DoctorSnapshot } from "@/server/reports";

export const metadata = { title: "Shared report", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

// A report shared by link. Only a live, unrevoked, unexpired link shows anything at all.
export default async function Shared({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const hash = createHash("sha256").update(token).digest("hex");
  const row = await srv<{ snapshot: DoctorSnapshot; expires_at: string } | null>("srv_share_lookup", { p_token_hash: hash }).catch(() => null);
  if (!row) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-4 px-4">
        <h1 className="t-headline">This link no longer works</h1>
        <p>It has expired or was withdrawn by the person who shared it. Ask them for a new link.</p>
      </main>
    );
  }
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-8">
      <h1 className="t-headline">Bloating diary summary</h1>
      <Caption>Shared until {row.expires_at.slice(0, 10)}</Caption>
      <DoctorReportView snapshot={privateDoctorSnapshot(row.snapshot)} />
    </main>
  );
}
