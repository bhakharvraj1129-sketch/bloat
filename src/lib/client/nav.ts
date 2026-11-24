"use client";
// Navigation helpers shared by every screen.
//
// 1. A trail of the screens visited in this tab, so "Back" returns to where the person came from
//    and falls back to a fixed parent screen when there is no earlier Bloat screen (a deep link,
//    a new tab, or arriving from another site).
// 2. A record of unsaved changes, so leaving a half-filled form asks first.
// 3. A history entry for each open sheet, so a phone's own Back button closes the sheet instead
//    of leaving the screen.
// Nothing here stores health answers: the trail holds page addresses only.

import { useEffect } from "react";

type Router = { back: () => void; push: (href: string) => void };

// ---------- 1. Trail ----------

const TRAIL = "bloat.trail";
const MAX = 40;
// Screens that only make sense once: Back never returns to these. (The Sign in page itself is a
// normal step back for someone signed out; after a successful sign-in it is replaced in history.)
const SKIP = /^\/(sign-in\/code|auth|setup)(\/|\?|$)/;

function read(): string[] {
  try { const v = JSON.parse(sessionStorage.getItem(TRAIL) ?? "[]"); return Array.isArray(v) ? v.filter((x) => typeof x === "string") : []; } catch { return []; }
}
function write(t: string[]) {
  try { sessionStorage.setItem(TRAIL, JSON.stringify(t.slice(-MAX))); } catch { /* storage off: Back uses the fixed parent */ }
}
const here = () => location.pathname + location.search;

/** Called on every screen change. `fresh` is true on a full page load that was not a reload or Back/Forward. */
export function recordVisit(fresh: boolean) {
  const cur = here();
  const t = fresh ? [] : read();
  if (t[t.length - 1] === cur) return; // a reload, or the same screen again
  if (t.length >= 2 && t[t.length - 2] === cur) t.pop(); // went back one step
  else t.push(cur);
  write(t);
  dispatchEvent(new Event(TRAIL_EVENT));
}

const TRAIL_EVENT = "bloat:trail";
/** For useSyncExternalStore: re-read the trail whenever a screen change is recorded. */
export function onTrailChange(l: () => void) {
  addEventListener(TRAIL_EVENT, l);
  return () => removeEventListener(TRAIL_EVENT, l);
}

/** The Bloat screen before this one in this tab, if there is one Back can safely return to. */
export function previousScreen(): string | null {
  const t = read();
  if (t.length < 2 || t[t.length - 1] !== here()) return null;
  const prev = t[t.length - 2]!;
  return SKIP.test(prev) ? null : prev;
}

/** Back: the previous Bloat screen when there is one, otherwise the fixed parent screen. */
export function goBack(router: Router, fallback: string) {
  if (previousScreen()) router.back();
  else router.push(fallback);
}

// ---------- 2. Unsaved changes ----------

const unsaved = new Set<symbol>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function hasUnsaved() { return unsaved.size > 0; }
export function clearUnsaved() { unsaved.clear(); notify(); }
export function onUnsavedChange(l: () => void) { listeners.add(l); return () => { listeners.delete(l); }; }

function blockUnload(e: BeforeUnloadEvent) {
  if (!unsaved.size) return;
  e.preventDefault();
  e.returnValue = "";
}

/**
 * While `dirty` is true: closing the tab or reloading shows the browser's own warning, and the
 * Back button, tab bar and in-app links ask "Leave without saving?" first.
 */
export function useUnsavedGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const id = Symbol("unsaved");
    unsaved.add(id);
    if (unsaved.size === 1) addEventListener("beforeunload", blockUnload);
    notify();
    return () => {
      unsaved.delete(id);
      if (!unsaved.size) removeEventListener("beforeunload", blockUnload);
      notify();
    };
  }, [dirty]);
}

// ---------- 3. Sheets: focus and the phone's Back button ----------

// The control the person last pressed. Phones do not always focus a tapped button, so this is
// where focus goes back to when a sheet closes if nothing was focused when it opened.
let lastPressed: HTMLElement | null = null;
if (typeof window !== "undefined") {
  addEventListener("pointerdown", (e) => {
    lastPressed = ((e.target as Element | null)?.closest?.("button, a[href], [role=button], [role=radio], [role=checkbox], [tabindex]") as HTMLElement | null) ?? null;
  }, true);
}

let lastOuterOpener: HTMLElement | null = null; // the last opener that was on the screen itself, not in a sheet

/** The control that is opening a sheet right now. */
export function currentOpener(): HTMLElement | null {
  const a = document.activeElement as HTMLElement | null;
  const el = a && a !== document.body ? a : lastPressed;
  // A sheet opened from inside a sheet that has just closed: return to what opened the first one.
  if (!el || !el.isConnected) return lastOuterOpener;
  if (!el.closest("[role=dialog]")) lastOuterOpener = el;
  return el;
}

/**
 * Where focus goes when a sheet closes, taken when it opens:
 * - `el`: the control that opened it;
 * - `outer`: for a control inside another sheet (for example "Bloating gone"), what opened that sheet;
 * - `key`: a `data-focus-key` shared by a control and the one that replaces it after a save (for
 *   example "I feel bloated" and "Bloating ongoing");
 * - `section`: the id of the heading of the screen section the control was in.
 */
export type FocusReturn = { el: HTMLElement | null; outer: HTMLElement | null; key: string | null; section: string | null };

const keyOf = (el: Element | null) => el?.closest("[data-focus-key]")?.getAttribute("data-focus-key") ?? null;

