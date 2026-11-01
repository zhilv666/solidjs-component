import { mergeProps, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface SpinnerProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  variant?: "primary" | "neutral";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  label?: string;
}

const variants = { primary: "text-primary", neutral: "text-fg-muted" } as const;
const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-12 w-12" } as const;
const iconSizes = { sm: "h-4 w-4", md: "h-5 w-5", lg: "h-6 w-6" } as const;
const appearances = {
  default: "",
  keycap: "border border-solid border-border bg-surface",
  mahjong: "border border-solid border-border bg-bg",
} as const;

export function Spinner(props: SpinnerProps) {
  const merged = mergeProps(
    {
      variant: "primary",
      size: "md",
      appearance: "default",
      label: "加载中",
      class: "",
      role: "status",
      "aria-live": "polite",
      "aria-busy": true,
    } as const,
    useAppearanceDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "size",
    "appearance",
    "label",
    "class",
  ]);
  return (
    <span
      {...rest}
      class={clsx(
        "inline-flex shrink-0 items-center justify-center rounded-md",
        sizes[local.size],
        appearances[local.appearance],
        getAppearanceClasses(local.appearance),
        local.class,
      )}
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        class={clsx(
          "animate-spinner motion-reduce:animate-none",
          iconSizes[local.size],
          variants[local.variant],
        )}
      >
        <path
          d="M12 3a9 9 0 1 0 9 9"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
      <span class="sr-only">{local.label}</span>
    </span>
  );
}
