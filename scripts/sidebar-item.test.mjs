import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, after, test } from "node:test";
import { URL } from "node:url";
import { createComponent } from "solid-js";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Sidebar, NavigationIcon, LayoutDemo, App;
before(async () => {
  harness = await createComponentHarness("sidebar-item");
  ({ Sidebar } = await harness.load("/src/components/Layout/index.ts"));
  ({ NavigationIcon } = await harness.load("/src/demo/NavigationIcon.tsx"));
  ({ LayoutDemo } = await harness.load(
    "/src/components/Layout/Layout.demo.tsx",
  ));
  ({ default: App } = await harness.load("/src/App.tsx"));
});
after(async () => await harness?.close());

const node = (html, id) =>
  html.match(new RegExp(`<[^>]+\\bid="${id}"[^>]*>`))?.[0];
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );
const renderItem = (root = {}, item = {}) =>
  renderToString(() =>
    createComponent(Sidebar, {
      mode: "desktop",
      ...root,
      get children() {
        return createComponent(Sidebar.Item, {
          id: "item",
          label: "Overview",
          icon: "Decorative icon",
          ...item,
        });
      },
    }),
  );

test("sidebar items require a stable label/icon and forward native button attributes with safe defaults", () => {
  assert.equal(typeof Sidebar.Item, "function");
  const html = renderItem(
    {},
    {
      title: "Native title",
      "data-native": "kept",
      class: "text-center",
      children: 0,
    },
  );
  const button = node(html, "item");
  for (const value of [
    'type="button"',
    'aria-label="Overview"',
    'title="Native title"',
    'data-native="kept"',
    'data-sidebar-item=""',
  ])
    assert.ok(button.includes(value));
  assert.equal(classes(button).at(-1), "text-center");
  assert.ok(classes(button).includes("h-10"));
  assert.ok(html.includes('aria-hidden="true"'));
  assert.match(html, /solid-sidebar-item-label[^>]*>0<\/span>/);
  assert.doesNotMatch(
    button,
    /\s(?:icon|label|active|size|appearance|variant)=/,
  );
});

test("collapsed items retain accessible names and native titles while mobile items keep full labels", () => {
  for (const mode of ["desktop", "mobile"])
    for (const collapsed of [false, true]) {
      const html = renderItem({ mode, collapsed });
      const button = node(html, "item");
      assert.equal(
        button.includes("data-collapsed"),
        mode === "desktop" && collapsed,
      );
      assert.ok(
        button.includes('aria-label="Overview"') &&
          button.includes('title="Overview"'),
      );
      assert.ok(
        html.includes("solid-sidebar-item-label") && html.includes("Overview"),
      );
    }
});

test("active and disabled items retain native semantics and caller overrides", () => {
  const selected = node(renderItem({}, { active: true }), "item");
  assert.ok(selected.includes('aria-current="page"'));
  assert.ok(
    classes(selected).includes("text-primary") &&
      classes(selected).includes("border-primary"),
  );
  assert.ok(!classes(selected).includes("text-fg"));
  const override = node(
    renderItem(
      {},
      {
        active: true,
        "aria-label": "Custom name",
        "aria-current": "step",
        type: "submit",
      },
    ),
    "item",
  );
  assert.ok(
    override.includes('aria-label="Custom name"') &&
      override.includes('aria-current="step"'),
  );
  assert.ok(override.includes('type="submit"'));
  assert.ok(
    node(renderItem({}, { disabled: true }), "item").includes("disabled"),
  );
  // Root disabled continues to affect disclosure switches, not existing navigation.
  assert.doesNotMatch(
    node(renderItem({ disabled: true }), "item"),
    /\sdisabled(?=[\s=>])/,
  );
});

