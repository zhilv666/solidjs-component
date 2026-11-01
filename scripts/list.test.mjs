import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness,
  List,
  ListDemo,
  AppearanceProvider,
  normalizeListKeys,
  validateListItems;
before(async () => {
  harness = await createComponentHarness("list");
  ({ List } = await harness.load("/src/components/index.ts"));
  ({ ListDemo } = await harness.load("/src/components/List/List.demo.tsx"));
  ({ AppearanceProvider } = await harness.load("/src/theme/appearance.tsx"));
  ({ normalizeListKeys, validateListItems } = await harness.load(
    "/src/components/List/state.ts",
  ));
});
after(async () => await harness?.close());

const items = [
  { value: "a", label: "Alpha", description: "First item" },
  { value: "disabled", label: "Disabled", disabled: true },
  { value: "b", label: "Beta", description: 0 },
];
const render = (props = {}) => renderToString(() => List({ items, ...props }));
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );
const options = (html) =>
  [...html.matchAll(/<li\b[^>]*role="option"[^>]*>/g)].map((match) => match[0]);

test("display lists retain native ul/li semantics, attributes, classes, icons and action slots", () => {
  const html = render({
    id: "display",
    title: "Native list",
    class: "w-64",
    "aria-label": "Projects",
    items: [{ ...items[0], icon: "Icon" }],
    renderAction: (item) => `Action ${item.label}`,
  });
  assert.match(
    html,
    /<ul\b[^>]*id="display"[^>]*title="Native list"[^>]*aria-label="Projects"[^>]*class="[^"]*w-64\s*"/,
  );
  assert.match(html, /data-list-key="a"/);
  assert.ok(
    html.includes("Action Alpha") &&
      html.includes("Icon") &&
      html.includes('aria-hidden="true"'),
  );
  assert.doesNotMatch(
    html,
    /role="(?:listbox|option)"|tabIndex=|aria-selected=/,
  );
  assert.doesNotMatch(
    html,
    /\s(?:items|variant|size|appearance|selectionMode|renderAction|emptyContent)=/,
  );
});

test("single and multiple selection remain Kobalte-owned with explicit controlled-empty support", () => {
  const single = render({ selectionMode: "single", defaultValue: ["b"] });
  assert.ok(single.includes('role="listbox"'));
  assert.equal(
    options(single).filter((option) => option.includes('aria-selected="true"'))
      .length,
    1,
  );
  assert.ok(options(single)[2].includes('aria-selected="true"'));
  const multi = render({ selectionMode: "multiple", defaultValue: ["a", "b"] });
  assert.ok(multi.includes('aria-multiselectable="true"'));
  assert.equal(
    options(multi).filter((option) => option.includes('aria-selected="true"'))
      .length,
    2,
  );
  const fixed = render({
    selectionMode: "multiple",
    value: [],
    defaultValue: ["a"],
  });
  assert.ok(
    options(fixed).every((option) => option.includes('aria-selected="false"')),
  );
  assert.ok(options(single)[1].includes('aria-disabled="true"'));
  assert.doesNotMatch(
    multi,
    /\s(?:value|defaultValue|onValueChange|disallowEmptySelection)=/,
  );
});

test("selection keys are deduplicated, validated against live items, and bounded in single mode", () => {
  assert.deepEqual(
    normalizeListKeys(["b", "missing", "a", "b"], items, "multiple"),
    ["b", "a"],
  );
  assert.deepEqual(normalizeListKeys(["b", "a"], items, "single"), ["b"]);
  assert.deepEqual(normalizeListKeys(["a"], items, "none"), []);
  assert.deepEqual(normalizeListKeys(["b"], items.slice(0, 1), "single"), []);
  const reordered = validateListItems([...items].reverse());
  assert.equal(reordered[0], items[2]);
  for (const invalid of [
    [{ value: "", label: "Empty" }],
    [{ value: " ", label: "Blank" }],
    [items[0], items[0]],
  ])
    assert.throws(() => render({ items: invalid }), /unique, non-empty/);
});

test("empty and numeric descriptions remain readable without introducing fake selectable options", () => {
  assert.match(render(), /class="text-md text-fg-muted">0<\/div>/);
  const emptyDisplay = render({ items: [], emptyContent: "No projects" });
  assert.ok(
    emptyDisplay.includes("No projects") && emptyDisplay.includes("<li"),
  );
  const emptySelect = render({ items: [], selectionMode: "multiple" });
  assert.ok(
    emptySelect.includes('role="status"') && emptySelect.includes("No items"),
  );
  assert.equal(options(emptySelect).length, 0);
});

