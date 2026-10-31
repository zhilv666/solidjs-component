import { mergeProps, splitProps, type JSX } from "solid-js";
import clsx from "clsx";

export interface CardProps extends JSX.HTMLAttributes<HTMLElement> {
  variant?: "outline" | "elevated";
  size?: "sm" | "md" | "lg";
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
    { variant: "outline", size: "md", class: "", children: undefined } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "size",
    "class",
    "children",
  ]);
  return (
    <section
      {...rest}
      class={clsx(
        "max-w-full min-w-0 break-words rounded-md border border-solid border-border text-fg font-normal",
        variants[local.variant],
        sizes[local.size],
        local.class,
      )}
    >
      {local.children}
    </section>
  );
}
