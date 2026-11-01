import {
  Root as ListboxRoot,
  Item as ListboxItem,
  ItemLabel as ListboxItemLabel,
  ItemDescription as ListboxItemDescription,
  ItemIndicator as ListboxItemIndicator,
  useListboxContext,
} from "@kobalte/core/listbox";
import {
  createMemo,
  For,
  mergeProps,
  Show,
  splitProps,
  type JSX,
} from "solid-js";
import clsx from "clsx";
import { useAppearanceDefaults } from "../../theme/appearance";
import { getAppearanceClasses, type ComponentAppearance } from "../appearance";
import { normalizeListKeys, validateListItems } from "./state";
import "./List.css";

export interface ListItem {
  /** Stable, unique and non-empty, including when items are reordered. */
  value: string;
  /** A plain text label also used by Kobalte typeahead. */
  label: string;
  description?: JSX.Element;
  icon?: JSX.Element;
  disabled?: boolean;
}

interface ListBaseProps extends Omit<
  JSX.HTMLAttributes<HTMLUListElement>,
  "children" | "onChange"
> {
  items: readonly ListItem[];
  variant?: "outline" | "plain";
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  disabled?: boolean;
  emptyContent?: JSX.Element;
}

export interface ListDisplayProps extends ListBaseProps {
  selectionMode?: "none";
  /** Interactive actions are supported only in a semantic, non-selectable list. */
  renderAction?: (item: ListItem) => JSX.Element;
  value?: never;
  defaultValue?: never;
  onValueChange?: never;
  disallowEmptySelection?: never;
}

export interface ListSelectionProps extends ListBaseProps {
  selectionMode: "single" | "multiple";
  /** An explicit empty array is a controlled empty selection. */
  value?: readonly string[];
  defaultValue?: readonly string[];
  onValueChange?: (value: string[]) => void;
  disallowEmptySelection?: boolean;
  renderAction?: never;
}

export type ListProps = ListDisplayProps | ListSelectionProps;

const variants = {
  outline: "border border-solid border-border",
  plain: "border-0",
} as const;
const sizes = {
  sm: "gap-2 px-3 py-2 text-md",
  md: "gap-3 px-4 py-3 text-md",
  lg: "gap-4 px-5 py-4 text-lg",
} as const;

