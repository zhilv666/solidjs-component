import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { before, after, test } from "node:test";
import { URL } from "node:url";
import { createComponent } from "solid-js";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Layout, Header, Sidebar, Content, Footer, LayoutDemo, App;
let AppearanceProvider, useLayoutDefaults;
before(async () => {
  harness = await createComponentHarness("layout");
  ({ Layout, Header, Sidebar, Content, Footer } = await harness.load(
    "/src/components/index.ts",
  ));
  ({ LayoutDemo } = await harness.load(
    "/src/components/Layout/Layout.demo.tsx",
  ));
  ({ AppearanceProvider } = await harness.load("/src/theme/appearance.tsx"));
  ({ useLayoutDefaults } = await harness.load(
    "/src/components/Layout/layout-context.ts",
  ));
  ({ default: App } = await harness.load("/src/App.tsx"));
});
after(async () => await harness?.close());

const render = (component, props = {}) =>
  renderToString(() => createComponent(component, props));
const node = (html, id) =>
  html.match(new RegExp(`<[^>]+\\bid="${id}"[^>]*>`))?.[0];
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );
const renderComposition = (root = {}, parts = {}) =>
  render(Layout, {
    ...root,
    get children() {
      return [
        createComponent(Header, { id: "header", ...parts }),
        createComponent(Content, { id: "content", ...parts }),
        createComponent(Footer, { id: "footer", ...parts }),
      ];
    },
  });
const renderSidebar = (root = {}, panel = {}, trigger = {}, toggle = {}) =>
  render(Sidebar, {
    mode: "desktop",
    ...root,
    get children() {
      return [
        createComponent(Sidebar.Trigger, {
          id: "trigger",
          children: "Open navigation",
          ...trigger,
        }),
        createComponent(Sidebar.Toggle, {
          id: "toggle",
          "aria-label": "Toggle navigation",
          ...toggle,
        }),
        createComponent(Sidebar.Panel, {
          id: "sidebar",
          heading: "Navigation",
          description: "Help text",
          children: "Navigation content",
          ...panel,
        }),
      ];
    },
  });

test("layout exposes independent and compound semantic parts", () => {
  assert.equal(Layout.Root, Layout);
  assert.equal(Layout.Header, Header);
  assert.equal(Layout.Sidebar, Sidebar);
  assert.equal(Layout.Content, Content);
  assert.equal(Layout.Footer, Footer);
  assert.equal(Sidebar.Root, Sidebar);
  for (const key of ["Trigger", "Toggle", "Panel", "CloseButton"])
    assert.equal(typeof Sidebar[key], "function");
});

test("layout surfaces forward native attributes, class and zero without adding controls", () => {
  for (const [component, tag] of [
    [Layout, "div"],
    [Header, "header"],
    [Content, "main"],
    [Footer, "footer"],
  ]) {
    const html = render(component, {
      id: "surface",
      title: "Native title",
      "aria-label": "Native name",
      "data-native": "retained",
      class: "text-left",
      children: 0,
    });
    assert.match(html, new RegExp(`^<${tag}\\b`));
    for (const value of [
      'id="surface"',
      'title="Native title"',
      'aria-label="Native name"',
      'data-native="retained"',
    ])
      assert.ok(html.includes(value));
    assert.ok(html.endsWith(`>0</${tag}>`));
    assert.equal(classes(html).at(-1), "text-left");
    assert.doesNotMatch(
      html,
      /\s(?:variant|size|appearance|tabindex|role)=|<(?:button|input)\b|(?:hover|active|focus):|animate-/i,
    );
  }
});

test("content defaults to main and allows section or div for embedded landmarks", () => {
  assert.match(render(Content), /^<main\b/);
  for (const as of ["main", "section", "div"]) {
    const html = render(Content, { as, children: "<unsafe> & content" });
    assert.match(html, new RegExp(`^<${as}\\b`));
    assert.ok(html.includes("&lt;unsafe> &amp; content"));
    assert.doesNotMatch(html, /\sas=/);
  }
});

