import { For, mergeProps, type JSX } from "solid-js";
import type { ComponentAppearance } from "@/components/appearance";

const appearances = [
  { id: "default", label: "原有外观 / Default" },
  { id: "keycap", label: "键帽 / Keycap" },
  { id: "mahjong", label: "麻将 / Mahjong" },
] as const;
const sizes = ["sm", "md", "lg"] as const;

interface AppearancePreviewProps {
  id: string;
  children: (
    appearance: ComponentAppearance,
    size: "sm" | "md" | "lg",
  ) => JSX.Element;
  description?: string;
}

/** Demo-only comparison; the rendered components retain their own semantics. */
export function AppearancePreview(props: AppearancePreviewProps) {
  const merged = mergeProps(
    {
      description:
        "新增外观与原有语义状态独立；默认保留原样。键帽使用短底座，麻将使用绿色厚底，不做位移或缩放。",
    },
    props,
  );
  return (
    <section
      id={`${merged.id}-appearances`}
      class="space-y-4"
      aria-labelledby={`${merged.id}-appearances-heading`}
    >
      <h3 id={`${merged.id}-appearances-heading`} class="text-md font-medium">
        可选立体外观
      </h3>
      <p class="text-md text-fg-muted">{merged.description}</p>
      <div class="grid gap-6 lg:grid-cols-3">
        <For each={appearances}>
          {(appearance) => (
            <div class="min-w-0 space-y-4" data-demo-appearance={appearance.id}>
              <h4 class="text-md font-medium">{appearance.label}</h4>
              <For each={sizes}>
                {(size) => (
                  <div class="min-w-0 pb-2" data-demo-size={size}>
                    {merged.children(appearance.id, size)}
                  </div>
                )}
              </For>
            </div>
          )}
        </For>
      </div>
    </section>
  );
}
