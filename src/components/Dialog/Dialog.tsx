import {
  Root as DialogRootPrimitive,
  Trigger as DialogTriggerPrimitive,
  Content as DialogContentPrimitive,
  Overlay as DialogOverlayPrimitive,
  CloseButton as DialogCloseButtonPrimitive,
  Title as DialogTitlePrimitive,
  Description as DialogDescriptionPrimitive,
  Portal as DialogPortal,
  type DialogRootProps,
  type DialogContentOptions,
} from "@kobalte/core/dialog";
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

export interface DialogProps extends DialogRootProps {
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
}
export interface DialogTriggerProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  type?: "button" | "submit" | "reset";
  variant?: "outline" | "ghost";
}
export interface DialogCloseButtonProps extends DialogTriggerProps {
  "aria-label": string;
}
export interface DialogContentProps
  extends JSX.HTMLAttributes<HTMLDivElement>, DialogContentOptions {}
export type DialogOverlayProps = JSX.HTMLAttributes<HTMLDivElement>;
export type DialogTitleProps = JSX.HTMLAttributes<HTMLHeadingElement>;
export type DialogDescriptionProps = JSX.HTMLAttributes<HTMLParagraphElement>;

interface DialogStyleContextValue {
  size: Accessor<"sm" | "md" | "lg">;
  appearance: Accessor<ComponentAppearance>;
}
const DialogStyleContext = createContext<DialogStyleContextValue>();
function useDialogStyleContext() {
  const context = useContext(DialogStyleContext);
  if (!context) throw new Error("Dialog parts must be used within Dialog.");
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
  sm: "w-80 p-3 text-md",
  md: "w-96 p-4 text-md",
  lg: "w-128 p-5 text-lg",
} as const;
const titleSizes = { sm: "text-md", md: "text-lg", lg: "text-xl" } as const;
const buttonBase =
  "inline-flex min-w-0 items-center justify-center gap-2 rounded-md font-medium cursor-pointer select-none transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

function DialogRoot(props: DialogProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      modal: true,
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["size", "appearance", "children"]);
  return (
    <DialogStyleContext.Provider
      value={{ size: () => local.size, appearance: () => local.appearance }}
    >
      <DialogRootPrimitive {...rest}>{local.children}</DialogRootPrimitive>
    </DialogStyleContext.Provider>
  );
}

function DialogTrigger(props: DialogTriggerProps) {
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
  const context = useDialogStyleContext();
  return (
    <DialogTriggerPrimitive<"button">
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
    </DialogTriggerPrimitive>
  );
}

function DialogCloseButton(props: DialogCloseButtonProps) {
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
  const context = useDialogStyleContext();
  return (
    <DialogCloseButtonPrimitive<"button">
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
    </DialogCloseButtonPrimitive>
  );
}

function DialogOverlay(props: DialogOverlayProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <DialogOverlayPrimitive<"div">
      {...rest}
      class={clsx("fixed inset-0 z-40 bg-bg opacity-80", local.class)}
    >
      {local.children}
    </DialogOverlayPrimitive>
  );
}

function DialogContent(props: DialogContentProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  const context = useDialogStyleContext();
  return (
    <div class="pointer-events-none fixed inset-0 z-50 flex items-center justify-center p-4">
      <DialogContentPrimitive<"div">
        {...rest}
        class={clsx(
          "pointer-events-auto min-w-0 max-w-full max-h-full space-y-3 overflow-y-auto break-words rounded-md border border-solid border-border bg-surface text-fg font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          contentSizes[context.size()],
          context.appearance() === "default" && "shadow-md",
          getAppearanceClasses(context.appearance()),
          local.class,
        )}
      >
        {local.children}
      </DialogContentPrimitive>
    </div>
  );
}

function DialogTitle(props: DialogTitleProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  const context = useDialogStyleContext();
  return (
    <DialogTitlePrimitive<"h2">
      {...rest}
      class={clsx(
        "m-0 min-w-0 break-words text-fg font-medium",
        titleSizes[context.size()],
        local.class,
      )}
    >
      {local.children}
    </DialogTitlePrimitive>
  );
}

function DialogDescription(props: DialogDescriptionProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <DialogDescriptionPrimitive<"p">
      {...rest}
      class={clsx(
        "m-0 min-w-0 break-words text-md text-fg-muted font-normal",
        local.class,
      )}
    >
      {local.children}
    </DialogDescriptionPrimitive>
  );
}

export const Dialog = Object.assign(DialogRoot, {
  Root: DialogRoot,
  Trigger: DialogTrigger,
  Portal: DialogPortal,
  Overlay: DialogOverlay,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  CloseButton: DialogCloseButton,
});
