import {
  Root as CollapsibleRoot,
  Trigger as CollapsibleTrigger,
  Content as CollapsibleContent,
} from "@kobalte/core/collapsible";
import {
  Root as DialogRoot,
  Trigger as DialogTrigger,
  Portal as DialogPortal,
  Overlay as DialogOverlay,
  Content as DialogContent,
  Title as DialogTitle,
  Description as DialogDescription,
  CloseButton as DialogCloseButton,
  type DialogContentOptions,
} from "@kobalte/core/dialog";
import { createDisclosureState } from "@kobalte/core";
import {
  children as resolveChildren,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  mergeProps,
  on,
  onCleanup,
  Show,
  splitProps,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js";
import { isServer } from "solid-js/web";
import clsx from "clsx";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";
import {
  useLayoutDefaults,
  type LayoutSize,
  type LayoutVariant,
} from "./layout-context";
import "./Sidebar.css";

export interface SidebarProps {
  size?: LayoutSize;
  appearance?: ComponentAppearance;
  /** Responsive uses the standard UnoCSS md breakpoint; explicit modes are useful for embedded layouts. */
  mode?: "responsive" | "desktop" | "mobile";
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** The mobile drawer is independent of desktop collapse. */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  children?: JSX.Element;
}
export interface SidebarPanelProps
  extends JSX.HTMLAttributes<HTMLElement>, DialogContentOptions {
  heading: string;
  description?: JSX.Element;
  size?: LayoutSize;
  appearance?: ComponentAppearance;
  variant?: LayoutVariant;
}
export interface SidebarTriggerProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  type?: "button" | "submit" | "reset";
  variant?: "outline" | "ghost";
}
export interface SidebarToggleProps extends SidebarTriggerProps {
  "aria-label": string;
}
export interface SidebarCloseButtonProps extends SidebarTriggerProps {
  "aria-label": string;
}

interface SidebarContextValue {
  size: Accessor<LayoutSize>;
  appearance: Accessor<ComponentAppearance>;
  desktop: Accessor<boolean>;
  collapsed: Accessor<boolean>;
  disabled: Accessor<boolean>;
}
const SidebarContext = createContext<SidebarContextValue>();
function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("Sidebar parts must be used within Sidebar.");
  return context;
}

// Structural breakpoint only: keep this aligned with UnoCSS's default md.
const desktopQuery = "(min-width: 768px)";
function createDesktopMedia() {
  if (isServer) return () => true;
  const media = window.matchMedia(desktopQuery);
  const [matches, setMatches] = createSignal(media.matches);
  const update = () => setMatches(media.matches);
  media.addEventListener("change", update);
  onCleanup(() => media.removeEventListener("change", update));
  return matches;
}

const widths = { sm: "w-48", md: "w-56", lg: "w-64" } as const;
const collapsedWidths = { sm: "w-14", md: "w-16", lg: "w-20" } as const;
const drawerWidths = { sm: "w-56", md: "w-64", lg: "w-72" } as const;
const padding = {
  sm: "p-3 text-md",
  md: "p-4 text-md",
  lg: "p-6 text-lg",
} as const;
const titleSizes = { sm: "text-md", md: "text-lg", lg: "text-xl" } as const;
const triggerSizes = {
  sm: "h-8 px-3 text-md",
  md: "h-10 px-3 text-md",
  lg: "h-12 px-4 text-lg",
} as const;
const iconSizes = {
  sm: "h-8 w-8 text-md",
  md: "h-10 w-10 text-md",
  lg: "h-12 w-12 text-lg",
} as const;
const variants = {
  plain: "",
  outline: "rounded-md border border-solid border-border",
} as const;
const buttonVariants = {
  outline:
    "border border-solid border-border bg-surface text-fg enabled:hover:not-active:border-primary enabled:hover:not-active:bg-surface-hover enabled:active:border-primary-active enabled:active:bg-surface-active",
  ghost:
    "border-0 bg-surface text-fg enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active",
} as const;
const buttonBase =
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md font-medium cursor-pointer select-none transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed";