test("layout defaults to plain while its surfaces default to outline and md", () => {
  assert.ok(!classes(render(Layout)).includes("border-border"));
  for (const component of [Header, Content, Footer]) {
    const current = classes(render(component));
    assert.ok(
      current.includes("p-4") &&
        current.includes("text-md") &&
        current.includes("rounded-md") &&
        current.includes("border-border"),
    );
  }
  for (const component of [Layout, Header, Content, Footer])
    assert.deepEqual(
      classes(render(component)),
      classes(render(component, { appearance: "default" })),
    );
});

test("all static layout size, appearance and variant combinations use only approved utilities", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["plain", "outline"])
        for (const component of [Layout, Header, Content, Footer]) {
          const current = classes(
            render(component, { appearance, size, variant }),
          );
          assert.equal(
            current.includes("border-border"),
            variant === "outline",
          );
          assert.equal(current.includes("rounded-md"), variant === "outline");
          assert.ok(current.includes(size === "lg" ? "text-lg" : "text-md"));
          if (component !== Layout)
            assert.ok(
              current.includes({ sm: "p-3", md: "p-4", lg: "p-6" }[size]),
            );
          if (appearance !== "default")
            assert.ok(current.includes(`shadow-${appearance}`));
          assert.ok(
            !current.some((value) =>
              /active:|hover:|shadow-md|animate-/.test(value),
            ),
          );
          for (const value of current) names.add(value);
        }
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const token of [
    "--radius-md",
    "--color-border",
    "--color-bg",
    "--color-surface",
    "--color-fg",
    "--font-size-md",
    "--font-size-lg",
    "--font-weight-normal",
    "--shadow-keycap",
    "--shadow-mahjong",
    "--transition-duration",
  ])
    assert.ok(css.includes(`var(${token})`));
});

test("layout inherits global appearance, cascades size and permits explicit surface overrides", () => {
  const inherited = renderToString(() =>
    createComponent(AppearanceProvider, {
      appearance: "mahjong",
      get children() {
        return createComponent(Layout, {
          size: "lg",
          get children() {
            return [
              createComponent(Header, { id: "inherited" }),
              createComponent(Content, {
                id: "override",
                size: "sm",
                appearance: "default",
              }),
              createComponent(Sidebar, {
                mode: "desktop",
                get children() {
                  return createComponent(Sidebar.Panel, {
                    id: "inherited-sidebar",
                    heading: "Inherited navigation",
                  });
                },
              }),
            ];
          },
        });
      },
    }),
  );
  const header = classes(node(inherited, "inherited"));
  assert.ok(header.includes("shadow-mahjong") && header.includes("p-6"));
  const content = classes(node(inherited, "override"));
  assert.ok(content.includes("p-3"));
  assert.ok(!content.includes("shadow-mahjong"));
  const sidebar = classes(node(inherited, "inherited-sidebar"));
  assert.ok(sidebar.includes("shadow-mahjong") && sidebar.includes("w-64"));
  const explicit = renderComposition({ appearance: "keycap", size: "sm" });
  for (const id of ["header", "content", "footer"]) {
    const current = classes(node(explicit, id));
    assert.ok(current.includes("shadow-keycap") && current.includes("p-3"));
  }
});

test("layout defaults defer context reads instead of snapshotting reactive props", () => {
  let selected = "keycap",
    size = "sm",
    defaults;
  renderToString(() =>
    createComponent(Layout, {
      get appearance() {
        return selected;
      },
      get size() {
        return size;
      },
      get children() {
        defaults = useLayoutDefaults();
        assert.equal(defaults.appearance, "keycap");
        assert.equal(defaults.size, "sm");
        selected = "mahjong";
        size = "lg";
        assert.equal(defaults.appearance, "mahjong");
        assert.equal(defaults.size, "lg");
        return "Context audit";
      },
    }),
  );
  selected = "default";
  size = "md";
  assert.equal(defaults.appearance, "default");
  assert.equal(defaults.size, "md");
});

