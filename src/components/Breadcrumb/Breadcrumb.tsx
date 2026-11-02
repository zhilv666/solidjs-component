import {
  Root as BreadcrumbsRoot,
  Link as BreadcrumbsLink,
  Separator as BreadcrumbsSeparator,
  type BreadcrumbsRootOptions,
  type BreadcrumbsLinkOptions,
} from "@kobalte/core/breadcrumbs";
import {
  createContext,
  mergeProps,
  splitProps,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";

export interface BreadcrumbProps
  extends JSX.HTMLAttributes<HTMLElement>, BreadcrumbsRootOptions {
  variant?: "outline" | "plain";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  disabled?: boolean;
}
export type BreadcrumbListProps = JSX.OlHTMLAttributes<HTMLOListElement>;
export type BreadcrumbItemProps = JSX.LiHTMLAttributes<HTMLLIElement>;
export interface BreadcrumbLinkProps
  extends JSX.AnchorHTMLAttributes<HTMLAnchorElement>, BreadcrumbsLinkOptions {
  disabled?: boolean;
}
export type BreadcrumbSeparatorProps = JSX.HTMLAttributes<HTMLSpanElement>;

interface BreadcrumbStyleContextValue {
  variant: Accessor<"outline" | "plain">;
  size: Accessor<"sm" | "md" | "lg">;
  appearance: Accessor<ComponentAppearance>;
  disabled: Accessor<boolean>;
}
const BreadcrumbStyleContext = createContext<BreadcrumbStyleContextValue>();
function useBreadcrumbStyleContext() {
  const context = useContext(BreadcrumbStyleContext);
  if (!context)
    throw new Error("Breadcrumb parts must be used within Breadcrumb.");
  return context;
}

const variants = {
  outline: "border border-solid border-border bg-surface text-fg",
  plain: "border-0 bg-surface text-fg",
} as const;
const interactiveVariants = {
  outline:
    "hover:not-active:border-primary hover:not-active:bg-surface-hover hover:not-active:text-primary active:border-primary-active active:bg-surface-active active:text-primary",
  plain:
    "hover:not-active:bg-surface-hover hover:not-active:text-primary active:bg-surface-active active:text-primary",
} as const;
const sizes = {
  sm: "min-h-8 px-2 py-1 text-md",
  md: "min-h-10 px-3 py-2 text-md",
  lg: "min-h-12 px-4 py-2 text-lg",
} as const;
const separatorSizes = { sm: "text-md", md: "text-md", lg: "text-lg" } as const;

function BreadcrumbRoot(props: BreadcrumbProps) {
  const merged = mergeProps(
    {
      variant: "plain",
      size: "md",
      appearance: "default",
      disabled: false,
      separator: "/",
      translations: { breadcrumbs: "面包屑 / Breadcrumb" },
      "aria-label": undefined,
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
    "class",
    "children",
  ]);
  return (
    <BreadcrumbStyleContext.Provider
      value={{
        variant: () => local.variant,
        size: () => local.size,
        appearance: () => local.appearance,
        disabled: () => local.disabled,
      }}
    >
      <BreadcrumbsRoot<"nav">
        {...rest}
        class={clsx(
          "solid-breadcrumb max-w-full min-w-0 text-fg font-normal",
          local.class,
        )}
      >
        {local.children}
      </BreadcrumbsRoot>
    </BreadcrumbStyleContext.Provider>
  );
}

function BreadcrumbList(props: BreadcrumbListProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <ol
      {...rest}
      class={clsx(
        "m-0 flex max-w-full min-w-0 flex-wrap items-center gap-3 list-none p-2",
        local.class,
      )}
    >
      {local.children}
    </ol>
  );
}

function BreadcrumbItem(props: BreadcrumbItemProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <li
      {...rest}
      class={clsx("flex max-w-full min-w-0 items-center gap-3", local.class)}
    >
      {local.children}
    </li>
  );
}

function BreadcrumbLink(props: BreadcrumbLinkProps) {
  const merged = mergeProps(
    {
      current: false,
      disabled: false,
      "aria-current": undefined,
      onClick: undefined,
      class: "",
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "current",
    "disabled",
    "aria-current",
    "onClick",
    "class",
    "children",
  ]);
  const context = useBreadcrumbStyleContext();
  const disabled = () => local.disabled || context.disabled();
  const unavailable = () => disabled() || local.current;
  const handleClick: JSX.EventHandler<HTMLAnchorElement, MouseEvent> = (
    event,
  ) => {
    if (unavailable()) {
      event.preventDefault();
      return;
    }
    const handler = local.onClick;
    if (typeof handler === "function") handler(event);
    else if (handler) handler[0](handler[1], event);
  };

  return (
    <BreadcrumbsLink<"a">
      {...rest}
      current={local.current}
      disabled={disabled()}
      aria-current={
        typeof local["aria-current"] === "boolean"
          ? String(local["aria-current"])
          : local["aria-current"]
      }
      onClick={handleClick}
      class={clsx(
        "solid-breadcrumb-link inline-flex max-w-full min-w-0 items-center justify-center gap-2 break-words rounded-md no-underline transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
        variants[context.variant()],
        sizes[context.size()],
        local.current ? "font-medium" : "font-normal",
        !unavailable() && interactiveVariants[context.variant()],
        disabled()
          ? "opacity-50 cursor-not-allowed"
          : local.current
            ? "cursor-default"
            : "cursor-pointer",
        getAppearanceClasses(context.appearance(), "control", unavailable()),
        local.class,
      )}
    >
      <span class="min-w-0 break-words">{local.children}</span>
    </BreadcrumbsLink>
  );
}

function BreadcrumbSeparator(props: BreadcrumbSeparatorProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  const context = useBreadcrumbStyleContext();
  return (
    <BreadcrumbsSeparator<"span">
      {...rest}
      class={clsx(
        "shrink-0 text-fg-muted font-normal",
        separatorSizes[context.size()],
        local.class,
      )}
    >
      {local.children}
    </BreadcrumbsSeparator>
  );
}

export const Breadcrumb = Object.assign(BreadcrumbRoot, {
  Root: BreadcrumbRoot,
  List: BreadcrumbList,
  Item: BreadcrumbItem,
  Link: BreadcrumbLink,
  Separator: BreadcrumbSeparator,
});
