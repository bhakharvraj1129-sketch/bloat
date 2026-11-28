// Arrow keys in every radio group (interface review of 28 Nov 2026). The app's choice groups
// (Range, Appearance, the strength scale, time choices, country and others) are buttons with
// role="radio" inside role="radiogroup", so screen readers announce them as radio groups and tell
// people to use the arrow keys. This one handler gives them the standard behaviour everywhere:
// Left or Up chooses the previous option, Right or Down the next (wrapping round), Home and End the
// first and last; focus moves with the choice. Tab, Enter and Space keep working as before.

const KEYS = new Set(["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Home", "End"]);

function onKey(e: KeyboardEvent) {
  if (!KEYS.has(e.key) || e.altKey || e.ctrlKey || e.metaKey) return;
  const radio = (e.target as HTMLElement | null)?.closest?.<HTMLElement>('[role="radio"]');
  const group = radio?.closest<HTMLElement>('[role="radiogroup"]');
  if (!radio || !group) return;
  const radios = [...group.querySelectorAll<HTMLElement>('[role="radio"]')].filter(
    (r) => r.closest('[role="radiogroup"]') === group && !(r as HTMLButtonElement).disabled && r.offsetParent !== null,
  );
  const at = radios.indexOf(radio);
  if (at < 0 || radios.length < 2) return;
  const n = radios.length;
  const next = e.key === "Home" ? 0 : e.key === "End" ? n - 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? (at - 1 + n) % n : (at + 1) % n;
  e.preventDefault();
  radios[next]!.focus();
  radios[next]!.click();
}

let installed = false;
/** Installs the handler once per page. */
export function installRadioKeys() {
  if (installed || typeof window === "undefined") return;
  installed = true;
  window.addEventListener("keydown", onKey);
}
