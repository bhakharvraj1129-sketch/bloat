"use client";
import { useSyncExternalStore } from "react";
import { Segmented } from "./ui";
import { applyTheme, currentTheme, onThemeChange, type ThemeChoice } from "@/lib/client/theme";

/** Light, dark or the device's setting. Applies at once and is remembered on this device only. */
export function ThemeSwitch() {
  const choice = useSyncExternalStore<ThemeChoice>(onThemeChange, currentTheme, () => "system");
  return (
    <div className="flex flex-col gap-2">
      <p className="t-body-strong">Appearance</p>
      <Segmented label="Appearance" value={choice} onChange={(v) => applyTheme(v)}
        options={[{ value: "system", label: "Same as device" }, { value: "light", label: "Light" }, { value: "dark", label: "Dark" }]} />
    </div>
  );
}
