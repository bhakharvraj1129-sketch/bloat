// The theme picked in You, kept on this device only (no health data). "system" follows the device.
export const THEME_KEY = "bb-theme";
export type ThemeChoice = "system" | "light" | "dark";

export function readTheme(): ThemeChoice {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    return "system";
  }
}

const listeners = new Set<() => void>();

/** Calls back whenever the theme is changed on this page. */
export function onThemeChange(cb: () => void): () => void {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

/** The theme in use on this page (set before paint from storage, or by a choice in You). */
export function currentTheme(): ThemeChoice {
  const t = document.documentElement.dataset.theme;
  return t === "light" || t === "dark" ? t : "system";
}

export function applyTheme(choice: ThemeChoice) {
  const root = document.documentElement;
  if (choice === "system") delete root.dataset.theme;
  else root.dataset.theme = choice;
  try {
    if (choice === "system") localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, choice);
  } catch {
    // Storage blocked (private window): the choice still applies until the page is closed.
  }
  listeners.forEach((l) => l());
}
