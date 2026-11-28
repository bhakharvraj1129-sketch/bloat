"use client";
import { Drawer } from "vaul";
import Link from "next/link";
import { Check, LoaderCircle, TriangleAlert, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import type { ApiFailure } from "@/lib/client/api";
import type { SaveState } from "@/lib/client/hooks";
import { openSheet, rememberOpener, returnFocus, useUnsavedGuard } from "@/lib/client/nav";
import { BackLink } from "./nav";

const cx = (...c: Array<string | false | null | undefined>) => c.filter(Boolean).join(" ");
export { cx };

export const ICON = { size: 20, strokeWidth: 1.75 } as const;

type ButtonProps = ComponentProps<"button"> & { variant?: "primary" | "secondary" | "quiet" | "danger"; size?: "lg" | "md"; full?: boolean };

/** A label ending in "…" ("Saving…", "Checking…") means the button is working: it shows a small loader. */
const isWorking = (children: ReactNode) => typeof children === "string" && children.endsWith("…");

export function Button({ variant = "primary", size = "md", full = true, className, children, ...rest }: ButtonProps) {
  const working = isWorking(children);
  return (
    <button
      {...rest}
      aria-busy={working || rest["aria-busy"] || undefined}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-sm border px-5 font-semibold transition-colors duration-150 disabled:cursor-not-allowed",
        size === "lg" ? "min-h-14 text-lg" : "min-h-12",
        full && "w-full",
        variant === "primary" && "border-brand bg-brand text-on-brand hover:opacity-90 disabled:border-line disabled:bg-surface disabled:text-ink-muted disabled:hover:opacity-100",
        variant === "secondary" && "border-line bg-surface text-ink hover:bg-subtle disabled:text-ink-muted disabled:hover:bg-surface",
        variant === "quiet" && "border-transparent text-ink underline-offset-4 hover:underline disabled:text-ink-muted disabled:no-underline",
        variant === "danger" && "border-line bg-surface text-alert hover:bg-alert-tint disabled:text-ink-muted disabled:hover:bg-surface",
        className,
      )}
    >
      {working && <LoaderCircle size={18} strokeWidth={2.2} className="shrink-0 animate-spin" aria-hidden />}
      {children}
    </button>
  );
}

