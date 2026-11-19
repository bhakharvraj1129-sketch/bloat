"use client";
import * as Dialog from "@radix-ui/react-dialog";
import Link from "next/link";
import { X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import type { ApiFailure } from "@/lib/client/api";
import type { SaveState } from "@/lib/client/hooks";
import { currentOpener, openSheet, returnFocus, useUnsavedGuard } from "@/lib/client/nav";
import { BackLink } from "./nav";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
export { cx };

export const ICON = { size: 20, strokeWidth: 1.75 } as const;

type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "secondary" | "quiet" | "danger"; size?: "lg" | "md"; full?: boolean };

export function Button({ variant = "primary", size = "md", full = true, className, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-pill px-5 font-semibold transition-colors duration-150 disabled:cursor-not-allowed",
        size === "lg" ? "min-h-16 text-lg" : "min-h-12",
        full && "w-full",
        variant === "primary" && "bg-brand text-on-brand disabled:bg-surface disabled:text-ink-muted disabled:border disabled:border-line",
        variant === "secondary" && "border border-line bg-surface text-ink disabled:text-ink-muted",
        variant === "quiet" && "text-brand disabled:text-ink-muted",
        variant === "danger" && "border border-line bg-surface text-alert",
        className,
      )}
    />
  );
}

export function LinkButton({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "quiet"; className?: string }) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-pill px-5 font-semibold no-underline",
        variant === "primary" && "bg-brand text-on-brand",
        variant === "secondary" && "border border-line bg-surface text-ink",
        variant === "quiet" && "text-brand",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({ children, className, as: Tag = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "li" }) {
  return <Tag className={cx("rounded-lg border border-line bg-surface p-4", className)}>{children}</Tag>;
}

export function Label({ children, className, id }: { children: ReactNode; className?: string; id?: string }) {
  return <p id={id} className={cx("t-label", className)}>{children}</p>;
}

export function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("t-caption", className)}>{children}</p>;
}

type ChipProps = { selected?: boolean; onClick?: () => void; children: ReactNode; tone?: "brand" | "alert"; disabled?: boolean; role?: "checkbox" | "radio"; title?: string };

/** A selectable pill. Selection is shown with a fill and a check mark, never by colour alone. */
export function Chip({ selected = false, onClick, children, tone = "brand", disabled, role = "checkbox", title }: ChipProps) {
  return (
    <button
      type="button" role={role} aria-checked={selected} disabled={disabled} onClick={onClick} title={title}
      className={cx(
        "inline-flex min-h-11 items-center gap-1.5 rounded-pill border px-4 text-left transition-colors duration-150",
        selected && tone === "brand" && "border-brand bg-brand-tint font-semibold text-ink",
        selected && tone === "alert" && "border-alert bg-alert-tint font-semibold text-alert",
        !selected && "border-line bg-surface text-ink",
        disabled && "text-ink-muted",
      )}
    >
      {selected && <span aria-hidden>✓</span>}
      {children}
    </button>
  );
}

export function ChipGroup({ label, children, labelledBy }: { label?: string; children: ReactNode; labelledBy?: string }) {
  return <div role="group" aria-label={label} aria-labelledby={labelledBy} className="flex flex-wrap gap-2">{children}</div>;
}

export function ProTag() {
  return <span className="ml-1 rounded-pill border border-brand px-2 py-0.5 text-[0.8125rem] font-semibold leading-4 text-brand">Pro</span>;
}

export function scoreTone(n: number | null): { bg: string; fg: string } {
  if (n === null || n <= 0) return { bg: "bg-surface border border-line", fg: "text-ink" };
  if (n <= 3) return { bg: "bg-score-mild", fg: "text-on-score" };
  if (n <= 6) return { bg: "bg-score-moderate", fg: "text-on-score" };
  if (n <= 8) return { bg: "bg-score-strong", fg: "text-on-score" };
  return { bg: "bg-score-severe", fg: "text-on-score-severe" };
}

