import { Root as AlertRoot } from "@kobalte/core/alert";
import { mergeProps, Show, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface AlertProps extends JSX.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  /** Optional visible heading; the native title attribute stays available. */
  heading?: JSX.Element;
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

export function Alert(props: AlertProps) {
  const merged = mergeProps(
    {
      variant: "info",
      size: "md",
      appearance: "default",
      heading: undefined,
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
    "heading",
    "class",
    "children",
  ]);
  return (
    <AlertRoot
      {...rest}
      class={clsx(
        "flex max-w-full min-w-0 items-start gap-3 rounded-md border border-solid bg-surface text-fg font-normal",
        variants[local.variant],
        sizes[local.size],
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
      <div class="min-w-0 flex-1 break-words space-y-1">
        <Show
          when={
            local.heading !== undefined &&
            local.heading !== null &&
            local.heading !== false &&
            local.heading !== ""
          }
        >
          <div class="font-medium">{local.heading}</div>
        </Show>
        <div>{local.children}</div>
      </div>
    </AlertRoot>
  );
}
