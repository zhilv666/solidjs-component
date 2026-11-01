import { createContext, useContext, type Accessor } from "solid-js";
import { useAppearance } from "../../theme/appearance";
import type { ComponentAppearance } from "../appearance";

export type LayoutSize = "sm" | "md" | "lg";
export type LayoutVariant = "plain" | "outline";
export interface LayoutStyleOptions {
  size?: LayoutSize;
  appearance?: ComponentAppearance;
  variant?: LayoutVariant;
}
export interface LayoutStyleContextValue {
  size: Accessor<LayoutSize>;
  appearance: Accessor<ComponentAppearance>;
}
export const LayoutStyleContext = createContext<LayoutStyleContextValue>();

export function useLayoutDefaults() {
  const context = useContext(LayoutStyleContext);
  const appearance = useAppearance();
  return {
    get size() {
      return context?.size() ?? "md";
    },
    get appearance() {
      return context?.appearance() ?? appearance();
    },
  };
}