export function rememberOpener(): FocusReturn {
  const el = currentOpener();
  const outer = el?.closest("[role=dialog]") ? lastOuterOpener : el;
  const anchor = outer ?? el;
  return { el, outer, key: keyOf(el) ?? keyOf(outer), section: anchor?.closest("section[aria-labelledby]")?.getAttribute("aria-labelledby") ?? null };
}

// Whether the person last used the keyboard (then a heading that takes focus is also scrolled into view).
let lastInputKeyboard = false;
if (typeof window !== "undefined") {
  addEventListener("keydown", () => { lastInputKeyboard = true; }, true);
  addEventListener("pointerdown", () => { lastInputKeyboard = false; }, true);
}

/**
 * After a sheet closes, put focus back on the control that opened it. If a save has removed that
 * control, use the control that replaced it, or else the heading of its section, or else the screen's
 * title (made focusable from code only, so Tab order does not change). The screen may reload a moment
 * after the sheet closes, so this keeps watching for 5 seconds. It never takes focus away from
 * something the person has moved to, and never moves focus behind a sheet that is open.
 */
export function returnFocus(from: FocusReturn | null) {
  if (!from) return;
  const back: FocusReturn = from;
  let placed: HTMLElement | null = null;
  let stopped = false;
  const usable = (el: Element | null | undefined): el is HTMLElement =>
    el instanceof HTMLElement && el.isConnected && !(el as HTMLButtonElement).disabled && el.getClientRects().length > 0;
  const heading = (): HTMLElement | null => {
    const h = (back.section && document.getElementById(back.section)) || document.querySelector("main h1") || document.querySelector("h1");
    if (!(h instanceof HTMLElement) || !h.isConnected) return null;
    if (!h.hasAttribute("tabindex")) h.setAttribute("tabindex", "-1");
    return h;
  };
  // waitForReplacement: a replacement is expected but may not be on the screen yet.
  const target = (waitForReplacement: boolean): HTMLElement | null => {
    if (usable(back.el)) return back.el;
    if (usable(back.outer)) return back.outer;
    if (back.key) {
      const r = document.querySelector(`[data-focus-key="${CSS.escape(back.key)}"]`);
      if (usable(r)) return r;
      if (waitForReplacement) return null;
    }
    return heading();
  };
  const observer = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => queueMicrotask(() => step(true)));
  const timers: ReturnType<typeof setTimeout>[] = [];
  function stop() { stopped = true; observer?.disconnect(); timers.forEach(clearTimeout); }
  function step(waitForReplacement: boolean) {
    if (stopped) return;
    const a = document.activeElement as HTMLElement | null;
    const onPage = !!a && a !== document.body;
    // Focus already back on the opener (the dialog itself may do that) or where this put it: keep
    // watching in case a reload removes it. Anywhere else: the person has moved on, so stop.
    if (onPage && (a === placed || a === back.el || a === back.outer)) { placed = a; return; }
    if (onPage) return stop();
    if (document.querySelector("[role=dialog]")) return; // another sheet is open and owns focus
    const t = target(waitForReplacement);
    if (!t) return;
    const restoring = t === back.el || t === back.outer;
    t.focus({ preventScroll: restoring || !lastInputKeyboard });
    placed = t;
  }
  timers.push(setTimeout(() => { step(true); observer?.observe(document.body, { childList: true, subtree: true }); }, 40));
  timers.push(setTimeout(() => step(false), 2000)); // the replacement never came: use the heading
  timers.push(setTimeout(stop, 5000));
}

type Entry = { close: () => void };
const stack: Entry[] = [];
let pushed = false; // one history entry stands for all open sheets
let popping = false; // we asked the browser to go back one step ourselves
let waiters: Array<() => void> = [];
const MARK = "bloatSheet";

function settle() {
  if (popping) return;
  const w = waiters; waiters = [];
  w.forEach((f) => f());
}

function onPop() {
  if (popping) { popping = false; settle(); return; }
  if (!pushed) return;
  // The phone's Back button while a sheet was open: close the top sheet, stay on this screen.
  pushed = false;
  const top = stack[stack.length - 1];
  top?.close();
  // Another sheet underneath stays open: give it its own entry again.
  queueMicrotask(() => { if (stack.length && !pushed) pushEntry(); });
}

function pushEntry() {
  try { history.pushState({ ...(history.state ?? {}), [MARK]: true }, ""); pushed = true; } catch { pushed = false; }
}

if (typeof window !== "undefined") addEventListener("popstate", onPop);

/** Register an open sheet. Returns the function to call when it closes for any reason. */
export function openSheet(close: () => void): () => void {
  const entry = { close };
  stack.push(entry);
  if (!pushed) pushEntry();
  return () => {
    const i = stack.indexOf(entry);
    if (i >= 0) stack.splice(i, 1);
    // Closed by its own button, Escape or a save: remove the entry Back would otherwise land on.
    // Wait a tick, so a sheet that opens straight after this one keeps the same entry.
    setTimeout(() => {
      if (stack.length || !pushed) return;
      pushed = false;
      if ((history.state as Record<string, unknown> | null)?.[MARK]) { popping = true; history.back(); }
    }, 0);
  };
}

/** Resolves once any sheet has finished tidying the history, so a navigation after it lands in the right place. */
export function sheetsSettled(): Promise<void> {
  return new Promise((resolve) => {
    // Give a sheet that just closed its tick to start going back, then wait for that to finish.
    setTimeout(() => { if (!popping) resolve(); else waiters.push(resolve); }, 10);
  });
}
