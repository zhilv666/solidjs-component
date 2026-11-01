import {
  Root as ImageRoot,
  Img as ImageImg,
  Fallback as ImageFallback,
  type ImageRootOptions,
} from "@kobalte/core/image";
import { mergeProps, splitProps, type JSX } from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export type AvatarLoadingStatus = Parameters<
  NonNullable<ImageRootOptions["onLoadingStatusChange"]>
>[0];

type ImageAttributes = Omit<
  JSX.ImgHTMLAttributes<HTMLImageElement>,
  "src" | "alt" | "children" | "role" | "aria-hidden"
>;

export interface AvatarProps extends Omit<
  JSX.HTMLAttributes<HTMLSpanElement>,
  "children"
> {
  /** The name is stable while loading or showing the fallback; empty means decorative. */
  alt: string;
  src?: string;
  fallback?: string;
  variant?: "circle" | "square";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  imageProps?: ImageAttributes;
  onLoadingStatusChange?: (status: AvatarLoadingStatus) => void;
}

const variants = {
  /* allow-token-bypass: Avatar is an explicitly approved circular-image exception. */
  circle: "rounded-full",
  square: "rounded-md",
} as const;
const sizes = {
  sm: "h-8 w-8 text-md",
  md: "h-10 w-10 text-md",
  lg: "h-12 w-12 text-lg",
} as const;
const backgrounds = {
  default: "bg-surface",
  keycap: "bg-surface",
  mahjong: "bg-bg",
} as const;

/** Kobalte owns image loading, stale-request cleanup and fallback selection. */
export function Avatar(props: AvatarProps) {
  const merged = mergeProps(
    {
      src: undefined,
      fallback: "?",
      variant: "circle",
      size: "md",
      appearance: "default",
      imageProps: {} as ImageAttributes,
      onLoadingStatusChange: undefined,
      class: "",
      children: undefined,
    } as const,
    useAppearanceDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "alt",
    "src",
    "fallback",
    "variant",
    "size",
    "appearance",
    "imageProps",
    "onLoadingStatusChange",
    "class",
    "children",
  ]);
  return (
    <ImageRoot<"span">
      role={local.alt ? "img" : undefined}
      aria-label={local.alt || undefined}
      aria-hidden={local.alt === "" || undefined}
      {...rest}
      onLoadingStatusChange={local.onLoadingStatusChange}
      class={clsx(
        "inline-flex shrink-0 items-center justify-center overflow-hidden border border-solid border-border text-fg font-medium align-middle",
        variants[local.variant],
        sizes[local.size],
        backgrounds[local.appearance],
        getAppearanceClasses(local.appearance),
        local.class,
      )}
    >
      <ImageImg<"img">
        {...local.imageProps}
        src={local.src}
        alt=""
        aria-hidden="true"
        class={clsx("block h-full w-full object-cover", local.imageProps.class)}
      />
      <ImageFallback aria-hidden="true" class="max-w-full truncate px-1">
        {local.fallback}
      </ImageFallback>
    </ImageRoot>
  );
}
