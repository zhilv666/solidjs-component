import {
  Content as SelectContent,
  HiddenSelect as SelectHiddenSelect,
  Icon as SelectIcon,
  Item as SelectItem,
  ItemIndicator as SelectItemIndicator,
  ItemLabel as SelectItemLabel,
  Label as SelectLabel,
  Listbox as SelectListbox,
  Portal as SelectPortal,
  Root as SelectRoot,
  Trigger as SelectTrigger,
  Value as SelectValue,
  useSelectContext,
} from "@kobalte/core/select";
import {
  createEffect,
  createMemo,
  createSignal,
  mergeProps,
  Show,
  splitProps,
  type JSX,
} from "solid-js";
import clsx from "clsx";
import "./Select.css";

export interface SelectOption {
  /** Values must be unique and non-empty; an empty selection uses null. */
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  JSX.ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "value" | "onInput" | "onChange"
> {
  options: readonly SelectOption[];
  size?: "sm" | "md" | "lg";
  value?: string | null;
  defaultValue?: string;
  placeholder?: string;
  invalid?: boolean;
  required?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onValueChange?: (value: string | null) => void;
  /** Native input/change events originate from Kobalte's hidden select. */
  onInput?: JSX.SelectHTMLAttributes<HTMLSelectElement>["onInput"];
  onChange?: JSX.SelectHTMLAttributes<HTMLSelectElement>["onChange"];
  nativeRef?: (element: HTMLSelectElement) => void;
  /** Optional visible label; native button attributes and class style the trigger. */
  children?: JSX.Element;
}

const sizes = {
  sm: "h-8 px-3 text-md",
  md: "h-10 px-3 text-md",
  lg: "h-12 px-4 text-lg",
} as const;
const itemSizes = {
  sm: "min-h-8 px-3 text-md",
  md: "min-h-10 px-3 text-md",
  lg: "min-h-12 px-4 text-lg",
} as const;
const states = {
  valid:
    "border-border enabled:hover:not-active:border-primary enabled:active:border-primary-active",
  invalid:
    "border-danger enabled:hover:not-active:border-danger-hover enabled:active:border-danger-active",
} as const;

interface NativeSelectProps {
  value: string | null | undefined;
  defaultValue: string | undefined;
  form: string | undefined;
  nativeRef: SelectProps["nativeRef"];
  onInput: SelectProps["onInput"];
  onChange: SelectProps["onChange"];
}

function NativeSelect(props: NativeSelectProps) {
  const context = useSelectContext();
  const [element, setElement] = createSignal<HTMLSelectElement>();

  // Mirror native defaults and the mobile focus proxy, not selection or focus logic.
  // Kobalte's empty required proxy otherwise blocks even a selected field.
  createEffect(() => {
    const select = element();
    const key = context.listState().selectionManager().firstSelectedKey() ?? "";
    const defaultKey =
      props.value === undefined
        ? (props.defaultValue ?? "")
        : (props.value ?? "");
    const collection = context.listState().collection();
    const form = props.form;
    if (!select) return;
    for (const option of select.options) {
      option.defaultSelected = option.value === defaultKey;
      option.disabled = collection.getItem(option.value)?.disabled ?? false;
    }
    select.value = key;
    const proxy = select.previousElementSibling;
    if (proxy instanceof HTMLInputElement) {
      proxy.defaultValue = defaultKey;
      proxy.value = key;
      if (form) proxy.setAttribute("form", form);
      else proxy.removeAttribute("form");
    }
  });

  return (
    <SelectHiddenSelect
      ref={(select) => {
        setElement(select);
        const ref = props.nativeRef;
        if (typeof ref === "function") ref(select);
      }}
      form={props.form}
      size={1}
      onInput={props.onInput}
      onChange={props.onChange}
    />
  );
}

export function Select(props: SelectProps) {
  const merged = mergeProps(
    {
      size: "md",
      value: undefined,
      defaultValue: undefined,
      placeholder: "请选择 / Select an option",
      invalid: false,
      disabled: false,
      required: false,
      name: "",
      form: undefined,
      open: undefined,
      defaultOpen: false,
      onOpenChange: undefined,
      onValueChange: undefined,
      onInput: undefined,
      onChange: undefined,
      nativeRef: undefined,
      class: "",
      children: undefined,
      "aria-invalid": undefined,
    } as const,
    props,
  );
  const [local, rest] = splitProps(merged, [
    "options",
    "size",
    "value",
    "defaultValue",
    "placeholder",
    "invalid",
    "disabled",
    "required",
    "name",
    "form",
    "open",
    "defaultOpen",
    "onOpenChange",
    "onValueChange",
    "onInput",
    "onChange",
    "nativeRef",
    "class",
    "children",
    "aria-invalid",
  ]);
  const options = createMemo(() => [...local.options]);
  const selectedOption = createMemo(() =>
    local.value === undefined
      ? undefined
      : (options().find((option) => option.value === local.value) ?? null),
  );
  const defaultOption = createMemo(() =>
    options().find((option) => option.value === local.defaultValue),
  );
  // Event history only: Kobalte remains the source of selection state.
  let previousUncontrolledValue: string | null = local.defaultValue ?? null;
  const handleChange = (option: SelectOption | null) => {
    const next = option?.value ?? null;
    const previous =
      local.value === undefined ? previousUncontrolledValue : local.value;
    previousUncontrolledValue = next;
    if (next !== previous) local.onValueChange?.(next);
  };

  return (
    <SelectRoot<SelectOption>
      options={options()}
      optionValue="value"
      optionTextValue="label"
      optionDisabled="disabled"
      value={selectedOption()}
      defaultValue={defaultOption()}
      onChange={handleChange}
      placeholder={local.placeholder}
      disabled={local.disabled}
      required={local.required}
      name={local.name}
      validationState={local.invalid ? "invalid" : "valid"}
      open={local.open}
      defaultOpen={local.defaultOpen}
      onOpenChange={local.onOpenChange}
      disallowEmptySelection
      sameWidth
      fitViewport
      class="w-full min-w-0 space-y-2"
      itemComponent={(itemProps) => (
        <SelectItem
          item={itemProps.item}
          class={clsx(
            "solid-select-option flex min-w-0 items-center justify-between gap-2 rounded-sm py-1 font-normal transition-colors duration-token focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring aria-disabled:opacity-50 aria-disabled:cursor-not-allowed",
            itemSizes[local.size],
          )}
        >
          <SelectItemLabel class="min-w-0 break-words">
            {itemProps.item.rawValue.label}
          </SelectItemLabel>
          <span class="w-4 shrink-0 text-center" aria-hidden="true">
            <SelectItemIndicator>✓</SelectItemIndicator>
          </span>
        </SelectItem>
      )}
    >
      <Show
        when={
          local.children !== undefined &&
          local.children !== null &&
          local.children !== false
        }
      >
        <SelectLabel class="block text-md text-fg font-normal">
          {local.children}
        </SelectLabel>
      </Show>
      <SelectTrigger<"button">
        {...rest}
        form={local.form}
        type="button"
        aria-invalid={local.invalid || local["aria-invalid"]}
        class={clsx(
          "inline-flex w-full min-w-0 items-center justify-between gap-2 rounded-md border border-solid bg-bg text-fg font-normal text-left transition-colors duration-token enabled:hover:not-active:bg-surface-hover enabled:active:bg-surface-active focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:cursor-not-allowed",
          states[local.invalid ? "invalid" : "valid"],
          sizes[local.size],
          local.class,
        )}
      >
        <SelectValue<SelectOption> class="min-w-0 truncate">
          {(state) => state.selectedOption()?.label}
        </SelectValue>
        <SelectIcon class="w-4 shrink-0 text-center">⌄</SelectIcon>
      </SelectTrigger>
      <NativeSelect
        value={local.value}
        defaultValue={local.defaultValue}
        form={local.form}
        nativeRef={local.nativeRef}
        onInput={local.onInput}
        onChange={local.onChange}
      />
      <SelectPortal>
        <SelectContent
          class="min-w-0 overflow-y-auto rounded-md border border-solid border-border bg-surface text-fg shadow-md"
          style={{
            width: "var(--kb-popper-anchor-width)",
            "max-width": "var(--kb-popper-content-available-width)",
            "max-height": "var(--kb-popper-content-available-height)",
          }}
        >
          <SelectListbox<SelectOption> class="m-0 max-h-60 list-none space-y-1 overflow-y-auto p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </SelectContent>
      </SelectPortal>
    </SelectRoot>
  );
}
