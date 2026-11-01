import {
  Root as ToastRootPrimitive,
  Region as ToastRegionPrimitive,
  List as ToastListPrimitive,
  Title as ToastTitlePrimitive,
  Description as ToastDescriptionPrimitive,
  CloseButton as ToastCloseButtonPrimitive,
  toaster,
  type ToastRootOptions,
  type ToastRegionOptions,
} from "@kobalte/core/toast";
import {
  createContext,
  mergeProps,
  Show,
  splitProps,
  useContext,
  type Accessor,
  type ComponentProps,
  type JSX,
} from "solid-js";
import { Portal } from "solid-js/web";
import clsx from "clsx";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface ToastProps
  extends
    Omit<JSX.LiHTMLAttributes<HTMLLIElement>, keyof ToastRootOptions>,
    ToastRootOptions {
  variant?: "info" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
}
export interface ToastRegionProps
  extends JSX.HTMLAttributes<HTMLDivElement>, ToastRegionOptions {
  /** Defaults inherited by toasts which do not specify their own style. */
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
}
export interface ToastListProps extends Omit<
  JSX.OlHTMLAttributes<HTMLOListElement>,
  "children"
> {
  /** Kobalte renders the global queue; static children are not accepted. */
  children?: never;
}
export type ToastTitleProps = JSX.HTMLAttributes<HTMLHeadingElement>;
export type ToastDescriptionProps = JSX.HTMLAttributes<HTMLParagraphElement>;
export interface ToastCloseButtonProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  type?: "button" | "submit" | "reset";
  variant?: "outline" | "ghost";
  "aria-label": string;
}
export type ToastPortalProps = ComponentProps<typeof Portal>;
export interface ToasterProps extends Omit<ToastRegionProps, "children"> {
  children?: never;
}
export interface ToastOptions extends Omit<ToastProps, "toastId" | "children"> {
  [attribute: `data-${string}`]: string | number | boolean | undefined;
  /** Visible, accessible heading; native title remains a separate attribute. */
  heading: JSX.Element;
  description?: JSX.Element;
  closable?: boolean;
  closeLabel?: string;
  closeButtonProps?: Omit<ToastCloseButtonProps, "aria-label" | "children">;
  /** Match a Toaster/Toast.Region regionId; omit for the default region. */
  region?: string;
}

interface ToastStyleContextValue {
  size: Accessor<"sm" | "md" | "lg">;
  appearance: Accessor<ComponentAppearance>;
}
const ToastRegionStyleContext = createContext<ToastStyleContextValue>();
const ToastStyleContext = createContext<ToastStyleContextValue>();
function useToastStyleContext() {
  const context = useContext(ToastStyleContext);
  if (!context) throw new Error("Toast parts must be used within Toast.");
  return context;
}
const variants = {
  info: "border-primary",
  success: "border-success",
  warning: "border-warning",
  danger: "border-danger",
} as const;
const iconClasses = {
  info: "text-primary",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
} as const;
const icons = { info: "ⓘ", success: "✓", warning: "!", danger: "×" } as const;
const sizes = {
  sm: "p-3 text-md",
  md: "p-4 text-md",
  lg: "p-5 text-lg",
} as const;
const titleSizes = { sm: "text-md", md: "text-lg", lg: "text-xl" } as const;
const closeSizes = {
  sm: "h-8 w-8 text-md",
  md: "h-10 w-10 text-md",
  lg: "h-12 w-12 text-lg",
} as const;
const closeVariants = {
  outline:
    "border border-solid border-border bg-surface text-fg enabled:hover:not-active:border-primary enabled:hover:not-active:bg-surface-hover enabled:active:border-primary-active enabled:active:bg-surface-active",
  ghost:
    "border-0 bg-surface text-fg enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active",
} as const;

function ToastRoot(props: ToastProps) {
  const region = useContext(ToastRegionStyleContext);
  const merged = mergeProps(
    {
      variant: "info",
      get size() {
        return region?.size() ?? "md";
      },
      get appearance() {
        return region?.appearance() ?? "default";
      },
      priority: "high",
      persistent: false,
      class: "",
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "size",
    "appearance",
    "class",
    "children",
  ]);
  return (
    <ToastStyleContext.Provider
      value={{ size: () => local.size, appearance: () => local.appearance }}
    >
      <ToastRootPrimitive<"li">
        {...rest}
        class={clsx(
          "flex max-w-full min-w-0 items-start gap-3 rounded-md border border-solid bg-surface text-fg font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          variants[local.variant],
          sizes[local.size],
          local.appearance === "default" && "shadow-md",
          getAppearanceClasses(local.appearance),
          local.class,
        )}
      >
        <span
          aria-hidden="true"
          class={clsx(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center text-xl font-medium",
            iconClasses[local.variant],
          )}
        >
          {icons[local.variant]}
        </span>
        <div class="min-w-0 flex-1 break-words">{local.children}</div>
      </ToastRootPrimitive>
    </ToastStyleContext.Provider>
  );
}

