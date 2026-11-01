import { Root as SeparatorRoot } from "@kobalte/core/separator";
import { mergeProps, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface DividerProps extends Omit<
  JSX.HTMLAttributes<HTMLHRElement>,
  "children"
> {
  variant?: "solid" | "dashed";
  size?: "sm" | "md" | "lg";
  orientation?: "horizontal" | "vertical";
  appearance?: ComponentAppearance;
  decorative?: boolean;
}

const variants = { solid: "border-solid", dashed: "border-dashed" } as const;
const layouts = {
  horizontal: "h-0 w-full",
  vertical: "w-0 min-h-8 self-stretch",
} as const;
const sizes = {
  horizontal: { sm: "border-t", md: "border-t-2", lg: "border-t-4" },
  vertical: { sm: "border-l", md: "border-l-2", lg: "border-l-4" },
} as const;

/** A static separator; vertical dividers stretch in a flex row or accept a height class. */
export function Divider(props: DividerProps) {
  const merged = mergeProps(
    {
      variant: "solid",
      size: "md",
      orientation: "horizontal",
      appearance: "default",
      decorative: false,
      class: "",
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "size",
    "orientation",
    "appearance",
    "decorative",
    "class",
    "children",
  ]);
  return (
    <SeparatorRoot<"hr">
      orientation={local.orientation}
      aria-hidden={local.decorative || undefined}
      {...rest}
      class={clsx(
        "m-0 min-w-0 shrink-0 rounded-md border-0 border-border",
        variants[local.variant],
        layouts[local.orientation],
        sizes[local.orientation][local.size],
        getAppearanceClasses(local.appearance),
        local.class,
      )}
    />
  );
}
