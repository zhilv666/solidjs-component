import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Tabs, TabsDemo;
before(async () => {
  harness = await createComponentHarness("tabs");
  ({ Tabs } = await harness.load("/src/components/index.ts"));
  ({ TabsDemo } = await harness.load("/src/components/Tabs/Tabs.demo.tsx"));
});
after(async () => await harness?.close());
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );
const render = (props = {}, triggerProps = {}, contentProps = {}) =>
  renderToString(() =>
    Tabs({
      id: "tabs",
      defaultValue: "a",
      ...props,
      get children() {
        return [
          Tabs.List({
            id: "list",
            "aria-label": "Sections",
            get children() {
              return [
                Tabs.Trigger({
                  value: "a",
                  children: "Alpha",
                  ...triggerProps,
                }),
                Tabs.Trigger({
                  value: "disabled",
                  disabled: true,
                  children: "Disabled",
                }),
                Tabs.Trigger({ value: "b", children: "Beta" }),
              ];
            },
          }),
          Tabs.Content({ value: "a", children: 0, ...contentProps }),
          Tabs.Content({ value: "b", children: "Second", ...contentProps }),
        ];
      },
    }),
  );

test("tabs compound API preserves native props and class with Kobalte tab list trigger and panel roles", () => {
  const html = render(
    { class: "w-full", title: "Native root" },
    { class: "text-left", title: "Native trigger" },
    { class: "space-y-2", title: "Native panel" },
  );
  for (const value of [
    'role="tablist"',
    'role="tab"',
    'role="tabpanel"',
    'aria-label="Sections"',
    'title="Native root"',
    'title="Native trigger"',
    'title="Native panel"',
    'type="button"',
  ])
    assert.ok(html.includes(value), value);
  assert.match(html, /<div\b[^>]*class="[^"]*w-full\s*"/);
  assert.match(html, /<button\b[^>]*class="[^"]*text-left\s*"/);
  assert.match(html, /class="[^"]*space-y-2\s*"/);
  assert.match(html, />0<\/div>/);
  assert.doesNotMatch(
    html,
    /\s(?:variant|size|appearance|activationMode|defaultValue|onValueChange)=/,
  );
  assert.equal(Tabs.Root, Tabs);
});

test("tabs selected values remain controlled by Kobalte and inactive panels mount only on request", () => {
  const first = render();
  assert.ok(
    first.includes('aria-selected="true"') && !first.includes(">Second</div>"),
  );
  const second = render({ value: "b" });
  assert.ok(second.includes(">Second</div>") && !second.includes(">0</div>"));
  const forced = render({}, {}, { forceMount: true });
  assert.ok(forced.includes(">Second</div>") && forced.includes(">0</div>"));
  assert.equal([...forced.matchAll(/role="tabpanel"/g)].length, 2);
  assert.doesNotMatch(forced, /\sforceMount=/);
});

test("tabs appearances affect both navigation controls and static panels while disabled controls flatten", () => {
  for (const appearance of ["keycap", "mahjong"]) {
    const html = render({ appearance });
    const buttons = [...html.matchAll(/<button\b[^>]*class="([^"]*)"/g)].map(
      (match) => match[1],
    );
    assert.ok(
      buttons[0].includes(`shadow-${appearance}`) &&
        buttons[0].includes(`enabled:active:shadow-${appearance}-pressed`),
    );
    assert.ok(
      buttons[1].includes("shadow-sm") &&
        !buttons[1].includes(`shadow-${appearance}`),
    );
    const panel = html.match(
      /<div\b[^>]*role="tabpanel"[^>]*class="([^"]*)"/,
    )[1];
    assert.ok(panel.includes(`shadow-${appearance}`));
    assert.doesNotMatch(panel, /active:|hover:|cursor-pointer/);
    const groupDisabled = render({ appearance, disabled: true });
    assert.equal(
      [...groupDisabled.matchAll(/<button\b[^>]*disabled/g)].length,
      3,
    );
    assert.doesNotMatch(
      groupDisabled,
      /shadow-(?:keycap|mahjong)(?:-pressed)?/,
    );
  }
});