function ToastRegion(props: ToastRegionProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      class: "",
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "size",
    "appearance",
    "class",
    "children",
  ]);
  return (
    <ToastRegionStyleContext.Provider
      value={{ size: () => local.size, appearance: () => local.appearance }}
    >
      <ToastRegionPrimitive<"div">
        {...rest}
        class={clsx(
          "min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          local.class,
        )}
      >
        {local.children}
      </ToastRegionPrimitive>
    </ToastRegionStyleContext.Provider>
  );
}

function ToastList(props: ToastListProps) {
  const merged = mergeProps({ class: "" } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <ToastListPrimitive<"ol">
      {...rest}
      class={clsx(
        "m-0 min-w-0 list-none space-y-4 p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        local.class,
      )}
    />
  );
}

function ToastTitle(props: ToastTitleProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  const context = useToastStyleContext();
  return (
    <ToastTitlePrimitive<"h3">
      as="h3"
      {...rest}
      class={clsx(
        "m-0 min-w-0 break-words text-fg font-medium",
        titleSizes[context.size()],
        local.class,
      )}
    >
      {local.children}
    </ToastTitlePrimitive>
  );
}

function ToastDescription(props: ToastDescriptionProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <ToastDescriptionPrimitive<"p">
      as="p"
      {...rest}
      class={clsx(
        "m-0 min-w-0 break-words text-md text-fg-muted font-normal",
        local.class,
      )}
    >
      {local.children}
    </ToastDescriptionPrimitive>
  );
}

function ToastCloseButton(props: ToastCloseButtonProps) {
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
  const context = useToastStyleContext();
  return (
    <ToastCloseButtonPrimitive<"button">
      {...rest}
      disabled={local.disabled}
      class={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-md font-medium cursor-pointer select-none transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
        closeVariants[local.variant],
        closeSizes[context.size()],
        getAppearanceClasses(context.appearance(), "native", local.disabled),
        local.class,
      )}
    >
      {local.children}
    </ToastCloseButtonPrimitive>
  );
}

/** Mount once per region. The full-viewport Portal wrapper never intercepts clicks. */
export function Toaster(props: ToasterProps) {
  const merged = mergeProps({ class: "" } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <Portal>
      <div class="pointer-events-none fixed inset-0 z-60 flex items-end justify-end p-2">
        <ToastRegion
          {...rest}
          class={clsx(
            "w-80 max-w-full max-h-full overflow-y-auto p-2",
            local.class,
          )}
        >
          <ToastList />
        </ToastRegion>
      </div>
    </Portal>
  );
}

function showToast(options: ToastOptions): number {
  const merged = mergeProps(
    {
      description: undefined,
      closable: true,
      closeLabel: "关闭通知",
      closeButtonProps: undefined,
      region: undefined,
    } as const,
    options,
  );
  const [local, rest] = splitProps(merged, [
    "heading",
    "description",
    "closable",
    "closeLabel",
    "closeButtonProps",
    "region",
  ]);
  return toaster.show(
    (props) => (
      <ToastRoot {...rest} toastId={props.toastId}>
        <div class="flex min-w-0 items-start gap-2">
          <div class="min-w-0 flex-1 space-y-1">
            <ToastTitle>{local.heading}</ToastTitle>
            <Show
              when={
                local.description !== undefined &&
                local.description !== null &&
                local.description !== false &&
                local.description !== ""
              }
            >
              <ToastDescription>{local.description}</ToastDescription>
            </Show>
          </div>
          <Show when={local.closable}>
            <ToastCloseButton
              {...local.closeButtonProps}
              aria-label={local.closeLabel}
            />
          </Show>
        </div>
      </ToastRoot>
    ),
    {
      get region() {
        return local.region;
      },
    },
  );
}

/** Global Kobalte queue. Returns a numeric id for dismiss; requires a mounted Toaster. */
export const toast = Object.assign(showToast, {
  show: showToast,
  dismiss: toaster.dismiss,
  clear: toaster.clear,
});
export const Toast = Object.assign(ToastRoot, {
  Root: ToastRoot,
  Region: ToastRegion,
  List: ToastList,
  Portal,
  Title: ToastTitle,
  Description: ToastDescription,
  CloseButton: ToastCloseButton,
});