function SidebarRoot(props: SidebarProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      mode: "responsive",
      collapsed: undefined,
      defaultCollapsed: false,
      onCollapsedChange: undefined,
      open: undefined,
      defaultOpen: false,
      onOpenChange: undefined,
      disabled: false,
      children: undefined,
    } as const,
    useLayoutDefaults(),
    props,
  );
  const media = createDesktopMedia();
  const desktop = createMemo(
    () =>
      merged.mode === "desktop" || (merged.mode === "responsive" && media()),
  );
  const expanded = createDisclosureState({
    open: () =>
      merged.collapsed === undefined ? undefined : !merged.collapsed,
    defaultOpen: () => !merged.defaultCollapsed,
    onOpenChange: (open) => merged.onCollapsedChange?.(!open),
  });
  const drawer = createDisclosureState({
    open: () => merged.open,
    defaultOpen: () => merged.defaultOpen,
    onOpenChange: (open) => merged.onOpenChange?.(open),
  });
  createEffect(
    on(
      desktop,
      (next, previous) => {
        if (next && previous === false) drawer.close();
      },
      { defer: true },
    ),
  );
  return (
    <SidebarContext.Provider
      value={{
        size: () => merged.size,
        appearance: () => merged.appearance,
        desktop,
        collapsed: () => !expanded.isOpen(),
        disabled: () => merged.disabled,
      }}
    >
      <DialogRoot
        open={!desktop() && drawer.isOpen()}
        onOpenChange={drawer.setIsOpen}
        modal
      >
        <CollapsibleRoot
          class="contents"
          open={expanded.isOpen()}
          onOpenChange={expanded.setIsOpen}
          disabled={merged.disabled}
          forceMount
        >
          {merged.children}
        </CollapsibleRoot>
      </DialogRoot>
    </SidebarContext.Provider>
  );
}

function SidebarTrigger(props: SidebarTriggerProps) {
  const merged = mergeProps(
    {
      variant: "outline",
      type: "button",
      disabled: false,
      class: "",
      children: "目录",
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "disabled",
    "class",
    "children",
  ]);
  const context = useSidebarContext();
  const disabled = () => local.disabled || context.disabled();
  return (
    <Show when={!context.desktop()}>
      <DialogTrigger<"button">
        {...rest}
        disabled={disabled()}
        class={clsx(
          buttonBase,
          buttonVariants[local.variant],
          triggerSizes[context.size()],
          getAppearanceClasses(context.appearance(), "native", disabled()),
          local.class,
        )}
      >
        {local.children}
      </DialogTrigger>
    </Show>
  );
}

function SidebarToggle(props: SidebarToggleProps) {
  const merged = mergeProps(
    {
      variant: "ghost",
      type: "button",
      disabled: false,
      class: "",
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "disabled",
    "class",
    "children",
  ]);
  const context = useSidebarContext();
  const disabled = () => local.disabled || context.disabled();
  return (
    <Show when={context.desktop()}>
      <CollapsibleTrigger<"button">
        {...rest}
        disabled={disabled()}
        class={clsx(
          buttonBase,
          buttonVariants[local.variant],
          iconSizes[context.size()],
          getAppearanceClasses(context.appearance(), "native", disabled()),
          local.class,
        )}
      >
        <Show
          when={local.children !== undefined}
          fallback={
            <span aria-hidden="true">{context.collapsed() ? "›" : "‹"}</span>
          }
        >
          {local.children}
        </Show>
      </CollapsibleTrigger>
    </Show>
  );
}

function SidebarCloseButton(props: SidebarCloseButtonProps) {
  const merged = mergeProps(
    {
      variant: "ghost",
      type: "button",
      disabled: false,
      class: "",
      children: "×",
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "disabled",
    "class",
    "children",
  ]);
  const context = useSidebarContext();
  return (
    <DialogCloseButton<"button">
      {...rest}
      disabled={local.disabled}
      class={clsx(
        buttonBase,
        buttonVariants[local.variant],
        iconSizes[context.size()],
        getAppearanceClasses(context.appearance(), "native", local.disabled),
        local.class,
      )}
    >
      {local.children}
    </DialogCloseButton>
  );
}