test("all tabs variants appearances sizes orientations and availability states emit valid token utilities", async () => {
  const names = new Set();
  for (const variant of ["outline", "ghost"])
    for (const appearance of ["default", "keycap", "mahjong"])
      for (const size of ["sm", "md", "lg"])
        for (const orientation of ["horizontal", "vertical"])
          for (const disabled of [false, true]) {
            const html = render({
              variant,
              appearance,
              size,
              orientation,
              disabled,
            });
            for (const name of classes(html))
              if (name !== "solid-tabs-content") names.add(name);
          }
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const variable of [
    "--color-primary",
    "--color-primary-fg",
    "--color-surface",
    "--color-fg",
    "--radius-md",
    "--font-size-md",
    "--font-size-lg",
    "--transition-duration",
    "--shadow-keycap",
    "--shadow-mahjong",
    "--shadow-keycap-pressed",
    "--shadow-mahjong-pressed",
  ])
    assert.ok(css.includes(`var(${variable})`), variable);
  assert.ok(
    css.includes('[aria-selected="true"]') &&
      css.includes(":focus-visible") &&
      css.includes(":disabled"),
  );
});

test("tabs defaults preserve flat classes and orientation applies matching root list semantics", () => {
  assert.deepEqual(
    classes(render()),
    classes(
      render({
        appearance: "default",
        variant: "outline",
        size: "md",
        orientation: "horizontal",
      }),
    ),
  );
  const vertical = render({
    orientation: "vertical",
    activationMode: "manual",
  });
  assert.ok(
    vertical.includes('aria-orientation="vertical"') &&
      vertical.includes('data-orientation="vertical"'),
  );
  assert.ok(
    classes(vertical).includes("sm:flex-row") &&
      classes(vertical).includes("items-stretch"),
  );
  for (const value of [
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "disabled:opacity-50",
    "disabled:cursor-not-allowed",
  ])
    assert.ok(classes(vertical).includes(value));
});

test("tabs content and trigger native style values remain available", () => {
  const html = render(
    {},
    { style: { "max-width": "var(--trigger-width)" } },
    { style: "max-width: var(--panel-width);" },
  );
  assert.match(html, /max-width:\s*var\(--trigger-width\)/);
  assert.match(html, /max-width:\s*var\(--panel-width\)/);
});

test("tabs trigger labels have a shrinkable flex child so long words can wrap on narrow screens", () => {
  const label =
    "VeryLongUnbrokenTabLabelForNarrowScreenWithoutHorizontalOverflow";
  const html = render({}, { children: label, title: "Native trigger" });
  assert.match(
    html,
    new RegExp(
      `<button\\b[^>]*title="Native trigger"[^>]*><span class="min-w-0 break-words">${label}</span></button>`,
    ),
  );
  assert.match(
    render({}, { children: 0 }),
    /<button\b[^>]*><span class="min-w-0 break-words">0<\/span><\/button>/,
  );
});

test("tabs parts require their root and hide force-mounted inactive panels without hand-written keyboard or focus management", async () => {
  for (const part of ["List", "Trigger", "Content"])
    assert.throws(
      () => renderToString(() => Tabs[part]({ value: "a", children: "Child" })),
      /Tabs parts must be used within Tabs/,
    );
  const source = await readFile(
      new URL("../src/components/Tabs/Tabs.tsx", import.meta.url),
      "utf8",
    ),
    css = await readFile(
      new URL("../src/components/Tabs/Tabs.css", import.meta.url),
      "utf8",
    );
  assert.ok(
    source.includes('from "@kobalte/core/tabs"') &&
      source.includes("onChange={local.onValueChange}"),
  );
  assert.doesNotMatch(
    source,
    /onKeyDown=|addEventListener|setTimeout|\.focus\(|createSignal|createEffect/,
  );
  assert.match(
    css,
    /\.solid-tabs-content:not\(\[data-selected\]\)\s*\{\s*display:\s*none;/,
  );
});

test("tabs demo includes all appearances variants sizes controlled inputs manual vertical disabled and wrapping examples", () => {
  const html = renderToString(() => TabsDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["outline", "ghost"])
      for (const size of ["sm", "md", "lg"])
        assert.ok(html.includes(`id="tabs-${appearance}-${variant}-${size}"`));
  for (const id of [
    "tabs-live",
    "tabs-name",
    "tabs-toggle-manual",
    "tabs-toggle-vertical",
    "tabs-toggle-disabled",
    "tabs-all-disabled",
    "tabs-auto",
    "tabs-long",
    "tabs-live-status",
  ])
    assert.ok(html.includes(`id="${id}"`), id);
  assert.ok(html.includes("forceMount") && html.includes("Home/End"));
});
