import {
  Root as TabsRootPrimitive,
  List as TabsListPrimitive,
  Trigger as TabsTriggerPrimitive,
  Content as TabsContentPrimitive,
  useTabsContext as useTabsPrimitiveContext,
  type TabsRootOptions,
  type TabsTriggerOptions,
  type TabsContentOptions,
} from "@kobalte/core/tabs";
import {
  createContext,
  mergeProps,
  splitProps,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";
import {
  createTabsIdRegistry,
  createTabsPartRegistration,
  type TabsIdRegistry,
} from "./associations";
import "./Tabs.css";

export interface TabsProps
  extends
    Omit<JSX.HTMLAttributes<HTMLDivElement>, "onChange">,
    Omit<TabsRootOptions, "onChange"> {
  variant?: "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  /**
   * Kobalte selection callback, named consistently with other controls.
   * Kobalte 0.13.14 can request the same value twice for Enter/Space.
   */
  onValueChange?: (value: string) => void;
}
export type TabsListProps = JSX.HTMLAttributes<HTMLDivElement>;
export interface TabsTriggerProps
  extends
    Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "value" | "type">,
    TabsTriggerOptions {
  /** Tab triggers never submit a containing form. */
  type?: "button";
}
export interface TabsContentProps
  extends JSX.HTMLAttributes<HTMLDivElement>, TabsContentOptions {
  /** Inactive mounted panels remain hidden and cannot receive Tab focus. */
  forceMount?: boolean;
}

interface TabsStyleContextValue {
  variant: Accessor<"outline" | "ghost">;
  size: Accessor<"sm" | "md" | "lg">;
  appearance: Accessor<ComponentAppearance>;
  orientation: Accessor<"horizontal" | "vertical">;
  disabled: Accessor<boolean>;
  triggerIds: TabsIdRegistry;
  contentIds: TabsIdRegistry;
}
const TabsStyleContext = createContext<TabsStyleContextValue>();
function useTabsStyleContext() {
  const context = useContext(TabsStyleContext);
  if (!context) throw new Error("Tabs parts must be used within Tabs.");
  return context;
}
const variants = {
  outline:
    "border border-solid border-border bg-surface text-fg enabled:hover:not-active:border-primary enabled:hover:not-active:bg-surface-hover enabled:active:border-primary-active enabled:active:bg-surface-active aria-selected:border-primary aria-selected:bg-primary aria-selected:text-primary-fg enabled:aria-selected:hover:not-active:border-primary-hover enabled:aria-selected:hover:not-active:bg-primary-hover enabled:aria-selected:active:border-primary-active enabled:aria-selected:active:bg-primary-active",
  ghost:
    "border-0 bg-surface text-fg enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active aria-selected:bg-surface-active aria-selected:text-primary",
} as const;
const triggerSizes = {
  sm: "min-h-8 px-3 py-1 text-md",
  md: "min-h-10 px-4 py-2 text-md",
  lg: "min-h-12 px-5 py-2 text-lg",
} as const;
const contentSizes = {
  sm: "p-3 text-md",
  md: "p-4 text-md",
  lg: "p-5 text-lg",
} as const;

function TabsRoot(props: TabsProps) {
  const merged = mergeProps(
    {
      variant: "outline",
      size: "md",
      appearance: "default",
      orientation: "horizontal",
      activationMode: "automatic",
      disabled: false,
      value: undefined,
      defaultValue: undefined,
      onValueChange: undefined,
      class: "",
      children: undefined,
    } as const,
    useAppearanceDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "size",
    "appearance",
    "orientation",
    "disabled",
    "onValueChange",
    "class",
    "children",
  ]);
  const triggerIds = createTabsIdRegistry();
  const contentIds = createTabsIdRegistry();
  return (
    <TabsStyleContext.Provider
      value={{
        variant: () => local.variant,
        size: () => local.size,
        appearance: () => local.appearance,
        orientation: () => local.orientation,
        disabled: () => local.disabled,
        triggerIds,
        contentIds,
      }}
    >
      <TabsRootPrimitive<"div">
        {...rest}
        orientation={local.orientation}
        disabled={local.disabled}
        onChange={local.onValueChange}
        class={clsx(
          "flex min-w-0 gap-4 text-fg font-normal",
          local.orientation === "vertical"
            ? "flex-col sm:flex-row sm:items-start"
            : "flex-col",
          local.class,
        )}
      >
        {local.children}
      </TabsRootPrimitive>
    </TabsStyleContext.Provider>
  );
}

function TabsList(props: TabsListProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  const context = useTabsStyleContext();
  return (
    <TabsListPrimitive<"div">
      {...rest}
      class={clsx(
        "flex max-w-full min-w-0 gap-3 p-2",
        context.orientation() === "vertical"
          ? "flex-col items-stretch"
          : "flex-wrap items-center",
        local.class,
      )}
    >
      {local.children}
    </TabsListPrimitive>
  );
}

function TabsTrigger(props: TabsTriggerProps) {
  const merged = mergeProps(
    {
      disabled: false,
      type: "button",
      class: "",
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["disabled", "class", "children"]);
  const context = useTabsStyleContext();
  const primitiveContext = useTabsPrimitiveContext();
  createTabsPartRegistration(
    context.triggerIds,
    () => merged.value,
    () => merged.id ?? primitiveContext.generateTriggerId(merged.value),
    primitiveContext.triggerIdsMap,
  );
  return (
    <TabsTriggerPrimitive<"button">
      aria-controls={
        primitiveContext.listState().selectedKey() === merged.value
          ? context.contentIds.get(merged.value)
          : undefined
      }
      {...rest}
      disabled={local.disabled}
      class={clsx(
        "inline-flex max-w-full min-w-0 items-center justify-center gap-2 break-words rounded-md font-medium cursor-pointer select-none transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
        variants[context.variant()],
        triggerSizes[context.size()],
        getAppearanceClasses(
          context.appearance(),
          "native",
          local.disabled || context.disabled(),
        ),
        local.class,
      )}
    >
      <span class="min-w-0 break-words">{local.children}</span>
    </TabsTriggerPrimitive>
  );
}

function TabsContent(props: TabsContentProps) {
  const merged = mergeProps(
    { forceMount: false, class: "", children: undefined } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["class", "children"]);
  const context = useTabsStyleContext();
  const primitiveContext = useTabsPrimitiveContext();
  createTabsPartRegistration(
    context.contentIds,
    () => merged.value,
    () => merged.id ?? primitiveContext.generateContentId(merged.value),
    primitiveContext.contentIdsMap,
  );
  return (
    <TabsContentPrimitive<"div">
      aria-labelledby={context.triggerIds.get(merged.value)}
      {...rest}
      class={clsx(
        "solid-tabs-content max-w-full min-w-0 flex-1 break-words rounded-md border border-solid border-border bg-surface text-fg font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        contentSizes[context.size()],
        getAppearanceClasses(
          context.appearance(),
          "display",
          context.disabled(),
        ),
        local.class,
      )}
    >
      {local.children}
    </TabsContentPrimitive>
  );
}

export const Tabs = Object.assign(TabsRoot, {
  Root: TabsRoot,
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
