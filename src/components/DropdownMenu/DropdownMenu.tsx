import * as MenuPrimitive from "@kobalte/core/dropdown-menu";
import {
  createContext,
  createMemo,
  mergeProps,
  splitProps,
  useContext,
  type Accessor,
  type JSX,
} from "solid-js";
import clsx from "clsx";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";
import "./DropdownMenu.css";

export interface DropdownMenuProps extends MenuPrimitive.DropdownMenuRootProps {
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
}
export interface DropdownMenuTriggerProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "type"
> {
  type?: "button" | "submit" | "reset";
  variant?: "outline" | "ghost";
}
export interface DropdownMenuContentProps
  extends
    JSX.HTMLAttributes<HTMLDivElement>,
    MenuPrimitive.DropdownMenuContentOptions {
  /** This Kobalte version ignores Escape preventDefault; reject the close request via controlled open instead. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}
export interface DropdownMenuSubContentProps
  extends
    JSX.HTMLAttributes<HTMLDivElement>,
    MenuPrimitive.DropdownMenuSubContentOptions {
  /** This Kobalte version ignores Escape preventDefault; reject the close request via controlled open instead. */
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}
export interface DropdownMenuItemProps
  extends
    Omit<JSX.HTMLAttributes<HTMLDivElement>, "onSelect">,
    MenuPrimitive.DropdownMenuItemOptions {
  variant?: "default" | "danger";
}
export interface DropdownMenuCheckboxItemProps extends Omit<
  DropdownMenuItemProps,
  "onChange"
> {
  checked?: boolean;
  defaultChecked?: boolean;
  /** Presentational only; compose ItemIndicator forceMount with a minus marker as in the demo. */
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}
export interface DropdownMenuRadioGroupProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
}
export interface DropdownMenuRadioItemProps extends DropdownMenuItemProps {
  value: string;
}
export interface DropdownMenuSubTriggerProps
  extends
    JSX.HTMLAttributes<HTMLDivElement>,
    MenuPrimitive.DropdownMenuSubTriggerOptions {}
export type DropdownMenuGroupLabelProps = JSX.HTMLAttributes<HTMLSpanElement>;
export type DropdownMenuItemLabelProps = JSX.HTMLAttributes<HTMLSpanElement>;
export type DropdownMenuItemDescriptionProps =
  JSX.HTMLAttributes<HTMLDivElement>;
export interface DropdownMenuItemIndicatorProps extends JSX.HTMLAttributes<HTMLSpanElement> {
  forceMount?: boolean;
}
export type DropdownMenuSeparatorProps = Omit<
  JSX.HTMLAttributes<HTMLHRElement>,
  "children"
>;

interface MenuStyleContextValue {
  size: Accessor<"sm" | "md" | "lg">;
  appearance: Accessor<ComponentAppearance>;
}
const MenuStyleContext = createContext<MenuStyleContextValue>();
const RadioDisabledContext = createContext<Accessor<boolean>>();
function useMenuStyleContext() {
  const context = useContext(MenuStyleContext);
  if (!context)
    throw new Error("DropdownMenu parts must be used within DropdownMenu.");
  return context;
}
const triggerVariants = {
  outline:
    "border border-solid border-border bg-surface text-fg enabled:hover:not-active:border-primary enabled:hover:not-active:bg-surface-hover enabled:active:border-primary-active enabled:active:bg-surface-active",
  ghost:
    "border-0 bg-surface text-fg enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active",
} as const;
const triggerSizes = {
  sm: "h-8 px-3 text-md",
  md: "h-10 px-4 text-md",
  lg: "h-12 px-5 text-lg",
} as const;
const itemSizes = {
  sm: "min-h-8 px-3 text-md",
  md: "min-h-10 px-3 text-md",
  lg: "min-h-12 px-4 text-lg",
} as const;
const contentSizes = { sm: "w-52", md: "w-64", lg: "w-72" } as const;
const itemVariants = { default: "text-fg", danger: "text-danger" } as const;
const itemBase =
  "solid-dropdown-menu-item flex min-w-0 items-center justify-between gap-3 rounded-sm py-1 font-normal cursor-pointer select-none transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-50 aria-disabled:cursor-not-allowed";
const contentBase =
  "min-w-0 space-y-1 overflow-y-auto break-words rounded-md border border-solid border-border bg-surface p-1 text-md text-fg font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
