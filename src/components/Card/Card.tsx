import { mergeProps, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface CardProps extends JSX.HTMLAttributes<HTMLElement> {
  variant?: "outline" | "elevated";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
}

const variants = {
  outline: "bg-surface",
  elevated: "bg-surface shadow-sm",
} as const;
const sizes = {
  sm: "p-3 text-md",
  md: "p-4 text-md",
  lg: "p-6 text-lg",
} as const;

/** A display-only section; interactive actions belong in its children. */
export function Card(props: CardProps) {
  const merged = mergeProps(
    {
      variant: "outline",
      size: "md",
      appearance: "default",
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
    <section
      {...rest}
      class={clsx(
        "max-w-full min-w-0 break-words rounded-md border border-solid border-border text-fg font-normal",
        local.appearance === "default"
          ? variants[local.variant]
          : variants.outline,
        sizes[local.size],
        getAppearanceClasses(local.appearance),
        local.class,
      )}
    >
      {local.children}
    </section>
  );
}
