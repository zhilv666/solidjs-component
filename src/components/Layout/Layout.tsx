import { mergeProps, splitProps, type JSX } from "solid-js";
import { Dynamic } from "solid-js/web";
import clsx from "clsx";
import { getAppearanceClasses } from "../appearance";
import { Sidebar } from "./Sidebar";
import {
  LayoutStyleContext,
  useLayoutDefaults,
  type LayoutStyleOptions,
} from "./layout-context";

export interface LayoutProps
  extends JSX.HTMLAttributes<HTMLDivElement>, LayoutStyleOptions {}
export interface HeaderProps
  extends JSX.HTMLAttributes<HTMLElement>, LayoutStyleOptions {}
export interface FooterProps
  extends JSX.HTMLAttributes<HTMLElement>, LayoutStyleOptions {}
export interface ContentProps
  extends JSX.HTMLAttributes<HTMLElement>, LayoutStyleOptions {
  /** Use section inside another main landmark, as in embedded layout demos. */
  as?: "main" | "section" | "div";
}

const variants = {
  plain: "",
  outline: "rounded-md border border-solid border-border",
} as const;
const sizes = {
  sm: "p-3 text-md",
  md: "p-4 text-md",
  lg: "p-6 text-lg",
} as const;
const rootSizes = { sm: "text-md", md: "text-md", lg: "text-lg" } as const;
const panelBase = "min-w-0 break-words bg-surface text-fg font-normal";

function LayoutRoot(props: LayoutProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      variant: "plain",
      class: "",
      children: undefined,
    } as const,
    useLayoutDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "size",
    "appearance",
    "variant",
    "class",
    "children",
  ]);
  return (
    <LayoutStyleContext.Provider
      value={{ size: () => local.size, appearance: () => local.appearance }}
    >
      <div
        {...rest}
        class={clsx(
          "flex min-h-0 min-w-0 flex-col bg-bg text-fg font-normal",
          variants[local.variant],
          rootSizes[local.size],
          getAppearanceClasses(local.appearance),
          local.class,
        )}
      >
        {local.children}
      </div>
    </LayoutStyleContext.Provider>
  );
}

export function Header(props: HeaderProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      variant: "outline",
      class: "",
      children: undefined,
    } as const,
    useLayoutDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "size",
    "appearance",
    "variant",
    "class",
    "children",
  ]);
  return (
    <header
      {...rest}
      class={clsx(
        panelBase,
        "shrink-0",
        variants[local.variant],
        sizes[local.size],
        getAppearanceClasses(local.appearance),
        local.class,
      )}
    >
      {local.children}
    </header>
  );
}

export function Content(props: ContentProps) {
  const merged = mergeProps(
    {
      as: "main",
      size: "md",
      appearance: "default",
      variant: "outline",
      class: "",
      children: undefined,
    } as const,
    useLayoutDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "as",
    "size",
    "appearance",
    "variant",
    "class",
    "children",
  ]);
  return (
    <Dynamic
      component={local.as}
      {...rest}
      class={clsx(
        panelBase,
        "min-h-0 flex-1",
        variants[local.variant],
        sizes[local.size],
        getAppearanceClasses(local.appearance),
        local.class,
      )}
    >
      {local.children}
    </Dynamic>
  );
}

export function Footer(props: FooterProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      variant: "outline",
      class: "",
      children: undefined,
    } as const,
    useLayoutDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "size",
    "appearance",
    "variant",
    "class",
    "children",
  ]);
  return (
    <footer
      {...rest}
      class={clsx(
        panelBase,
        "shrink-0",
        variants[local.variant],
        sizes[local.size],
        getAppearanceClasses(local.appearance),
        local.class,
      )}
    >
      {local.children}
    </footer>
  );
}

export const Layout = Object.assign(LayoutRoot, {
  Root: LayoutRoot,
  Header,
  Sidebar,
  Content,
  Footer,
});