export function List(props: ListProps) {
  const merged = mergeProps(
    {
      variant: "outline",
      size: "md",
      appearance: "default",
      selectionMode: "none",
      disabled: false,
      value: undefined,
      defaultValue: undefined,
      onValueChange: undefined,
      disallowEmptySelection: false,
      renderAction: undefined,
      emptyContent: "暂无项目 / No items",
      class: "",
    } as const,
    useAppearanceDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "items",
    "variant",
    "size",
    "appearance",
    "selectionMode",
    "disabled",
    "value",
    "defaultValue",
    "onValueChange",
    "disallowEmptySelection",
    "renderAction",
    "emptyContent",
    "class",
  ]);
  const items = createMemo(() => validateListItems(local.items));
  const value = createMemo(() =>
    local.value === undefined
      ? undefined
      : normalizeListKeys(local.value, items(), local.selectionMode),
  );
  const defaultValue = createMemo(() =>
    normalizeListKeys(local.defaultValue ?? [], items(), local.selectionMode),
  );
  const rootClass = () =>
    clsx(
      "m-0 w-full min-w-0 list-none space-y-2 rounded-md bg-surface p-2 text-fg font-normal",
      variants[local.variant],
      getAppearanceClasses(local.appearance, "display", local.disabled),
      local.class,
    );

  // Use the public polymorphic surface to keep DOM keyed by value, not by a
  // rebuilt collection node. Kobalte still owns all selection and focus state.
  function ListboxSurface(surfaceProps: JSX.HTMLAttributes<HTMLUListElement>) {
    const [, surfaceRest] = splitProps(surfaceProps, ["children"]);
    const context = useListboxContext();
    const keys = createMemo(() =>
      [...context.listState().collection()].map((item) => item.key),
    );
    return (
      <ul {...surfaceRest}>
        <For each={keys()}>
          {(key) => (
            <Show when={context.listState().collection().getItem(key)}>
              {(item) => {
                const rawItem = () => item().rawValue as ListItem;
                return (
                  <ListboxItem
                    item={item()}
                    class={clsx(
                      "solid-list-option flex min-w-0 items-center rounded-sm text-fg font-normal cursor-pointer select-none transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-50 aria-disabled:cursor-not-allowed",
                      sizes[local.size],
                      getAppearanceClasses(
                        local.appearance,
                        "control",
                        local.disabled || (rawItem().disabled ?? false),
                      ),
                    )}
                  >
                    <Show when={rawItem().icon !== undefined}>
                      <span aria-hidden="true" class="h-5 w-5 shrink-0">
                        {rawItem().icon}
                      </span>
                    </Show>
                    <div class="min-w-0 flex-1 space-y-1 break-words">
                      <ListboxItemLabel class="font-medium">
                        {rawItem().label}
                      </ListboxItemLabel>
                      <Show when={rawItem().description !== undefined}>
                        <ListboxItemDescription class="solid-list-description text-md text-fg-muted">
                          {rawItem().description}
                        </ListboxItemDescription>
                      </Show>
                    </div>
                    <span aria-hidden="true" class="w-4 shrink-0 text-center">
                      <ListboxItemIndicator>✓</ListboxItemIndicator>
                    </span>
                  </ListboxItem>
                );
              }}
            </Show>
          )}
        </For>
      </ul>
    );
  }

  return (
    <div class="min-w-0 space-y-3">
      <Show
        when={local.selectionMode !== "none"}
        fallback={
          <ul {...rest} class={rootClass()}>
            <For
              each={items()}
              fallback={
                <li
                  class={clsx("break-words text-fg-muted", sizes[local.size])}
                >
                  {local.emptyContent}
                </li>
              }
            >
              {(item) => (
                <li
                  data-list-key={item.value}
                  class={clsx(
                    "flex min-w-0 flex-wrap items-center",
                    sizes[local.size],
                  )}
                >
                  <Show when={item.icon !== undefined}>
                    <span aria-hidden="true" class="h-5 w-5 shrink-0">
                      {item.icon}
                    </span>
                  </Show>
                  <div
                    class={clsx(
                      "min-w-0 flex-1 space-y-1 break-words",
                      (local.disabled || item.disabled) && "opacity-50",
                    )}
                  >
                    <p class="m-0 font-medium">{item.label}</p>
                    <Show when={item.description !== undefined}>
                      <div class="text-md text-fg-muted">
                        {item.description}
                      </div>
                    </Show>
                  </div>
                  <Show when={local.renderAction}>
                    {(renderAction) => (
                      <div class="max-w-full min-w-0">
                        {renderAction()(item)}
                      </div>
                    )}
                  </Show>
                </li>
              )}
            </For>
          </ul>
        }
      >
        <ListboxRoot<ListItem, never, typeof ListboxSurface>
          {...rest}
          as={ListboxSurface}
          options={items()}
          optionValue="value"
          optionTextValue="label"
          optionDisabled={(item) => local.disabled || (item.disabled ?? false)}
          value={value()}
          defaultValue={defaultValue()}
          selectionMode={local.selectionMode}
          onChange={(keys) =>
            local.onValueChange?.(
              normalizeListKeys(keys, items(), local.selectionMode),
            )
          }
          disallowEmptySelection={local.disallowEmptySelection}
          selectionBehavior="toggle"
          selectOnFocus={local.selectionMode === "single"}
          shouldFocusWrap
          allowDuplicateSelectionEvents={false}
          aria-disabled={local.disabled || undefined}
          class={clsx(
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            rootClass(),
          )}
        />
        <Show when={items().length === 0}>
          <p role="status" class="m-0 break-words text-md text-fg-muted">
            {local.emptyContent}
          </p>
        </Show>
      </Show>
    </div>
  );
}