test("sidebar items inherit reactive root dimensions and appearance and permit local overrides", () => {
  const inherited = classes(
    node(renderItem({ size: "lg", appearance: "mahjong" }), "item"),
  );
  assert.ok(
    inherited.includes("h-12") &&
      inherited.includes("text-lg") &&
      inherited.includes("shadow-mahjong"),
  );
  const override = classes(
    node(
      renderItem(
        { size: "lg", appearance: "mahjong" },
        { size: "sm", appearance: "default" },
      ),
      "item",
    ),
  );
  assert.ok(override.includes("h-8") && override.includes("text-md"));
  assert.ok(!override.includes("shadow-mahjong"));
});

test("all sidebar item variants, sizes, appearances and states generate token-only utilities", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["outline", "ghost"])
        for (const active of [false, true])
          for (const disabled of [false, true]) {
            const html = renderItem(
              { appearance, size, collapsed: true },
              { variant, active, disabled },
            );
            const current = classes(node(html, "item"));
            for (const value of [
              "focus-visible:ring-2",
              "focus-visible:ring-ring",
              "disabled:opacity-50",
              "disabled:cursor-not-allowed",
            ])
              assert.ok(current.includes(value));
            if (appearance !== "default") {
              assert.ok(
                current.includes(
                  disabled ? "shadow-sm" : `shadow-${appearance}`,
                ),
              );
              assert.equal(
                current.includes(`enabled:active:shadow-${appearance}-pressed`),
                !disabled,
              );
            }
            for (const value of classes(html))
              if (!value.startsWith("solid-sidebar-")) names.add(value);
          }
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const value of names)
    assert.ok(matched.has(value), `Missing utility: ${value}`);
  for (const value of [
    "--color-primary",
    "--color-ring",
    "--shadow-keycap-pressed",
    "--shadow-mahjong-pressed",
  ])
    assert.ok(css.includes(`var(${value})`));
});

test("the always-available navigation slot is outside collapsed details and both slots preserve mounted children", async () => {
  const html = renderToString(() =>
    createComponent(Sidebar, {
      mode: "desktop",
      defaultCollapsed: true,
      get children() {
        return createComponent(Sidebar.Panel, {
          id: "panel",
          heading: "Navigation",
          children: "Expanded details",
          get navigation() {
            return createComponent(Sidebar.Item, {
              id: "rail-item",
              label: "Rail item",
              icon: "Icon",
            });
          },
        });
      },
    }),
  );
  assert.ok(node(html, "panel-body").includes("data-closed"));
  assert.match(html, /Expanded details<\/div><button[^>]*id="rail-item"/);
  const source = await readFile(
    new URL("../src/components/Layout/Sidebar.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(source.includes("resolveChildren(() => local.navigation)"));
  assert.ok(source.includes("resolveChildren(() => local.children)"));
  assert.ok(
    source.includes("label: string;") && source.includes("icon: JSX.Element;"),
  );
  assert.doesNotMatch(
    source,
    /\.focus\(|onKeyDown=|addEventListener\("keydown"/,
  );
  const css = await readFile(
    new URL("../src/components/Layout/Sidebar.css", import.meta.url),
    "utf8",
  );
  assert.match(
    css,
    /\.solid-sidebar-item\[data-collapsed\] \.solid-sidebar-item-label\s*\{\s*display:\s*none;/,
  );
});

test("component and workspace directories contain named token-colored SVG icons in all collapsed matrices", () => {
  const app = renderToString(App);
  assert.ok(app.includes('aria-label="Layout / Sidebar"'));
  assert.ok(app.includes('aria-label="Button"'));
  assert.ok(app.includes('aria-label="主题概览"'));
  assert.ok(
    app.includes('stroke="currentColor"') && app.includes('focusable="false"'),
  );
  const demo = renderToString(LayoutDemo);
  assert.equal((demo.match(/data-layout-appearance=/g) ?? []).length, 18);
  assert.equal((demo.match(/aria-label="示例图标导航"/g) ?? []).length, 18);
  assert.ok(demo.includes("桌面折叠保留图标导航"));
  const icon = renderToString(() =>
    createComponent(NavigationIcon, { name: "unknown" }),
  );
  assert.ok(icon.includes("<path") && icon.includes('aria-hidden="true"'));
});