test("desktop sidebar exposes a named aside, safe collapsible toggles and native panel props", () => {
  const html = renderSidebar(
    {},
    {
      title: "Native panel",
      "data-native": "retained",
      class: "text-left",
    },
    {},
    { title: "Native toggle", class: "select-none" },
  );
  const panel = node(html, "sidebar");
  assert.match(panel, /^<aside\b/);
  for (const value of [
    'aria-label="Navigation"',
    'data-sidebar-mode="desktop"',
    'title="Native panel"',
    'data-native="retained"',
  ])
    assert.ok(panel.includes(value));
  assert.equal(classes(panel).at(-1), "text-left");
  assert.ok(html.includes('id="sidebar-body"'));
  assert.ok(html.includes("Help text") && html.includes("Navigation content"));
  const toggle = node(html, "toggle");
  assert.ok(
    toggle.includes('aria-expanded="true"') && toggle.includes('type="button"'),
  );
  assert.ok(toggle.includes('title="Native toggle"'));
  assert.equal(classes(toggle).at(-1), "select-none");
  assert.ok(!html.includes('id="trigger"') && !html.includes('role="dialog"'));
  assert.doesNotMatch(
    panel,
    /\s(?:size|appearance|variant|heading|tabindex|role)=/i,
  );
});

test("sidebar collapse has distinct widths, preserves mounted content and honors controlled precedence", () => {
  for (const size of ["sm", "md", "lg"])
    for (const collapsed of [false, true]) {
      const html = renderSidebar({
        size,
        collapsed,
        defaultCollapsed: !collapsed,
      });
      const current = classes(node(html, "sidebar"));
      assert.ok(
        current.includes(
          (collapsed
            ? { sm: "w-14", md: "w-16", lg: "w-20" }
            : { sm: "w-48", md: "w-56", lg: "w-64" })[size],
        ),
      );
      assert.equal(node(html, "sidebar").includes("data-collapsed"), collapsed);
      assert.ok(node(html, "toggle").includes(`aria-expanded="${!collapsed}"`));
      assert.ok(html.includes("Navigation content"));
      assert.equal(
        node(html, "sidebar-body").includes("data-closed"),
        collapsed,
      );
    }
  assert.ok(
    node(renderSidebar({ defaultCollapsed: true }), "toggle").includes(
      'aria-expanded="false"',
    ),
  );
});

test("sidebar appearance and disabled controls retain focus styles and omit pressed unavailable bases", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["plain", "outline"])
        for (const disabled of [false, true]) {
          const html = renderSidebar(
            { appearance, size, disabled },
            { variant },
          );
          const panel = classes(node(html, "sidebar"));
          const toggleHtml = node(html, "toggle"),
            toggle = classes(toggleHtml);
          assert.equal(panel.includes("border-border"), variant === "outline");
          assert.ok(!panel.some((value) => value.includes("active:")));
          assert.ok(
            toggle.includes("focus-visible:ring-2") &&
              toggle.includes("focus-visible:ring-ring"),
          );
          assert.ok(
            toggle.includes("disabled:opacity-50") &&
              toggle.includes("disabled:cursor-not-allowed"),
          );
          assert.equal(/\sdisabled(?=[\s=>])/.test(toggleHtml), disabled);
          if (appearance !== "default") {
            assert.ok(
              panel.includes(disabled ? "shadow-sm" : `shadow-${appearance}`),
            );
            assert.equal(
              toggle.includes(`enabled:active:shadow-${appearance}-pressed`),
              !disabled,
            );
          }
          for (const value of classes(html))
            if (value !== "solid-sidebar-body") names.add(value);
        }
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const token of [
    "--color-ring",
    "--shadow-keycap-pressed",
    "--shadow-mahjong-pressed",
  ])
    assert.ok(css.includes(`var(${token})`));
});

test("mobile mode exposes a safe dialog trigger and omits desktop controls when closed", () => {
  for (const [root, open] of [
    [{ defaultOpen: true }, true],
    [{ open: false, defaultOpen: true }, false],
    [{ open: true, defaultOpen: false }, true],
  ]) {
    const html = renderSidebar({ mode: "mobile", ...root });
    assert.ok(node(html, "trigger").includes(`aria-expanded="${open}"`));
  }
  for (const disabled of [false, true]) {
    const html = renderSidebar(
      { mode: "mobile", disabled, appearance: "mahjong" },
      {},
      { title: "Native trigger", class: "text-left" },
    );
    const trigger = node(html, "trigger");
    assert.match(trigger, /^<button\b/);
    for (const value of [
      'aria-haspopup="dialog"',
      'aria-expanded="false"',
      'type="button"',
      'title="Native trigger"',
    ])
      assert.ok(trigger.includes(value));
    assert.equal(classes(trigger).at(-1), "text-left");
    assert.equal(/\sdisabled(?=[\s=>])/.test(trigger), disabled);
    assert.ok(!html.includes('id="toggle"') && !html.includes('id="sidebar"'));
    assert.equal(
      classes(trigger).includes("enabled:active:shadow-mahjong-pressed"),
      !disabled,
    );
  }
});

