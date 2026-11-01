import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createComponentHarness } from "./component-harness.mjs";

let harness, AppearanceProvider, useAppearanceDefaults, ThemeDemo, App;
const components = {};
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
];

before(async () => {
  harness = await createComponentHarness("appearance-provider");
  ({ AppearanceProvider, useAppearanceDefaults } = await harness.load(
    "/src/theme/appearance.tsx",
  ));
  for (const name of [...names, "Radio", "Button"])
    Object.assign(
      components,
      await harness.load(`/src/components/${name}/${name}.tsx`),
    );
  ({ ThemeDemo } = await harness.load("/src/demo/Theme.demo.tsx"));
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

for (const name of names) {
  test(`${name} inherits every appearance and allows an explicit default or local override`, () => {
    const plain = classes(renderToString(() => fixture(name)));
    for (const appearance of ["default", "keycap", "mahjong"]) {
      const inherited = classes(render(name, appearance));
      if (appearance === "default") assert.deepEqual(inherited, plain);
      else assert.ok(inherited.includes(`shadow-${appearance}`));
      assert.deepEqual(
        classes(render(name, appearance, { appearance: "default" })),
        plain,
      );
      const overridden = classes(
        render(name, appearance, { appearance: "keycap" }),
      );
      assert.ok(overridden.includes("shadow-keycap"));
      assert.ok(!overridden.includes("shadow-mahjong"));
    }
  });
}

test("nested providers are isolated and omitted provider props reset to default", () => {
  const html = renderToString(() =>
    AppearanceProvider({
      appearance: "mahjong",
      get children() {
        return [
          components.Badge({ id: "outer", children: "Outer" }),
          AppearanceProvider({
            appearance: "keycap",
            get children() {
              return components.Badge({ id: "inner", children: "Inner" });
            },
          }),
          AppearanceProvider({
            get children() {
              return components.Badge({ id: "reset", children: "Reset" });
            },
          }),
        ];
      },
    }),
  );
  const nodeClass = (id) =>
    html.match(new RegExp(`<span[^>]*id="${id}"[^>]*class="([^"]*)"`))[1];
  assert.ok(nodeClass("outer").includes("shadow-mahjong"));
  assert.ok(nodeClass("inner").includes("shadow-keycap"));
  assert.doesNotMatch(nodeClass("reset"), /shadow-(?:keycap|mahjong)/);
});

test("inherited appearances still flatten unavailable controls and omit every pressed shadow", () => {
  for (const name of ["Input", "Textarea", "Checkbox", "Switch", "Tag"])
    for (const appearance of ["keycap", "mahjong"])
      for (const props of [
        { disabled: true },
        ...(name === "Tag" ? [] : [{ readOnly: true }]),
      ]) {
        const unavailable = classes(render(name, appearance, props));
        assert.ok(unavailable.includes("shadow-sm"), name);
        assert.ok(!unavailable.includes(`shadow-${appearance}`), name);
        assert.ok(
          !unavailable.some((value) =>
            value.includes(`shadow-${appearance}-pressed`),
          ),
          name,
        );
      }
});

test("appearance defaults capture the provider but defer every value read", () => {
  let selected = "keycap",
    defaults;
  renderToString(() =>
    AppearanceProvider({
      get appearance() {
        return selected;
      },
      get children() {
        defaults = useAppearanceDefaults();
        assert.equal(defaults.appearance, "keycap");
        selected = "mahjong";
        assert.equal(defaults.appearance, "mahjong");
        return "Context audit";
      },
    }),
  );
  selected = "default";
  assert.equal(defaults.appearance, "default");
});

test("the frozen Button implementation and explicit variants ignore provider changes", () => {
  for (const variant of ["solid", "outline", "ghost", "danger", "mahjong"]) {
    const plain = classes(
      renderToString(() => components.Button({ variant, children: "Audit" })),
    );
    for (const appearance of ["default", "keycap", "mahjong"])
      assert.deepEqual(
        classes(render("Button", appearance, { variant })),
        plain,
      );
  }
});

test("the header contains the theme Select next to the independent mode toggle", () => {
  const html = renderToString(App);
  assert.match(html, /id="theme-controls"/);
  assert.match(html, /id="appearance-select"[^>]*aria-label="外观主题"/);
  assert.match(html, /id="theme-toggle"/);
  assert.ok(
    html.indexOf('id="appearance-select"') < html.indexOf('id="theme-toggle"'),
  );
  assert.match(html, /aria-haspopup="listbox"/);
});

test("the theme demo includes an inherited editable control and fixed appearance comparisons", () => {
  const html = renderToString(() =>
    AppearanceProvider({
      appearance: "mahjong",
      get children() {
        return ThemeDemo();
      },
    }),
  );
  assert.ok(html.includes("当前外观：麻将"));
  assert.ok(html.includes('id="theme-preview-input"'));
  for (const appearance of ["default", "keycap", "mahjong"])
    assert.ok(html.includes(`data-demo-explicit="${appearance}"`));
});

test("the header adds an independent named palette Select before appearance and mode controls", () => {
  const html = renderToString(App);
  assert.match(html, /id="palette-select"[^>]*aria-label="配色主题"/);
  assert.ok(
    html.indexOf('id="palette-select"') <
      html.indexOf('id="appearance-select"'),
  );
  assert.match(html, /默认蓝/);
});

test("the theme demo explains all palettes without replacing inherited or fixed controls", () => {
  const html = renderToString(ThemeDemo);
  for (const name of ["默认蓝", "樱花粉", "清新绿", "薰衣草紫", "暖杏橙"])
    assert.ok(html.includes(name));
  assert.ok(html.includes("配色、外观和明暗模式独立切换"));
  assert.ok(html.includes('id="theme-preview-input"'));
});
