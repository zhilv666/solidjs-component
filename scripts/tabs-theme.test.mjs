import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Tabs, TabsDemo, AppearanceProvider;
before(async () => {
  harness = await createComponentHarness("tabs-theme");
  ({ Tabs } = await harness.load("/src/components/Tabs/Tabs.tsx"));
  ({ TabsDemo } = await harness.load("/src/components/Tabs/Tabs.demo.tsx"));
  ({ AppearanceProvider } = await harness.load("/src/theme/appearance.tsx"));
});
after(async () => await harness?.close());

const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );
const fixture = (props = {}) =>
  Tabs({
    id: "theme-tabs",
    defaultValue: "a",
    ...props,
    get children() {
      return [
        Tabs.List({
          "aria-label": "Theme audit",
          get children() {
            return [
              Tabs.Trigger({ value: "a", children: "Alpha" }),
              Tabs.Trigger({ value: "b", children: "Beta" }),
            ];
          },
        }),
        Tabs.Content({ value: "a", children: "Alpha panel" }),
        Tabs.Content({ value: "b", children: "Beta panel" }),
      ];
    },
  });
const render = (appearance, props = {}) =>
  renderToString(() =>
    AppearanceProvider({
      appearance,
      get children() {
        return fixture(props);
      },
    }),
  );

test("tabs inherit every global appearance in all sizes and variants without leaking theme props", () => {
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["outline", "ghost"]) {
        const html = render(appearance, { size, variant });
        const values = classes(html);
        if (appearance === "default")
          assert.deepEqual(
            values,
            classes(renderToString(() => fixture({ size, variant }))),
          );
        else {
          assert.equal(
            values.filter((value) => value === `shadow-${appearance}`).length,
            3,
          );
          assert.ok(
            values.includes(`enabled:active:shadow-${appearance}-pressed`),
          );
        }
        assert.doesNotMatch(html, /\s(?:appearance|variant|size)=/);
      }
});

test("an explicit tabs appearance wins over the provider and explicit default keeps original classes", () => {
  const plain = classes(renderToString(() => fixture()));
  for (const appearance of ["default", "keycap", "mahjong"]) {
    assert.deepEqual(
      classes(render(appearance, { appearance: "default" })),
      plain,
    );
    const values = classes(render(appearance, { appearance: "keycap" }));
    assert.ok(values.includes("shadow-keycap"));
    assert.ok(!values.includes("shadow-mahjong"));
  }
});

test("nested tabs appearance providers stay isolated and unavailable controls still flatten", () => {
  const html = renderToString(() =>
    AppearanceProvider({
      appearance: "mahjong",
      get children() {
        return [
          fixture({ id: "outer" }),
          AppearanceProvider({
            appearance: "keycap",
            get children() {
              return fixture({ id: "inner" });
            },
          }),
          AppearanceProvider({
            get children() {
              return fixture({ id: "reset" });
            },
          }),
        ];
      },
    }),
  );
  const nodeClass = (id) =>
    html.match(
      new RegExp(`<button\\b[^>]*id="${id}-trigger-a"[^>]*class="([^"]*)"`),
    )[1];
  assert.ok(nodeClass("outer").includes("shadow-mahjong"));
  assert.ok(nodeClass("inner").includes("shadow-keycap"));
  assert.doesNotMatch(nodeClass("reset"), /shadow-(?:keycap|mahjong)/);
  for (const appearance of ["keycap", "mahjong"]) {
    const unavailable = classes(render(appearance, { disabled: true }));
    assert.ok(unavailable.includes("shadow-sm"));
    assert.ok(
      !unavailable.some((value) => value.includes(`shadow-${appearance}`)),
    );
  }
});

test("the tabs default-selection demo follows global appearance while fixed matrices keep their overrides", () => {
  for (const appearance of ["keycap", "mahjong"]) {
    const html = renderToString(() =>
      AppearanceProvider({
        appearance,
        get children() {
          return TabsDemo();
        },
      }),
    );
    const auto = html.match(
      /<button\b[^>]*id="tabs-auto-trigger-a"[^>]*class="([^"]*)"/,
    )[1];
    assert.ok(auto.includes(`shadow-${appearance}`));
    const fixed = html.match(
      /<button\b[^>]*id="tabs-default-outline-md-trigger-overview"[^>]*class="([^"]*)"/,
    )[1];
    assert.doesNotMatch(fixed, /shadow-(?:keycap|mahjong)/);
  }
});