test("sidebar delegates focus, keyboard and ARIA to Kobalte and cleans up its structural media listener", async () => {
  const source = await readFile(
    new URL("../src/components/Layout/Sidebar.tsx", import.meta.url),
    "utf8",
  );
  for (const value of [
    "@kobalte/core/collapsible",
    "@kobalte/core/dialog",
    'as="aside"',
    "createDisclosureState",
    "forceMount",
    "resolveChildren(() => local.children)",
    'media.removeEventListener("change", update)',
    "!desktop() && drawer.isOpen()",
    "drawer.close()",
  ])
    assert.ok(source.includes(value));
  assert.doesNotMatch(
    source,
    /\.focus\(|onKeyDown=|aria-labelledby=|aria-describedby=|addEventListener\("keydown"/,
  );
  assert.throws(() => render(Sidebar.Trigger), /within Sidebar/);
  assert.throws(
    () => render(Sidebar.Panel, { heading: "Outside" }),
    /within Sidebar/,
  );
  const css = await readFile(
    new URL("../src/components/Layout/Sidebar.css", import.meta.url),
    "utf8",
  );
  assert.match(
    css,
    /\.solid-sidebar-body\[data-closed\]\s*\{\s*display:\s*none;\s*\}/,
  );
  const uno = await createGenerator(unoConfig);
  const generated = await uno.generate("md:flex");
  const minWidth = generated.css.match(/min-width:\s*([^)]*)/)[1];
  assert.ok(source.includes(`(min-width: ${minWidth})`));
});

test("layout demo covers its entire matrix, controlled workspace and embedded main-safe composition", () => {
  const html = render(LayoutDemo);
  assert.equal([...html.matchAll(/data-layout-appearance=/g)].length, 18);
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["plain", "outline"])
        assert.ok(
          [
            ...html.matchAll(
              /<div\b[^>]*data-layout-appearance="[^"]*"[^>]*>/g,
            ),
          ].some(
            ([element]) =>
              element.includes(`data-layout-appearance="${appearance}"`) &&
              element.includes(`data-layout-size="${size}"`) &&
              element.includes(`data-layout-variant="${variant}"`),
          ),
        );
  for (const id of [
    "layout-size-select",
    "layout-drawer-trigger",
    "layout-working-example",
    "layout-working-sidebar",
    "layout-working-content",
    "layout-draft",
    "layout-save-output",
    "layout-state",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.match(node(html, "layout-working-content"), /^<section\b/);
  assert.doesNotMatch(html, /<main\b/);
  assert.ok(html.includes("折叠回调：") && html.includes("账单（禁用）"));
});

test("demo shell uses the layout API, one main and independent scrollable regions with mobile navigation", async () => {
  const html = render(App);
  assert.equal([...html.matchAll(/<main\b/g)].length, 1);
  assert.ok(
    html.includes('id="demo-sidebar"') &&
      html.includes('id="component-preview"'),
  );
  assert.ok(
    classes(node(html, "component-preview")).includes("overflow-y-auto"),
  );
  assert.ok(
    classes(html).includes("h-screen") && classes(html).includes("min-h-0"),
  );
  const source = await readFile(
    new URL("../src/App.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(
    source.includes('id="demo-sidebar-trigger"') &&
      source.includes("setSidebarOpen(false)"),
  );
  const registry = await readFile(
    new URL("../src/demo/registry.ts", import.meta.url),
    "utf8",
  );
  assert.ok(
    registry.includes('id: "layout"') &&
      registry.includes("component: LayoutDemo"),
  );
});