export function LinkButton({ href, children, variant = "primary", className }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "quiet"; className?: string }) {
  return (
    <Link
      href={href}
      data-press
      className={cx(
        "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-sm border px-5 font-semibold no-underline transition-colors duration-150",
        variant === "primary" && "border-brand bg-brand text-on-brand hover:opacity-90",
        variant === "secondary" && "border-line bg-surface text-ink hover:bg-subtle",
        variant === "quiet" && "border-transparent text-ink hover:underline",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Card({ children, className, as: Tag = "div", "aria-labelledby": labelledBy }: { children: ReactNode; className?: string; as?: "div" | "section" | "li"; "aria-labelledby"?: string }) {
  return <Tag aria-labelledby={labelledBy} className={cx("rounded-lg border border-line bg-surface p-5 md:p-6", className)}>{children}</Tag>;
}

export function Label({ children, className, id, heading = false }: { children: ReactNode; className?: string; id?: string; heading?: boolean }) {
  // heading: the label names a section of the screen, so it is a real heading (same look).
  return heading ? <h2 id={id} className={cx("t-label", className)}>{children}</h2> : <p id={id} className={cx("t-label", className)}>{children}</p>;
}

export function Caption({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cx("t-caption", className)}>{children}</p>;
}

type ChipProps = { selected?: boolean; onClick?: () => void; children: ReactNode; tone?: "brand" | "alert"; disabled?: boolean; role?: "checkbox" | "radio"; title?: string };

/** A selectable option. Selection is shown with a fill, a check mark and its state, never by colour alone. */
export function Chip({ selected = false, onClick, children, tone = "brand", disabled, role = "checkbox", title }: ChipProps) {
  return (
    <button
      type="button" role={role} aria-checked={selected} disabled={disabled} onClick={onClick} title={title}
      className={cx(
        "inline-flex min-h-11 items-center gap-1.5 rounded-sm border px-4 text-left transition-colors duration-150",
        selected && tone === "brand" && "border-brand bg-brand font-semibold text-on-brand",
        selected && tone === "alert" && "border-alert bg-alert-tint font-semibold text-alert",
        !selected && "border-control bg-surface text-ink hover:bg-subtle",
        disabled && !selected && "cursor-not-allowed border-line text-ink-muted hover:bg-surface",
      )}
    >
      {selected && <Check size={16} strokeWidth={2.8} className="pop-in shrink-0" aria-hidden />}
      {children}
    </button>
  );
}

export function ChipGroup({ label, children, labelledBy }: { label?: string; children: ReactNode; labelledBy?: string }) {
  return <div role="group" aria-label={label} aria-labelledby={labelledBy} className="flex flex-wrap gap-2">{children}</div>;
}

export function ProTag() {
  return <span className="ml-1.5 inline-flex rounded-pill border border-line bg-subtle px-2 py-0.5 align-middle text-[0.8125rem] font-semibold leading-4 text-ink">Pro</span>;
}

export function scoreTone(n: number | null): { bg: string; fg: string } {
  if (n === null || n <= 0) return { bg: "bg-surface border border-line", fg: "text-ink" };
  if (n <= 3) return { bg: "bg-score-mild", fg: "text-on-score" };
  if (n <= 6) return { bg: "bg-score-moderate", fg: "text-on-score" };
  if (n <= 8) return { bg: "bg-score-strong", fg: "text-on-score-strong" };
  return { bg: "bg-score-severe", fg: "text-on-score-severe" };
}

/** The round score badge. The number is always printed; colour only supports it. */
export function ScoreBadge({ value, size = "md", unknown = false, label }: { value: number | null; size?: "sm" | "md" | "lg"; unknown?: boolean; label?: string }) {
  const tone = scoreTone(unknown ? null : value);
  const dims = size === "lg" ? "h-22 w-22 text-5xl" : size === "md" ? "h-12 w-12 text-xl" : "h-9 w-9 text-base";
  return (
    <span aria-label={label} className={cx("inline-flex shrink-0 items-center justify-center rounded-pill font-display font-semibold tabular", dims, tone.bg, tone.fg, (value ?? 0) <= 3 && "border border-control")}>
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
            className={cx("col-span-5 inline-flex min-h-12 items-center justify-center gap-1.5 rounded-sm border font-semibold transition-colors duration-150", value === 0 ? "pick border-brand bg-brand text-on-brand" : "border-control bg-surface hover:bg-subtle")}>
            {value === 0 && <Check size={16} strokeWidth={2.8} className="pop-in" aria-hidden />}0 · No bloating
          </button>
        )}
        {numbers.map((n) => {
          const on = value === n;
          return (
            <button key={n} type="button" role="radio" aria-checked={on} aria-label={`${n}`} onClick={() => onChange(n)}
              className={cx("min-h-12 rounded-sm border text-lg font-semibold tabular transition-colors duration-150", on ? "pick border-brand bg-brand text-on-brand" : "border-control bg-surface text-ink hover:border-ink hover:bg-subtle")}>
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
    const back = rememberOpener();
    return () => returnFocus(back);
  }, [open]);
  useUnsavedGuard(open && dirty);

  return (
    // Vaul bottom sheet: slides and fades in over 250ms (globals.css), can be dragged down to close
    // when nothing unsaved would be lost. Closing with unsaved input always asks first.
    <Drawer.Root open={open} onOpenChange={request} dismissible={!dirty} repositionInputs={false} autoFocus>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-ink/40" />
        <Drawer.Content
          onEscapeKeyDown={(e) => { if (dirty) { e.preventDefault(); request(false); } }}
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-lg flex-col rounded-t-lg border border-line bg-surface pb-[env(safe-area-inset-bottom)] outline-none md:max-w-xl md:max-h-[88dvh]"
        >
          <div aria-hidden className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-pill bg-line" />
          <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-3 md:px-7 md:pt-4">
            <Drawer.Title className="t-title">{title}</Drawer.Title>
            <button type="button" onClick={() => request(false)} className="-mr-2 inline-flex h-11 w-11 items-center justify-center rounded-sm text-ink hover:bg-subtle" aria-label="Close">
              <X {...ICON} aria-hidden />
            </button>
          </div>
          {description ? <Drawer.Description className="px-5 t-caption md:px-7">{description}</Drawer.Description> : <Drawer.Description className="sr-only">{title}</Drawer.Description>}
          {confirming && (
            <div role="alert" className="rise-in mx-5 mt-2 flex flex-col gap-3 rounded-sm border border-line bg-subtle p-4 md:mx-7">
              <p className="t-body-strong">Close without saving?</p>
              <Caption>What you entered here hasn&apos;t been saved yet.</Caption>
              <div className="flex flex-col gap-2">
                <Button variant="secondary" autoFocus onClick={() => setConfirming(false)}>Keep editing</Button>
                <Button variant="danger" onClick={() => request(false)}>Close without saving</Button>
              </div>
            </div>
          )}
          <div hidden={confirming} className="flex flex-col gap-6 overflow-y-auto px-5 pb-8 pt-2 md:px-7">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

/**
 * A screen: Back (contextual, with a fixed parent as the fallback), a short label above the title,
 * the title, an optional action, then the content. `width` keeps forms and reading comfortable:
 * "form" 560px, "page" 720px (the default), "wide" 1120px for dashboards.
 */
export function Screen({ title, children, back, action, eyebrow, width = "page" }: { title: string; children: ReactNode; back?: string; action?: ReactNode; eyebrow?: ReactNode; width?: "form" | "page" | "wide" }) {
  return (
    <main className={cx(
      "mx-auto flex min-h-dvh w-full flex-col gap-6 px-5 pb-32 pt-8 md:px-8 md:pb-16 md:pt-12",
      width === "form" ? "max-w-[38rem]" : width === "wide" ? "max-w-[76rem] lg:px-12" : "max-w-[49rem]",
    )}>
      <header className="flex flex-col gap-3">
        {back && <BackLink fallback={back} />}
        {eyebrow && <p className="t-label">{eyebrow}</p>}
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <h1 className="t-headline">{title}</h1>
          {action}
        </div>
      </header>
      {children}
    </main>
  );
}

/** While a screen loads: a skeleton of the page (cards with lines), never a blank screen or a spinner. */
export function Loading({ what = "Loading" }: { what?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-4">
      <span className="sr-only">{what}…</span>
      <div aria-hidden className="flex flex-col gap-4 rounded-lg border border-line bg-surface p-5 md:p-6">
        <div className="skeleton h-5 w-2/5" />
        <div className="skeleton h-14 w-full" />
        <div className="skeleton h-11 w-full" />
      </div>
      <div aria-hidden className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5"><div className="skeleton h-9 w-9" /><div className="skeleton h-4 w-3/5" /></div>
        <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5"><div className="skeleton h-9 w-9" /><div className="skeleton h-4 w-3/5" /></div>
      </div>
      <div aria-hidden className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-5 md:p-6">
        <div className="skeleton h-4 w-1/3" />
        <div className="skeleton h-4 w-4/5" />
        <div className="skeleton h-4 w-3/5" />
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiFailure | null; onRetry?: () => void }) {
  const offline = error?.code === "NETWORK";
  // A feature this version does not offer (invited beta): trying again cannot help, so no retry.
  if (error?.code === "NOT_AVAILABLE") {
    return (
      <Card className="flex flex-col gap-3">
        <p className="t-body-strong">Not available</p>
        <Caption>{error.message}</Caption>
        <Link href="/today" className="font-semibold">Go to Today</Link>
      </Card>
    );
  }
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
      {state === "saving" && <p className="t-caption flex items-center gap-1.5"><LoaderCircle size={14} strokeWidth={2.4} className="animate-spin" aria-hidden />Saving…</p>}
      {state === "saved" && <p className="rise-in t-caption flex items-center gap-1.5 font-semibold text-brand-text"><Check size={15} strokeWidth={2.8} aria-hidden />Saved</p>}
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

export const inputClass = "min-h-12 w-full rounded-sm border border-control bg-surface px-3 text-ink placeholder:text-ink-muted";

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
    <div className="flex flex-col gap-2 rounded-lg border border-alert bg-alert-tint p-4" role="note">
      {unique.map((i) => <p key={i.sentence} className="flex items-start gap-2 font-semibold text-alert"><TriangleAlert {...ICON} className="mt-0.5 shrink-0" aria-hidden />{i.sentence}</p>)}
      <p className="t-caption text-ink">{unique[0]!.source} · <Link href="/help">When to get medical help</Link></p>
    </div>
  );
}
