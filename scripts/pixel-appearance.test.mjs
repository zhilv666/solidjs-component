import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { tokens } from "../src/theme/tokens.ts";
import { generateThemeCss } from "../src/theme/generate.ts";
import { getAppearanceClasses } from "../src/components/appearance.ts";
import {
  APPEARANCE_STORAGE_KEY,
  applyAppearance,
  getPreferredAppearance,
  isComponentAppearance,
} from "../src/theme/appearance-mode.ts";
import { THEME_STORAGE_KEY, applyTheme } from "../src/theme/mode.ts";
import {
  PALETTE_STORAGE_KEY,
  applyPalette,
} from "../src/theme/palette-mode.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness,
  components,
  AppearanceProvider,
  AppearancePreview,
  ThemeDemo,
  LayoutDemo,
  App;
const names = [
  "Alert",
  "Avatar",
  "Badge",
  "Card",
  "Checkbox",
  "Dialog",
  "Divider",
  "DropdownMenu",
  "FormField",
  "Input",
  "Popover",
  "RadioGroup",
  "Select",
  "Skeleton",
  "Spinner",
  "Switch",
  "Tag",
  "Textarea",
  "Tooltip",
  "Toast",
  "Tabs",
  "List",
  "Pagination",
  "Table",
  "Layout",
  "Header",
  "Content",
  "Footer",
  "Sidebar",
];
before(async () => {
  harness = await createComponentHarness("pixel-appearance");
  components = await harness.load("/src/components/index.ts");
  ({ AppearanceProvider } = await harness.load("/src/theme/appearance.tsx"));
  ({ AppearancePreview } = await harness.load(
    "/src/demo/AppearancePreview.tsx",
  ));
  ({ ThemeDemo } = await harness.load("/src/demo/Theme.demo.tsx"));
  ({ LayoutDemo } = await harness.load(
    "/src/components/Layout/Layout.demo.tsx",
  ));
  ({ default: App } = await harness.load("/src/App.tsx"));
});
after(async () => await harness?.close());

const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );
function fixture(name, props = {}) {
  const component = components[name];
  switch (name) {
    case "Select":
      return component({
        options: [{ value: "a", label: "Alpha" }],
        "aria-label": "Audit",
        ...props,
      });
    case "Avatar":
      return component({ alt: "Audit", fallback: "A", ...props });
    case "FormField":
      return component({ label: "Audit", children: () => "Control", ...props });
    case "RadioGroup":
      return component({
        ...props,
        get children() {
          return components.Radio({ value: "a", children: "Audit" });
        },
      });
    case "Tooltip":
    case "Popover":
    case "Dialog":
    case "DropdownMenu":
      return component({
        ...props,
        get children() {
          return component.Trigger({ children: "Audit" });
        },
      });
    case "Toast":
      return component.Region({
        get children() {
          return component({
            toastId: -1,
            persistent: true,
            ...props,
            get children() {
              return [
                component.Title({ children: "Audit" }),
                component.CloseButton({ "aria-label": "Close audit" }),
              ];
            },
          });
        },
      });
    case "Tabs":
      return component({
        defaultValue: "a",
        ...props,
        get children() {
          return [
            component.List({
              get children() {
                return component.Trigger({ value: "a", children: "Audit" });
              },
            }),
            component.Content({ value: "a", children: "Panel" }),
          ];
        },
      });
    case "List":
      return component({
        items: [{ value: "a", label: "Alpha" }],
        selectionMode: "multiple",
        "aria-label": "Audit",
        ...props,
      });
    case "Pagination":
      return component({ count: 3, defaultPage: 2, ...props });
    case "Table":
      return component({
        data: [{ id: "a", score: 1 }],
        columns: [
          {
            key: "score",
            header: "Score",
            cell: (row) => row.score,
            sortValue: (row) => row.score,
          },
        ],
        getRowKey: (row) => row.id,
        caption: "Audit",
        selectable: true,
        paginate: true,
        ...props,
      });
    case "Layout":
      return component({
        ...props,
        get children() {
          return [
            components.Header({ children: "Header" }),
            components.Content({ as: "section", children: "Content" }),
            components.Footer({ children: "Footer" }),
          ];
        },
      });
    case "Sidebar":
      return component({
        mode: "desktop",
        ...props,
        get children() {
          return component.Panel({
            heading: "Audit",
            children: "Details",
            get navigation() {
              // Navigation disabled state is independent of collapse/drawer disabled state.
              return component.Item({
                label: "Audit item",
                icon: "Icon",
                disabled: props.disabled ?? false,
              });
            },
          });
        },
      });
    default:
      return component({ children: "Audit", "aria-label": "Audit", ...props });
  }
}
const render = (name, appearance, props = {}) =>
  renderToString(() =>
    AppearanceProvider({
      appearance,
      get children() {
        return fixture(name, props);
      },
    }),
  );
