import { Root as RadioGroupRoot } from "@kobalte/core/radio-group";
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
import type { ComponentAppearance } from "../appearance";

export interface RadioGroupProps extends Omit<
  JSX.HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  size?: "sm" | "md" | "lg";
  appearance?: ComponentAppearance;
  orientation?: "horizontal" | "vertical";
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  invalid?: boolean;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}

interface RadioStyleContextValue {
  size: Accessor<"sm" | "md" | "lg">;
  appearance: Accessor<ComponentAppearance>;
  invalid: Accessor<boolean>;
  disabled: Accessor<boolean>;
  readOnly: Accessor<boolean>;
  nativeDefault: Accessor<string | undefined>;
}

const RadioStyleContext = createContext<RadioStyleContextValue>();

export function useRadioStyleContext() {
  const context = useContext(RadioStyleContext);
  if (!context) throw new Error("Radio must be used within RadioGroup.");
  return context;
}

const orientations = {
  vertical: "flex-col items-start gap-2",
  horizontal: "flex-row flex-wrap items-center gap-x-6 gap-y-2",
} as const;

export function RadioGroup(props: RadioGroupProps) {
  const merged = mergeProps(
    {
      size: "md",
      appearance: "default",
      orientation: "vertical",
      value: undefined,
      defaultValue: undefined,
      onValueChange: undefined,
      name: undefined,
      invalid: false,
      required: false,
      disabled: false,
      readOnly: false,
      class: "",
      children: undefined,
      "aria-invalid": undefined,
    } as const,
    useAppearanceDefaults(),
    props,
  );
  const [local, rest] = splitProps(merged, [
    "size",
    "appearance",
    "orientation",
    "value",
    "defaultValue",
    "onValueChange",
    "name",
    "invalid",
    "required",
    "disabled",
    "readOnly",
    "class",
    "children",
    "aria-invalid",
  ]);

  return (
    <RadioStyleContext.Provider
      value={{
        size: () => local.size,
        appearance: () => local.appearance,
        invalid: () => local.invalid,
        disabled: () => local.disabled,
        readOnly: () => local.readOnly,
        nativeDefault: () => local.value ?? local.defaultValue,
      }}
    >
      <RadioGroupRoot
        {...rest}
        value={local.value}
        defaultValue={local.defaultValue}
        onChange={local.onValueChange}
        orientation={local.orientation}
        name={local.name}
        validationState={local.invalid ? "invalid" : "valid"}
        required={local.required}
        disabled={local.disabled}
        readOnly={local.readOnly}
        aria-invalid={local.invalid || local["aria-invalid"]}
        class={clsx(
          "flex min-w-0 text-fg font-normal",
          orientations[local.orientation],
          local.class,
        )}
      >
        {local.children}
      </RadioGroupRoot>
    </RadioStyleContext.Provider>
  );
}
