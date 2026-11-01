import type { ComponentAppearance } from "../components/appearance";

export const APPEARANCE_STORAGE_KEY = "solidjs-component-appearance";

export function isComponentAppearance(
  value: unknown,
): value is ComponentAppearance {
  return value === "default" || value === "keycap" || value === "mahjong";
}

export function getPreferredAppearance(): ComponentAppearance {
  if (typeof window === "undefined") return "default";
  try {
    const stored = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
    if (isComponentAppearance(stored)) return stored;
  } catch {
    // Preference persistence is optional in private or restricted contexts.
  }
  return "default";
}

export function applyAppearance(appearance: ComponentAppearance): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.appearance = appearance;
  try {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, appearance);
  } catch {
    // The provider still updates the live UI when storage is unavailable.
  }
}