function stubGlobal(context, name, value) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, {
    configurable: true,
    writable: true,
    value,
  });
  context.after(() => {
    if (previous) Object.defineProperty(globalThis, name, previous);
    else Reflect.deleteProperty(globalThis, name);
  });
}

test("pixel adds only the approved straight radius and two theme-colored hard-shadow tokens", () => {
  assert.deepEqual(Object.keys(tokens.radius), ["sm", "md", "lg", "pixel"]);
  assert.deepEqual(Object.keys(tokens.shadow), [
    "sm",
    "md",
    "keycap",
    "keycapPressed",
    "mahjong",
    "mahjongPressed",
    "pixel",
    "pixelPressed",
  ]);
  assert.equal(tokens.radius.pixel, "0px");
  assert.equal(
    tokens.shadow.pixel,
    "2px 2px 0 var(--color-border), 4px 4px 0 var(--color-primary)",
  );
  assert.equal(
    tokens.shadow.pixelPressed,
    "1px 1px 0 var(--color-border), 2px 2px 0 var(--color-primary)",
  );
  const css = generateThemeCss();
  assert.ok(
    css.includes("--radius-pixel: 0px;") &&
      css.includes(`--shadow-pixel: ${tokens.shadow.pixel};`) &&
      css.includes(`--shadow-pixel-pressed: ${tokens.shadow.pixelPressed};`),
  );
  assert.deepEqual(tokens.font.weight, { normal: 400, medium: 500 });
  assert.equal(tokens.transition.duration, "150ms");
  assert.equal(tokens.animation.spinDuration, "1000ms");
});

test("pixel preferences are accepted, restored and persisted independently from palette and light/dark", (context) => {
  assert.equal(isComponentAppearance("pixel"), true);
  for (const invalid of ["Pixel", "pixels", "pixel ", "retro"])
    assert.equal(isComponentAppearance(invalid), false);
  const stored = new Map(),
    root = { dataset: {} };
  stubGlobal(context, "document", { documentElement: root });
  stubGlobal(context, "window", {
    localStorage: {
      getItem: (key) => stored.get(key) ?? null,
      setItem: (key, value) => stored.set(key, value),
    },
  });
  applyTheme("dark");
  applyPalette("mint");
  applyAppearance("pixel");
  assert.equal(getPreferredAppearance(), "pixel");
  assert.deepEqual(root.dataset, {
    theme: "dark",
    palette: "mint",
    appearance: "pixel",
  });
  assert.equal(stored.get(APPEARANCE_STORAGE_KEY), "pixel");
  assert.equal(stored.get(THEME_STORAGE_KEY), "dark");
  assert.equal(stored.get(PALETTE_STORAGE_KEY), "mint");
  applyTheme("light");
  applyPalette("sakura");
  assert.equal(root.dataset.appearance, "pixel");
});

test("pixel remains usable with an unavailable storage getter", (context) => {
  const root = { dataset: {} };
  stubGlobal(context, "document", { documentElement: root });
  stubGlobal(context, "window", {
    get localStorage() {
      throw new Error("Storage unavailable");
    },
  });
  assert.doesNotThrow(() => applyAppearance("pixel"));
  assert.equal(root.dataset.appearance, "pixel");
  assert.equal(getPreferredAppearance(), "default");
});

test("pixel stored preference and live root updates survive failed storage writes", (context) => {
  const root = { dataset: {} };
  stubGlobal(context, "document", { documentElement: root });
  stubGlobal(context, "window", {
    localStorage: {
      getItem: () => "pixel",
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    },
  });
  assert.equal(getPreferredAppearance(), "pixel");
  assert.doesNotThrow(() => applyAppearance("pixel"));
  assert.equal(root.dataset.appearance, "pixel");
});