/** The round score badge. The number is always printed; colour only supports it. */
export function ScoreBadge({ value, size = "md", unknown = false, label }: { value: number | null; size?: "sm" | "md" | "lg"; unknown?: boolean; label?: string }) {
  const tone = scoreTone(unknown ? null : value);
  const dims = size === "lg" ? "h-22 w-22 text-5xl" : size === "md" ? "h-12 w-12 text-xl" : "h-9 w-9 text-base";
  return (
    <span aria-label={label} className={cx("inline-flex shrink-0 items-center justify-center rounded-pill font-display font-semibold tabular", dims, tone.bg, tone.fg)}>
      {unknown || value === null ? "?" : value}
    </span>
  );
}

/** Strength 1–10 in two rows of five with the anchors underneath (EP-01). */
export function StrengthScale({ value, onChange, min = 1, name }: { value: number | null; onChange: (n: number) => void; min?: 0 | 1; name: string }) {
  const numbers = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <div>
      <div role="radiogroup" aria-label={name} className="grid grid-cols-5 gap-2">
        {min === 0 && (
          <button type="button" role="radio" aria-checked={value === 0} onClick={() => onChange(0)}
            className={cx("col-span-5 min-h-12 rounded-pill border font-semibold", value === 0 ? "border-brand bg-brand-tint" : "border-line bg-surface")}>
            {value === 0 && <span aria-hidden>✓ </span>}0 · No bloating
          </button>
        )}
        {numbers.map((n) => {
          const tone = scoreTone(n);
          const on = value === n;
          return (
            <button key={n} type="button" role="radio" aria-checked={on} aria-label={`${n}`} onClick={() => onChange(n)}
              className={cx("min-h-12 rounded-pill font-display text-lg font-semibold tabular transition-transform duration-150", tone.bg, tone.fg, on ? "outline-2 outline-offset-2 outline-ink scale-105" : "opacity-90")}>
              {n}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between t-caption"><span>1 · Very mild</span><span>10 · Worst imaginable</span></div>
    </div>
  );
}

/**
 * A bottom sheet. The phone's Back button closes it (instead of leaving the screen), focus returns
 * to the control that opened it, and when `dirty` is true closing asks before throwing away what
 * was entered.
 */
export function Sheet({ open, onOpenChange, title, children, description, dirty = false }: { open: boolean; onOpenChange: (o: boolean) => void; title: string; children: ReactNode; description?: string; dirty?: boolean }) {
  const [confirming, setConfirming] = useState(false);
  const request = (o: boolean) => {
    if (o) return onOpenChange(true);
    if (dirty && !confirming) return setConfirming(true);
    setConfirming(false);
    onOpenChange(false);
  };
  const latest = useRef(request);
  useEffect(() => { latest.current = request; });
  useEffect(() => (open ? openSheet(() => latest.current(false)) : undefined), [open]);
  // Remember what opened the sheet before focus moves into it (layout effects run first), and
  // return focus there when it closes or unmounts.
  useLayoutEffect(() => {
    if (!open) return;
    const opener = currentOpener();
    return () => returnFocus(opener);
  }, [open]);
  useUnsavedGuard(open && dirty);

  return (
    <Dialog.Root open={open} onOpenChange={request}>
      <Dialog.Portal>
        <Dialog.Overlay className="fade-in fixed inset-0 z-40 bg-ink/40" />
        <Dialog.Content
          className="sheet-in fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-md flex-col rounded-t-lg border border-line bg-surface"
        >
          <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-4">
            <Dialog.Title className="t-title">{title}</Dialog.Title>
            <Dialog.Close className="inline-flex h-11 w-11 items-center justify-center rounded-pill text-ink-muted" aria-label="Close">
              <X {...ICON} aria-hidden />
            </Dialog.Close>
          </div>
          {description ? <Dialog.Description className="px-4 t-caption">{description}</Dialog.Description> : <Dialog.Description className="sr-only">{title}</Dialog.Description>}
          {confirming && (
            <div role="alert" className="mx-4 mt-2 flex flex-col gap-3 rounded-sm border border-line bg-ground p-4">
              <p className="t-body-strong">Close without saving?</p>
              <Caption>What you entered here hasn&apos;t been saved yet.</Caption>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" autoFocus onClick={() => setConfirming(false)}>Keep editing</Button>
                <Button variant="danger" onClick={() => request(false)}>Close without saving</Button>
              </div>
            </div>
          )}
          <div hidden={confirming} className="flex flex-col gap-6 overflow-y-auto px-4 pb-8 pt-2">{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function Screen({ title, children, back, action, wide }: { title: string; children: ReactNode; back?: string; action?: ReactNode; wide?: boolean }) {
  return (
    <main className={cx("mx-auto flex min-h-dvh w-full flex-col gap-6 px-4 pb-32 pt-8", wide ? "max-w-2xl" : "max-w-md")}>
      <header className="flex flex-col gap-2">
        {back && <BackLink fallback={back} />}
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="t-headline">{title}</h1>
          {action}
        </div>
      </header>
      {children}
    </main>
  );
}

export function Loading({ what = "Loading" }: { what?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{what}…</span>
      {[0, 1, 2].map((i) => <div key={i} className="h-20 animate-pulse rounded-lg border border-line bg-surface" />)}
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiFailure | null; onRetry?: () => void }) {
  const offline = error?.code === "NETWORK";
  return (
    <Card className="flex flex-col gap-3">
      <p className="t-body-strong">{offline ? "Connection lost" : "This didn't load"}</p>
      <Caption>{offline ? "Check your connection and try again. Nothing was changed." : error?.message ?? "Something went wrong."}</Caption>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Try again</Button>}
    </Card>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <Card className="flex flex-col gap-1">
      <p className="t-body-strong">{title}</p>
      {children && <Caption>{children}</Caption>}
    </Card>
  );
}

/** Honest save feedback: Saving… → Saved, an error with retry, or "Check save status" when the reply was lost. */
export function SaveStatus({ state, error, onCheck }: { state: SaveState; error: ApiFailure | null; onCheck?: () => void }) {
  if (state === "idle") return null;
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-2">
      {state === "saving" && <Caption>Saving…</Caption>}
      {state === "saved" && <Caption>Saved</Caption>}
      {state === "error" && <p className="t-caption text-ink">{error?.message ?? "Nothing was saved. Try again."}</p>}
      {state === "unknown" && (
        <>
          <p className="t-caption text-ink">Connection lost. We can&apos;t tell yet whether this was saved.</p>
          {onCheck && <Button variant="secondary" onClick={onCheck}>Check save status</Button>}
        </>
      )}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-2">
      <span className="t-body-strong">{label}</span>
      {children}
      {hint && <span className="t-caption">{hint}</span>}
    </label>
  );
}

export const inputClass = "min-h-12 w-full rounded-sm border border-line bg-surface px-3 text-ink placeholder:text-ink-muted";

export function Segmented<T extends string>({ value, onChange, options, label }: { value: T | null; onChange: (v: T) => void; options: Array<{ value: T; label: string }>; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((o) => (
        <Chip key={o.value} role="radio" selected={value === o.value} onClick={() => onChange(o.value)}>{o.label}</Chip>
      ))}
    </div>
  );
}

/** NHS advice shown inline under a warning chip. The only place the alert colour is used. */
export function Advice({ items }: { items: Array<{ code: string; sentence: string; source: string }> }) {
  if (!items.length) return null;
  const unique = [...new Map(items.map((i) => [i.sentence, i])).values()];
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-alert-tint p-4" role="note">
      {unique.map((i) => <p key={i.sentence} className="font-semibold text-alert">{i.sentence}</p>)}
      <p className="t-caption text-ink">{unique[0]!.source} · <Link href="/help">When to get medical help</Link></p>
    </div>
  );
}