function contentStyle(
  style: JSX.CSSProperties | string | undefined,
): JSX.CSSProperties | string {
  return typeof style === "string"
    ? `max-width: var(--kb-popper-content-available-width); max-height: var(--kb-popper-content-available-height); ${style}`
    : {
        "max-width": "var(--kb-popper-content-available-width)",
        "max-height": "var(--kb-popper-content-available-height)",
        ...style,
      };
}
function contentClasses(
  context: MenuStyleContextValue,
  external: string | undefined,
) {
  return clsx(
    contentBase,
    contentSizes[context.size()],
    context.appearance() === "default" && "shadow-md",
    getAppearanceClasses(context.appearance()),
    external,
  );
}

function DropdownMenuRoot(props: DropdownMenuProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      modal: true,
      fitViewport: true,
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["size", "appearance", "children"]);
  return (
    <MenuStyleContext.Provider
      value={{ size: () => local.size, appearance: () => local.appearance }}
    >
      <MenuPrimitive.Root {...rest}>{local.children}</MenuPrimitive.Root>
    </MenuStyleContext.Provider>
  );
}
function DropdownMenuTrigger(props: DropdownMenuTriggerProps) {
  const merged = mergeProps(
    {
      variant: "outline",
      disabled: false,
      type: "button",
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
  const context = useMenuStyleContext();
  return (
    <MenuPrimitive.Trigger<"button">
      {...rest}
      disabled={local.disabled}
      class={clsx(
        "inline-flex min-w-0 items-center justify-center gap-2 rounded-md font-medium cursor-pointer select-none transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
        triggerVariants[local.variant],
        triggerSizes[context.size()],
        getAppearanceClasses(context.appearance(), "native", local.disabled),
        local.class,
      )}
    >
      {local.children}
    </MenuPrimitive.Trigger>
  );
}
function DropdownMenuContent(props: DropdownMenuContentProps) {
  const merged = mergeProps(
    { class: "", children: undefined, style: undefined } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["class", "children", "style"]);
  const context = useMenuStyleContext();
  return (
    <MenuPrimitive.Content<"div">
      {...rest}
      class={contentClasses(context, local.class)}
      style={contentStyle(local.style)}
    >
      {local.children}
    </MenuPrimitive.Content>
  );
}
function DropdownMenuSubContent(props: DropdownMenuSubContentProps) {
  const merged = mergeProps(
    { class: "", children: undefined, style: undefined } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["class", "children", "style"]);
  const context = useMenuStyleContext();
  return (
    <MenuPrimitive.SubContent<"div">
      {...rest}
      class={contentClasses(context, local.class)}
      style={contentStyle(local.style)}
    >
      {local.children}
    </MenuPrimitive.SubContent>
  );
}
function DropdownMenuItem(props: DropdownMenuItemProps) {
  const merged = mergeProps(
    {
      variant: "default",
      disabled: false,
      closeOnSelect: true,
      class: "",
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["variant", "class", "children"]);
  const context = useMenuStyleContext();
  return (
    <MenuPrimitive.Item<"div">
      {...rest}
      class={clsx(
        itemBase,
        itemVariants[local.variant],
        itemSizes[context.size()],
        local.class,
      )}
    >
      {local.children}
    </MenuPrimitive.Item>
  );
}
function DropdownMenuCheckboxItem(props: DropdownMenuCheckboxItemProps) {
  const merged = mergeProps(
    {
      variant: "default",
      disabled: false,
      closeOnSelect: false,
      checked: undefined,
      defaultChecked: false,
      indeterminate: false,
      onCheckedChange: undefined,
      class: "",
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "variant",
    "onCheckedChange",
    "class",
    "children",
  ]);
  const context = useMenuStyleContext();
  return (
    <MenuPrimitive.CheckboxItem<"div">
      {...rest}
      onChange={local.onCheckedChange}
      class={clsx(
        itemBase,
        itemVariants[local.variant],
        itemSizes[context.size()],
        local.class,
      )}
    >
      {local.children}
    </MenuPrimitive.CheckboxItem>
  );
}
function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps) {
  const merged = mergeProps(
    {
      value: undefined,
      defaultValue: undefined,
      onValueChange: undefined,
      disabled: false,
      class: "",
      children: undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "onValueChange",
    "disabled",
    "class",
    "children",
  ]);
  const disabled = createMemo(() => local.disabled);
  return (
    <RadioDisabledContext.Provider value={disabled}>
      <MenuPrimitive.RadioGroup<string, "div">
        {...rest}
        disabled={local.disabled}
        onChange={local.onValueChange}
        class={clsx("space-y-1", local.class)}
      >
        {local.children}
      </MenuPrimitive.RadioGroup>
    </RadioDisabledContext.Provider>
  );
}
function DropdownMenuRadioItem(props: DropdownMenuRadioItemProps) {
  const merged = mergeProps(
    {
      variant: "default",
      disabled: false,
      closeOnSelect: false,
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
  const context = useMenuStyleContext();
  const groupDisabled = useContext(RadioDisabledContext);
  return (
    <MenuPrimitive.RadioItem<string, "div">
      {...rest}
      disabled={local.disabled || groupDisabled?.()}
      class={clsx(
        itemBase,
        itemVariants[local.variant],
        itemSizes[context.size()],
        local.class,
      )}
    >
      {local.children}
    </MenuPrimitive.RadioItem>
  );
}
function DropdownMenuSubTrigger(props: DropdownMenuSubTriggerProps) {
  const merged = mergeProps(
    { disabled: false, class: "", children: undefined } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["class", "children"]);
  const context = useMenuStyleContext();
  return (
    <MenuPrimitive.SubTrigger<"div">
      {...rest}
      class={clsx(itemBase, "text-fg", itemSizes[context.size()], local.class)}
    >
      {local.children}
    </MenuPrimitive.SubTrigger>
  );
}
function DropdownMenuGroupLabel(props: DropdownMenuGroupLabelProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <MenuPrimitive.GroupLabel<"span">
      {...rest}
      class={clsx(
        "block min-w-0 break-words px-3 py-2 text-md text-fg-muted font-medium",
        local.class,
      )}
    >
      {local.children}
    </MenuPrimitive.GroupLabel>
  );
}
function DropdownMenuItemLabel(props: DropdownMenuItemLabelProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <MenuPrimitive.ItemLabel<"span">
      {...rest}
      as="span"
      class={clsx("min-w-0 break-words", local.class)}
    >
      {local.children}
    </MenuPrimitive.ItemLabel>
  );
}
function DropdownMenuItemDescription(props: DropdownMenuItemDescriptionProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <MenuPrimitive.ItemDescription<"div">
      {...rest}
      class={clsx("min-w-0 break-words text-md text-fg-muted", local.class)}
    >
      {local.children}
    </MenuPrimitive.ItemDescription>
  );
}
function DropdownMenuItemIndicator(props: DropdownMenuItemIndicatorProps) {
  const merged = mergeProps(
    {
      forceMount: false,
      class: "",
      children: "✓",
      "aria-hidden": true,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <MenuPrimitive.ItemIndicator<"span">
      {...rest}
      as="span"
      class={clsx("w-4 shrink-0 text-center text-md text-primary", local.class)}
    >
      {local.children}
    </MenuPrimitive.ItemIndicator>
  );
}
function DropdownMenuSeparator(props: DropdownMenuSeparatorProps) {
  const merged = mergeProps({ class: "", children: undefined } as const, props);
  const [local, rest] = splitProps(merged, ["class", "children"]);
  return (
    <MenuPrimitive.Separator<"hr">
      {...rest}
      class={clsx(
        "m-0 border-0 border-t border-solid border-border",
        local.class,
      )}
    >
      {local.children}
    </MenuPrimitive.Separator>
  );
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Root: DropdownMenuRoot,
  Trigger: DropdownMenuTrigger,
  Portal: MenuPrimitive.Portal,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  CheckboxItem: DropdownMenuCheckboxItem,
  RadioGroup: DropdownMenuRadioGroup,
  RadioItem: DropdownMenuRadioItem,
  Group: MenuPrimitive.Group,
  GroupLabel: DropdownMenuGroupLabel,
  ItemLabel: DropdownMenuItemLabel,
  ItemDescription: DropdownMenuItemDescription,
  ItemIndicator: DropdownMenuItemIndicator,
  Separator: DropdownMenuSeparator,
  Sub: MenuPrimitive.Sub,
  SubTrigger: DropdownMenuSubTrigger,
  SubContent: DropdownMenuSubContent,
});
