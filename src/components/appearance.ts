// @unocss-include
import clsx from "clsx";

export type ComponentAppearance = "default" | "keycap" | "mahjong";
export type AppearanceInteraction = "display" | "native" | "control";

const bases = {
  default: "",
  keycap: "shadow-keycap transition-shadow duration-token",
  mahjong: "shadow-mahjong transition-shadow duration-token",
} as const;
const display = { default: "", keycap: "", mahjong: "" } as const;
const native = {
  default: "",
  keycap: "enabled:active:shadow-keycap-pressed",
  mahjong: "enabled:active:shadow-mahjong-pressed",
} as const;
const control = {
  default: "",
  keycap: "active:shadow-keycap-pressed peer-active:shadow-keycap-pressed",
  mahjong: "active:shadow-mahjong-pressed peer-active:shadow-mahjong-pressed",
} as const;
const interactions = { display, native, control } as const;

/** Colors, accessibility and component state remain owned by each component. */
export function getAppearanceClasses(
  appearance: ComponentAppearance,
  interaction: AppearanceInteraction = "display",
  unavailable = false,
): string {
  if (appearance === "default") return "";
  if (unavailable) return "shadow-sm transition-shadow duration-token";
  return clsx(bases[appearance], interactions[interaction][appearance]);
}