test("pixel shadows distinguish native/hidden-input presses and keep unavailable and display surfaces non-pressable", () => {
  const display = getAppearanceClasses("pixel");
  assert.ok(
    display.includes("solid-appearance-pixel") &&
      display.includes("shadow-pixel"),
  );
  assert.doesNotMatch(display, /active:|cursor|tabindex|scale|translate/);
  assert.ok(
    getAppearanceClasses("pixel", "native").includes(
      "enabled:active:shadow-pixel-pressed",
    ),
  );
  const control = getAppearanceClasses("pixel", "control");
  assert.ok(
    control.includes("active:shadow-pixel-pressed") &&
      control.includes("peer-active:shadow-pixel-pressed"),
  );
  for (const interaction of ["display", "native", "control"]) {
    const unavailable = getAppearanceClasses("pixel", interaction, true);
    assert.equal(
      unavailable,
      "solid-appearance-pixel shadow-sm transition-shadow duration-token",
    );
    assert.doesNotMatch(unavailable, /shadow-pixel|active:/);
  }
});

test("pixel UnoCSS marker is local and more specific than retained rounded utilities, with all approved shadow variables", async () => {
  const uno = await createGenerator(unoConfig);
  const names = new Set(["rounded-md", "rounded-full"]);
  for (const interaction of ["display", "native", "control"])
    for (const unavailable of [false, true])
      for (const name of getAppearanceClasses(
        "pixel",
        interaction,
        unavailable,
      ).split(/\s+/))
        names.add(name);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names) assert.ok(matched.has(name), name);
  const compact = css.replace(/\s+/g, "");
  assert.ok(
    compact.includes(
      ".solid-appearance-pixel.solid-appearance-pixel{border-radius:var(--radius-pixel);}",
    ),
  );
  assert.doesNotMatch(
    compact,
    /\[data-appearance=|\.solid-appearance-pixel(?:>|\*)|!important/,
  );
  for (const token of [
    "--radius-md",
    "--radius-pixel",
    "--shadow-pixel",
    "--shadow-pixel-pressed",
    "--shadow-sm",
    "--transition-duration",
  ])
    assert.ok(css.includes(`var(${token})`), token);
  assert.ok(css.includes(".peer:active"));
  assert.equal(
    (await uno.generate("solid-appearance-pixel-other")).matched.size,
    0,
  );
});

for (const name of names) {
  test(`${name} inherits pixel and preserves explicit default/keycap overrides without changing its original classes`, () => {
    const original = classes(renderToString(() => fixture(name)));
    const pixel = classes(render(name, "pixel"));
    assert.ok(
      pixel.includes("solid-appearance-pixel") &&
        pixel.includes("shadow-pixel"),
      name,
    );
    assert.deepEqual(
      classes(render(name, "pixel", { appearance: "default" })),
      original,
    );
    const explicit = classes(render(name, "pixel", { appearance: "keycap" }));
    assert.ok(explicit.includes("shadow-keycap"));
    assert.ok(
      !explicit.includes("solid-appearance-pixel") &&
        !explicit.includes("shadow-pixel"),
    );
  });
}

test("pixel unavailable controls retain their straight marker without any pressed shadow or additional event logic", () => {
  for (const name of [
    "Input",
    "Textarea",
    "Checkbox",
    "Switch",
    "Tag",
    "RadioGroup",
    "List",
    "Pagination",
    "Table",
    "Sidebar",
  ])
    for (const props of [
      { disabled: true },
      ...(["Input", "Textarea", "Checkbox", "Switch", "RadioGroup"].includes(
        name,
      )
        ? [{ readOnly: true }]
        : []),
    ]) {
      const rendered = classes(render(name, "pixel", props));
      assert.ok(
        rendered.includes("solid-appearance-pixel") &&
          rendered.includes("shadow-sm"),
        name,
      );
      assert.ok(
        !rendered.some((value) => value.includes("shadow-pixel")),
        name,
      );
    }
});

test("pure pixel displays add no buttons keyboard handlers or Tab stops", () => {
  for (const name of [
    "Alert",
    "Avatar",
    "Badge",
    "Card",
    "Divider",
    "Skeleton",
    "Spinner",
    "FormField",
    "Header",
    "Content",
    "Footer",
  ])
    assert.doesNotMatch(
      render(name, "pixel"),
      /<button\b|\stabindex=|\sonkeydown=/,
    );
});

