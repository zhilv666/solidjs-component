import { Root as ButtonRoot } from "@kobalte/core/button";
import { mergeProps, Show, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";
import "./Tag.css";

interface TagBaseProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  "onClose"
> {
  variant?: "solid" | "outline" | "neutral";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  disabled?: boolean;
}

export type TagProps = TagBaseProps &
  (
    | { closable?: false; closeLabel?: never; onClose?: never }
    | {
        closable: true;
        closeLabel: string;
        /** The caller owns removal; Tag only notifies the close request. */
        onClose: JSX.EventHandler<HTMLButtonElement, MouseEvent>;
      }
  );

const variants = {
  solid: "border-primary bg-primary text-primary-fg",
  outline: "border-primary bg-surface text-primary",
  neutral: "border-border bg-bg text-fg",
} as const;
const closeVariants = {
  solid:
    "bg-primary text-primary-fg enabled:hover:not-active:bg-primary-hover enabled:active:bg-primary-active",
  outline:
    "bg-surface text-primary enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active",
  neutral:
    "bg-bg text-fg enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active",
} as const;
const sizes = {
  sm: "min-h-8 px-2 py-0.5 text-md",
  md: "min-h-9 px-2.5 py-1 text-md",
  lg: "min-h-10 px-3 py-1 text-lg",
} as const;

export function Tag(props: TagProps) {
  const merged = mergeProps(
    {
      variant: "solid",
      size: "md",
      appearance: "default",
      disabled: false,
      closable: false,
      closeLabel: undefined,
      onClose: undefined,
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
    "disabled",
    "closable",
    "closeLabel",
    "onClose",
    "class",
    "children",
  ]);
  return (
    <span
      {...rest}
      data-tag-appearance={
        local.appearance === "default" ? undefined : local.appearance
      }
      data-disabled={local.disabled ? "" : undefined}
      class={clsx(
        "inline-flex max-w-full min-w-0 items-center gap-2 rounded-md border border-solid font-normal",
        variants[local.variant],
        sizes[local.size],
        local.disabled && "cursor-not-allowed",
        getAppearanceClasses(local.appearance, "display", local.disabled),
        local.class,
      )}
    >
      <span class={clsx("min-w-0 break-words", local.disabled && "opacity-50")}>
        {local.children}
      </span>
      <Show when={local.closable}>
        <ButtonRoot<"button">
          type="button"
          disabled={local.disabled}
          aria-label={local.closeLabel}
          onClick={(event) => local.onClose?.(event)}
          class={clsx(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-sm border-0 p-0 text-lg font-normal cursor-pointer transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:opacity-50 disabled:cursor-not-allowed",
            closeVariants[local.variant],
            local.appearance === "pixel" && "solid-appearance-pixel",
          )}
        >
          <span aria-hidden="true">×</span>
        </ButtonRoot>
      </Show>
    </span>
  );
}
