import {
  Root as TooltipRootPrimitive,
  Trigger as TooltipTriggerPrimitive,
  Content as TooltipContentPrimitive,
  Portal as TooltipPortal,
  type TooltipRootProps,
  type TooltipContentOptions,
} from "@kobalte/core/tooltip";
import {
  createContext,
  mergeProps,
  splitProps,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js";
import clsx from "clsx";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface TooltipProps extends TooltipRootProps {
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
}
export interface TooltipTriggerProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  type?: "button" | "submit" | "reset";
  variant?: "outline" | "ghost";
}
export interface TooltipContentProps
  extends JSX.HTMLAttributes<HTMLDivElement>, TooltipContentOptions {}

interface TooltipStyleContextValue {
  size: Accessor<"sm" | "md" | "lg">;
  appearance: Accessor<ComponentAppearance>;
}
const TooltipStyleContext = createContext<TooltipStyleContextValue>();
function useTooltipStyleContext() {
  const context = useContext(TooltipStyleContext);
  if (!context) throw new Error("Tooltip parts must be used within Tooltip.");
  return context;
}

const triggerVariants = {
  outline:
    "border border-solid border-border bg-surface text-fg enabled:hover:not-active:border-primary enabled:hover:not-active:bg-surface-hover enabled:active:border-primary-active enabled:active:bg-surface-active",
  ghost:
    "border-0 bg-surface text-fg enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active",
} as const;
const triggerSizes = {
  sm: "h-8 px-3 text-md",
  md: "h-10 px-4 text-md",
  lg: "h-12 px-5 text-lg",
} as const;
const contentSizes = {
  sm: "px-2 py-1 text-md",
  md: "px-3 py-2 text-md",
  lg: "px-4 py-3 text-lg",
} as const;

function TooltipRoot(props: TooltipProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      fitViewport: true,
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["size", "appearance", "children"]);
  return (
    <TooltipStyleContext.Provider
      value={{ size: () => local.size, appearance: () => local.appearance }}
    >
      <TooltipRootPrimitive {...rest}>{local.children}</TooltipRootPrimitive>
    </TooltipStyleContext.Provider>
  );
}

function TooltipTrigger(props: TooltipTriggerProps) {
  const merged = mergeProps(
    {
      variant: "outline",
      disabled: false,
      type: "button",
      class: "",
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "disabled",
    "class",
    "children",
  ]);
  const context = useTooltipStyleContext();
  return (
    <TooltipTriggerPrimitive<"button">
      {...rest}
      disabled={local.disabled}
      class={clsx(
        "inline-flex min-w-0 items-center justify-center gap-2 rounded-md font-medium cursor-pointer select-none transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
        triggerVariants[local.variant],
        triggerSizes[context.size()],
        getAppearanceClasses(context.appearance(), "native", local.disabled),
        local.class,
      )}
    >
      {local.children}
    </TooltipTriggerPrimitive>
  );
}

/** Tooltip content is descriptive only; use Popover for interactive content. */
function TooltipContent(props: TooltipContentProps) {
  const merged = mergeProps(
    { class: "", children: undefined, style: undefined } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["class", "children", "style"]);
  const context = useTooltipStyleContext();
  return (
    <TooltipContentPrimitive<"div">
      {...rest}
      class={clsx(
        "min-w-0 rounded-md border border-solid border-border bg-surface text-fg font-normal",
        contentSizes[context.size()],
        context.appearance() === "default" && "shadow-md",
        getAppearanceClasses(context.appearance()),
        local.class,
      )}
      style={
        typeof local.style === "string"
          ? `max-width: var(--kb-popper-content-available-width); ${local.style}`
          : {
              "max-width": "var(--kb-popper-content-available-width)",
              ...local.style,
            }
      }
    >
      <div class="max-w-64 break-words">{local.children}</div>
    </TooltipContentPrimitive>
  );
}

export const Tooltip = Object.assign(TooltipRoot, {
  Root: TooltipRoot,
  Trigger: TooltipTrigger,
  Portal: TooltipPortal,
  Content: TooltipContent,
});