test("frozen Button variants and sizes are unchanged even inside pixel display frames", () => {
  for (const variant of ["solid", "outline", "ghost", "danger", "mahjong"])
    for (const size of ["sm", "md", "lg"]) {
      const original = renderToString(() =>
        components.Button({ variant, size, children: "Audit" }),
      );
      assert.deepEqual(
        classes(render("Button", "pixel", { variant, size })),
        classes(original),
      );
      const nested = renderToString(() =>
        components.Card({
          appearance: "pixel",
          get children() {
            return components.Button({ variant, size, children: "Audit" });
          },
        }),
      );
      const button = nested.match(/<button\b[^>]*>/)[0];
      assert.doesNotMatch(button, /solid-appearance-pixel|shadow-pixel/);
      assert.ok(button.includes("rounded-md"));
    }
});

test("all shared pixel fixture utilities generate while existing component CSS markers remain separate", async () => {
  const utilities = new Set();
  for (const name of names)
    for (const size of ["sm", "md", "lg"])
      for (const value of classes(render(name, "pixel", { size })))
        if (
          value !== "peer" &&
          (!value.startsWith("solid-") || value === "solid-appearance-pixel")
        )
          utilities.add(value);
  const uno = await createGenerator(unoConfig);
  const { matched } = await uno.generate([...utilities].join(" "));
  for (const value of utilities)
    assert.ok(matched.has(value), `Missing utility: ${value}`);
});

test("pixel closable Tags shorten only when their direct close button is pressed and retain disabled guarding", async () => {
  const css = await readFile(
    new URL("../src/components/Tag/Tag.css", import.meta.url),
    "utf8",
  );
  assert.ok(
    css
      .replace(/\s+/g, "")
      .includes(
        '[data-tag-appearance="pixel"]:not([data-disabled]):has(>button:active){--un-shadow:var(--shadow-pixel-pressed);}',
      ),
  );
  const html = render("Tag", "pixel", {
    closable: true,
    closeLabel: "Close audit",
    onClose: () => {},
  });
  assert.match(html, /data-tag-appearance="pixel"/);
  assert.match(html.match(/<button\b[^>]*>/)[0], /solid-appearance-pixel/);
});

test("pixel is the fourth appearance option beside mode switching and every demo comparison retains its first three appearances", () => {
  const html = renderToString(App);
  assert.ok(html.includes('value="pixel"') && html.includes("像素主题"));
  assert.ok(
    html.indexOf('id="appearance-select"') < html.indexOf('id="theme-toggle"'),
  );
  const preview = renderToString(() =>
    AppearancePreview({
      id: "audit",
      children: (appearance, size) => `${appearance}-${size}`,
    }),
  );
  for (const appearance of ["default", "keycap", "mahjong", "pixel"])
    for (const size of ["sm", "md", "lg"])
      assert.ok(preview.includes(`${appearance}-${size}`));
  const theme = renderToString(() =>
    AppearanceProvider({
      appearance: "pixel",
      get children() {
        return ThemeDemo();
      },
    }),
  );
  assert.ok(
    theme.includes("当前外观：像素") &&
      theme.includes('id="theme-preview-input"'),
  );
  for (const appearance of ["default", "keycap", "mahjong", "pixel"])
    assert.ok(theme.includes(`data-demo-explicit="${appearance}"`));
});

test("demo comparisons can retain a fixed three-appearance matrix without weakening the pixel default", () => {
  const html = renderToString(() =>
    AppearancePreview({
      id: "fixed",
      showPixel: false,
      children: (appearance, size) => `${appearance}-${size}`,
    }),
  );
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      assert.ok(html.includes(`${appearance}-${size}`));
  assert.doesNotMatch(html, /data-demo-appearance="pixel"/);
  assert.ok(html.includes("lg:grid-cols-3"));
});

test("Layout inherits pixel in its workspace while preserving all 18 original fixed matrices and boundaries", () => {
  const html = renderToString(() =>
    AppearanceProvider({
      appearance: "pixel",
      get children() {
        return LayoutDemo();
      },
    }),
  );
  assert.equal((html.match(/data-layout-appearance=/g) ?? []).length, 18);
  assert.equal((html.match(/aria-label="示例图标导航"/g) ?? []).length, 18);
  for (const tag of ["header", "footer"])
    assert.equal((html.match(new RegExp(`<${tag}\\b`, "g")) ?? []).length, 19);
  const workspace = html.match(
    /<div\b[^>]*id="layout-working-example"[^>]*>/,
  )[0];
  assert.ok(
    workspace.includes("solid-appearance-pixel") &&
      workspace.includes("shadow-pixel"),
  );
  assert.doesNotMatch(html, /data-layout-appearance="pixel"/);
});
