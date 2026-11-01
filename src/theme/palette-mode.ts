import type { ThemePalette } from "./tokens";

export const PALETTE_STORAGE_KEY = "solidjs-component-palette";

export const paletteOptions = [
  { value: "default", label: "默认蓝" },
  { value: "sakura", label: "樱花粉" },
  { value: "mint", label: "清新绿" },
  { value: "lavender", label: "薰衣草紫" },
  { value: "apricot", label: "暖杏橙" },
] as const satisfies readonly { value: ThemePalette; label: string }[];

export function isThemePalette(value: unknown): value is ThemePalette {
  return paletteOptions.some((option) => option.value === value);
}

export function getPreferredPalette(): ThemePalette {
  if (typeof window === "undefined") return "default";
  try {
    const stored = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    if (isThemePalette(stored)) return stored;
  } catch {
    // Preference persistence is optional in private or restricted contexts.
  }
  return "default";
}

export function applyPalette(palette: ThemePalette): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.palette = palette;
  try {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, palette);
  } catch {
    // Live palette switching must work even when storage is unavailable.
  }
}
