import {
  createContext,
  mergeProps,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js";
import type { ComponentAppearance } from "@/components/appearance";

export interface AppearanceProviderProps {
  appearance?: ComponentAppearance;
  children?: JSX.Element;
}

interface AppearanceContextValue {
  appearance: Accessor<ComponentAppearance>;
}
const AppearanceContext = createContext<AppearanceContextValue>({
  appearance: (): ComponentAppearance => "default",
});

/** Changes defaults only; an explicit component appearance always wins. */
export function AppearanceProvider(props: AppearanceProviderProps) {
  const merged = mergeProps(
    { appearance: "default", children: undefined } as const,
    props,
  );
  return (
    <AppearanceContext.Provider value={{ appearance: () => merged.appearance }}>
      {merged.children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): Accessor<ComponentAppearance> {
  return useContext(AppearanceContext).appearance;
}

/** Capture the owner once, and defer reads so existing controls stay mounted. */
export function useAppearanceDefaults() {
  const appearance = useAppearance();
  return {
    get appearance() {
      return appearance();
    },
  };
}
