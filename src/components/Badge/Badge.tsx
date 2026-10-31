import { mergeProps, splitProps, type JSX } from "solid-js";
import clsx from "clsx";

export interface BadgeProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  variant?: "solid" | "outline" | "neutral";
  size?: "sm" | "md" | "lg";
}

const variants = {
  solid: "border-primary bg-primary text-primary-fg",
  outline: "border-primary bg-surface text-primary",
  neutral: "border-border bg-bg text-fg",
} as const;
const sizes = {
  sm: "min-h-6 px-2 py-0.5 text-md",
  md: "min-h-7 px-2.5 py-1 text-md",
  lg: "min-h-8 px-3 py-1 text-lg",
} as const;

export function Badge(props: BadgeProps) {
  const merged = mergeProps(
    { variant: "solid", size: "md", class: "", children: undefined } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "size",
    "class",
    "children",
  ]);
  return (
    <span
      {...rest}
      class={clsx(
        "inline-flex max-w-full min-w-0 items-center gap-1 break-words rounded-md border border-solid font-medium",
        variants[local.variant],
        sizes[local.size],
        local.class,
      )}
    >
      {local.children}
    </span>
  );
}