test("list appearances reach static frames and available options but never add actions to selection mode", () => {
  for (const appearance of ["keycap", "mahjong"]) {
    const display = render({ appearance });
    assert.ok(display.includes(`shadow-${appearance}`));
    assert.doesNotMatch(display, /active:|cursor-pointer|role="option"/);
    const html = render({ appearance, selectionMode: "multiple" });
    const optionClasses = [
      ...html.matchAll(/<li\b[^>]*role="option"[^>]*class="([^"]*)"/g),
    ].map((match) => match[1]);
    assert.ok(optionClasses[0].includes(`active:shadow-${appearance}-pressed`));
    assert.ok(
      optionClasses[1].includes("shadow-sm") &&
        !optionClasses[1].includes(`shadow-${appearance}`),
    );
    const disabled = render({
      appearance,
      selectionMode: "single",
      disabled: true,
    });
    assert.ok(
      options(disabled).every((option) =>
        option.includes('aria-disabled="true"'),
      ),
    );
    assert.doesNotMatch(disabled, /shadow-(?:keycap|mahjong)/);
    assert.doesNotMatch(html, /<button\b|<input\b/);
  }
});

test("every list variant size appearance selection and disabling state uses valid token utilities", async () => {
  const names = new Set();
  for (const variant of ["outline", "plain"])
    for (const size of ["sm", "md", "lg"])
      for (const appearance of ["default", "keycap", "mahjong"])
        for (const selectionMode of ["none", "single", "multiple"])
          for (const disabled of [false, true])
            for (const name of classes(
              render({ variant, size, appearance, selectionMode, disabled }),
            ))
              if (
                name !== "solid-list-option" &&
                name !== "solid-list-description"
              )
                names.add(name);
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const variable of [
    "--color-fg",
    "--color-fg-muted",
    "--color-surface",
    "--radius-md",
    "--radius-sm",
    "--font-size-md",
    "--font-size-lg",
    "--shadow-keycap",
    "--shadow-mahjong",
    "--transition-duration",
  ])
    assert.ok(css.includes(`var(${variable})`), variable);
  assert.ok(
    css.includes(":focus-visible") && css.includes('[aria-disabled="true"]'),
  );
});

test("list global appearance inheritance and explicit override preserve original default classes", () => {
  for (const appearance of ["default", "keycap", "mahjong"]) {
    const inherited = renderToString(() =>
      AppearanceProvider({
        appearance,
        get children() {
          return List({ items, selectionMode: "single" });
        },
      }),
    );
    assert.deepEqual(
      classes(inherited),
      classes(render({ appearance, selectionMode: "single" })),
    );
    const explicit = renderToString(() =>
      AppearanceProvider({
        appearance,
        get children() {
          return List({
            items,
            appearance: "default",
            selectionMode: "single",
          });
        },
      }),
    );
    assert.deepEqual(
      classes(explicit),
      classes(render({ selectionMode: "single" })),
    );
  }
});

test("list styling delegates keyboard, focus, naming, descriptions and selection to Kobalte", async () => {
  const source = await readFile(
    new URL("../src/components/List/List.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../src/components/List/List.css", import.meta.url),
    "utf8",
  );
  assert.ok(
    source.includes('from "@kobalte/core/listbox"') &&
      source.includes("ListboxItemLabel") &&
      source.includes("ListboxItemDescription"),
  );
  assert.doesNotMatch(
    source,
    /onKeyDown=|addEventListener|setTimeout|\.focus\(|createSignal|createEffect/,
  );
  assert.ok(
    css.includes("[data-selected]") &&
      css.includes("[data-disabled]") &&
      css.includes("var(--color-primary-fg)"),
  );
});

test("list selectable surfaces render by stable collection keys without replacing Kobalte state or enabling virtual scrolling", async () => {
  const source = await readFile(
    new URL("../src/components/List/List.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(
    source.includes("as={ListboxSurface}") &&
      source.includes("<For each={keys()}>") &&
      source.includes("collection().getItem(key)"),
  );
  assert.doesNotMatch(source, /virtualized=|state=|keyboardDelegate=/);
});

test("list demo covers every appearance variant size, controlled choices, disabled items, display actions, emptiness and wrapping", () => {
  const html = renderToString(() => ListDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["outline", "plain"])
      for (const size of ["sm", "md", "lg"])
        assert.ok(html.includes(`id="list-${appearance}-${variant}-${size}"`));
  for (const id of [
    "list-single",
    "list-multiple",
    "list-fixed",
    "list-display",
    "list-empty",
    "list-empty-selectable",
    "list-long",
    "list-live-status",
    "list-toggle-order",
    "list-toggle-disabled",
  ])
    assert.ok(html.includes(`id="${id}"`), id);
  assert.ok(html.includes("Home/End") && html.includes("Ctrl+A"));
});
