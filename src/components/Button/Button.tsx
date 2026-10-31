import { Root as ButtonRoot } from "@kobalte/core/button";
import { mergeProps, Show, splitProps, type JSX } from "solid-js";
import clsx from "clsx";

export interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline" | "ghost" | "danger" | "mahjong";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

const keycapClasses =
  "shadow-keycap transition-shadow enabled:active:shadow-keycap-pressed disabled:shadow-sm";

const variants = {
  solid: `${keycapClasses} border border-primary bg-primary text-primary-fg enabled:hover:not-active:border-primary-hover enabled:hover:not-active:bg-primary-hover enabled:active:border-primary-active enabled:active:bg-primary-active`,
  outline: `${keycapClasses} border border-primary bg-surface text-primary enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active`,
  ghost:
    "border-0 text-fg transition-colors enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active",
  danger: `${keycapClasses} border border-danger bg-danger text-danger-fg enabled:hover:not-active:border-danger-hover enabled:hover:not-active:bg-danger-hover enabled:active:border-danger-active enabled:active:bg-danger-active`,
  mahjong:
    "shadow-mahjong transition-shadow enabled:active:shadow-mahjong-pressed disabled:shadow-sm border border-solid border-border bg-bg text-fg enabled:hover:not-active:border-success enabled:hover:not-active:bg-surface-hover enabled:active:border-success enabled:active:bg-surface-active",
} as const;

const sizes = {
  sm: "h-8 px-3 text-md",
  md: "h-10 px-4 text-md",
  lg: "h-12 px-5 text-lg",
} as const;

export function Button(props: ButtonProps) {
  const merged = mergeProps(
    {
      variant: "solid",
      size: "md",
      disabled: false,
      loading: false,
      type: "button",
      class: "",
      children: undefined,
      "aria-busy": undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "size",
    "disabled",
    "loading",
    "class",
    "children",
    "aria-busy",
  ]);

  return (
    <ButtonRoot
      {...rest}
      disabled={local.disabled || local.loading}
      aria-busy={local.loading || local["aria-busy"]}
      class={clsx(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium cursor-pointer select-none whitespace-nowrap duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
        variants[local.variant],
        sizes[local.size],
        local.class,
      )}
    >
      <Show when={local.loading}>
        <span aria-hidden="true" class="inline-block w-4 text-center">
          …
        </span>
      </Show>
      {local.children}
    </ButtonRoot>
  );
}
