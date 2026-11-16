import { Card, Caption } from "@/components/ui";

export const metadata = { title: "Offline" };

export default function Offline() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-4">
      <h1 className="t-headline">You&apos;re offline</h1>
      <Card>
        <p>Bloat needs a connection to open your diary. Nothing has been lost.</p>
        <Caption className="mt-2">Your records are kept on the server, not on this device, so they stay private on a shared phone.</Caption>
      </Card>
      <a className="inline-flex min-h-12 items-center justify-center rounded-pill bg-brand px-5 font-semibold text-on-brand no-underline" href="/today">Try again</a>
    </main>
  );
}