/** Resolve the navigation once so collapse, drawer closure and breakpoint changes preserve its nodes. */
function SidebarPanel(props: SidebarPanelProps) {
  const context = useSidebarContext();
  const merged = mergeProps(
    {
      id: "sidebar-" + createUniqueId(),
      description: undefined,
      variant: "outline",
      class: "",
      children: undefined,
    } as const,
    {
      get size() {
        return context.size();
      },
      get appearance() {
        return context.appearance();
      },
    },
    props,
  );
  const [local, rest] = splitProps(merged, [
    "id",
    "heading",
    "description",
    "variant",
    "size",
    "appearance",
    "class",
    "children",
  ]);
  const contents = resolveChildren(() => local.children);
  const panelClasses = () =>
    clsx(
      "flex min-h-0 min-w-0 shrink-0 flex-col gap-3 bg-surface text-fg font-normal",
      variants[local.variant],
      getAppearanceClasses(local.appearance, "display", context.disabled()),
    );
  return (
    <Show
      when={context.desktop()}
      fallback={
        <DialogPortal>
          <DialogOverlay class="fixed inset-0 z-40 bg-bg opacity-80" />
          <div class="pointer-events-none fixed inset-0 z-50 flex p-2">
            <DialogContent<"aside">
              as="aside"
              {...rest}
              id={local.id}
              data-sidebar-mode="mobile"
              class={clsx(
                panelClasses(),
                "pointer-events-auto max-h-full max-w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                drawerWidths[local.size],
                padding[local.size],
                local.class,
              )}
            >
              <div class="flex shrink-0 items-center justify-between gap-3">
                <DialogTitle
                  as="h2"
                  class={clsx(
                    "min-w-0 break-words font-medium",
                    titleSizes[local.size],
                  )}
                >
                  {local.heading}
                </DialogTitle>
                <SidebarCloseButton aria-label="关闭侧栏" />
              </div>
              <Show
                when={
                  local.description !== undefined &&
                  local.description !== null &&
                  local.description !== false &&
                  local.description !== ""
                }
              >
                <DialogDescription
                  as="p"
                  class="shrink-0 text-md text-fg-muted"
                >
                  {local.description}
                </DialogDescription>
              </Show>
              <div class="min-h-0 min-w-0 flex-1 overflow-y-auto p-2">
                {contents()}
              </div>
            </DialogContent>
          </div>
        </DialogPortal>
      }
    >
      <aside
        aria-label={local.heading}
        {...rest}
        id={local.id}
        data-sidebar-mode="desktop"
        data-collapsed={context.collapsed() ? "" : undefined}
        class={clsx(
          panelClasses(),
          context.collapsed()
            ? clsx(collapsedWidths[local.size], "p-2 text-md")
            : clsx(widths[local.size], padding[local.size]),
          local.class,
        )}
      >
        <div
          class={clsx(
            "flex shrink-0 items-center gap-3",
            context.collapsed() ? "justify-center" : "justify-between",
          )}
        >
          <Show when={!context.collapsed()}>
            <h2
              class={clsx(
                "min-w-0 break-words font-medium",
                titleSizes[local.size],
              )}
            >
              {local.heading}
            </h2>
          </Show>
          <SidebarToggle
            aria-label={context.collapsed() ? "展开侧栏" : "折叠侧栏"}
          />
        </div>
        <CollapsibleContent
          id={local.id + "-body"}
          class="solid-sidebar-body min-h-0 min-w-0 flex-1 overflow-y-auto p-2"
        >
          <Show
            when={
              local.description !== undefined &&
              local.description !== null &&
              local.description !== false &&
              local.description !== ""
            }
          >
            <p class="mb-3 text-md text-fg-muted">{local.description}</p>
          </Show>
          {contents()}
        </CollapsibleContent>
      </aside>
    </Show>
  );
}

export const Sidebar = Object.assign(SidebarRoot, {
  Root: SidebarRoot,
  Trigger: SidebarTrigger,
  Toggle: SidebarToggle,
  Panel: SidebarPanel,
  CloseButton: SidebarCloseButton,
});
