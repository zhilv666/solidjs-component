import {
  Root as PopoverRootPrimitive,
  Trigger as PopoverTriggerPrimitive,
  Content as PopoverContentPrimitive,
  CloseButton as PopoverCloseButtonPrimitive,
  Title as PopoverTitlePrimitive,
  Description as PopoverDescriptionPrimitive,
  Portal as PopoverPortal,
  type PopoverRootProps,
  type PopoverContentOptions,
} from "@kobalte/core/popover";
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

export interface PopoverProps extends PopoverRootProps {
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
}
export interface PopoverTriggerProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  type?: "button" | "submit" | "reset";
  variant?: "outline" | "ghost";
}
export interface PopoverCloseButtonProps extends PopoverTriggerProps {
  "aria-label": string;
}
export interface PopoverContentProps
  extends JSX.HTMLAttributes<HTMLDivElement>, PopoverContentOptions {}
export type PopoverTitleProps = JSX.HTMLAttributes<HTMLHeadingElement>;
export type PopoverDescriptionProps = JSX.HTMLAttributes<HTMLParagraphElement>;

interface PopoverStyleContextValue {
  size: Accessor<"sm" | "md" | "lg">;
  appearance: Accessor<ComponentAppearance>;
}
const PopoverStyleContext = createContext<PopoverStyleContextValue>();
function usePopoverStyleContext() {
  const context = useContext(PopoverStyleContext);
  if (!context) throw new Error("Popover parts must be used within Popover.");
  return context;
}
const variants = {
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
const closeSizes = {
  sm: "h-8 w-8 text-md",
  md: "h-10 w-10 text-md",
  lg: "h-12 w-12 text-lg",
} as const;
const contentSizes = {
  sm: "p-3 text-md",
  md: "p-4 text-md",
  lg: "p-5 text-lg",
} as const;
const titleSizes = { sm: "text-md", md: "text-lg", lg: "text-xl" } as const;
const buttonBase =
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-md font-medium cursor-pointer select-none transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

function PopoverRoot(props: PopoverProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      modal: false,
      fitViewport: true,
      children: undefined,
    } as const,
    useAppearanceDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, ["size", "appearance", "children"]);
  return (
    <PopoverStyleContext.Provider
      value={{ size: () => local.size, appearance: () => local.appearance }}
    >
      <PopoverRootPrimitive {...rest}>{local.children}</PopoverRootPrimitive>
    </PopoverStyleContext.Provider>
  );
}

function PopoverTrigger(props: PopoverTriggerProps) {
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
  const context = usePopoverStyleContext();
  return (
    <PopoverTriggerPrimitive<"button">
      {...rest}
      disabled={local.disabled}
      class={clsx(
        buttonBase,
        variants[local.variant],
        triggerSizes[context.size()],
        getAppearanceClasses(context.appearance(), "native", local.disabled),
        local.class,
      )}
    >
      {local.children}
    </PopoverTriggerPrimitive>
  );
}

function PopoverCloseButton(props: PopoverCloseButtonProps) {
  const merged = mergeProps(
    {
      variant: "ghost",
      disabled: false,
      type: "button",
      class: "",
      children: "×",
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "disabled",
    "class",
    "children",
  ]);
  const context = usePopoverStyleContext();
  return (
    <PopoverCloseButtonPrimitive<"button">
      {...rest}
      disabled={local.disabled}
      class={clsx(
        buttonBase,
        variants[local.variant],
        closeSizes[context.size()],
        getAppearanceClasses(context.appearance(), "native", local.disabled),
        local.class,
      )}
    >
      {local.children}
    </PopoverCloseButtonPrimitive>
  );
}

function PopoverContent(props: PopoverContentProps) {
  const merged = mergeProps(
    { class: "", children: undefined, style: undefined } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["class", "children", "style"]);
  const context = usePopoverStyleContext();
  return (
    <PopoverContentPrimitive<"div">
      {...rest}
      class={clsx(
        "w-72 min-w-0 space-y-3 overflow-y-auto break-words rounded-md border border-solid border-border bg-surface text-fg font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        contentSizes[context.size()],
        context.appearance() === "default" && "shadow-md",
        getAppearanceClasses(context.appearance()),
        local.class,
      )}
      style={
        typeof local.style === "string"
          ? `max-width: var(--kb-popper-content-available-width); max-height: var(--kb-popper-content-available-height); ${local.style}`
          : {
              "max-width": "var(--kb-popper-content-available-width)",
              "max-height": "var(--kb-popper-content-available-height)",
              ...local.style,
            }
      }
    >
      {local.children}
    </PopoverContentPrimitive>
  );
}

function PopoverTitle(props: PopoverTitleProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  const context = usePopoverStyleContext();
  return (
    <PopoverTitlePrimitive<"h2">
      {...rest}
      class={clsx(
        "m-0 min-w-0 break-words text-fg font-medium",
        titleSizes[context.size()],
        local.class,
      )}
    >
      {local.children}
    </PopoverTitlePrimitive>
  );
}

function PopoverDescription(props: PopoverDescriptionProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <PopoverDescriptionPrimitive<"p">
      {...rest}
      class={clsx(
        "m-0 min-w-0 break-words text-md text-fg-muted font-normal",
        local.class,
      )}
    >
      {local.children}
    </PopoverDescriptionPrimitive>
  );
}

export const Popover = Object.assign(PopoverRoot, {
  Root: PopoverRoot,
  Trigger: PopoverTrigger,
  Portal: PopoverPortal,
  Content: PopoverContent,
  Title: PopoverTitle,
  Description: PopoverDescription,
  CloseButton: PopoverCloseButton,
});
