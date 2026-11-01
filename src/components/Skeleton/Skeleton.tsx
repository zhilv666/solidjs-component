import { mergeProps, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface SkeletonProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  "children"
> {
  variant?: "line" | "block";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
}

const variants = {
  line: { sm: "h-4", md: "h-5", lg: "h-6" },
  block: { sm: "h-16", md: "h-24", lg: "h-32" },
} as const;

/** Decorative static placeholder; the caller owns loading and its announcement. */
export function Skeleton(props: SkeletonProps) {
  const merged = mergeProps(
    {
      variant: "line",
      size: "md",
      appearance: "default",
      class: "",
      children: undefined,
      "aria-hidden": true,
    } as const,
    useAppearanceDefaults(),
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
    <div
      {...rest}
      class={clsx(
        "w-full min-w-0 rounded-md border border-solid border-border bg-surface-active",
        variants[local.variant][local.size],
        getAppearanceClasses(local.appearance),
        local.class,
      )}
    />
  );
}
