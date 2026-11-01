import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { URL } from "node:url";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Select, SelectDemo;
before(async () => {
  harness = await createComponentHarness("select");
  ({ Select } = await harness.load("/src/components/index.ts"));
  ({ SelectDemo } = await harness.load(
    "/src/components/Select/Select.demo.tsx",
  ));
});
after(async () => await harness?.close());
const options = [
  { value: "solid", label: "SolidJS" },
  { value: "react", label: "React" },
  { value: "vue", label: "Vue", disabled: true },
];
const render = (props = {}) =>
  renderToString(() => Select({ options, ...props }));
const trigger = (html) =>
  html.match(/<button\b(?:[^>"']|"[^"]*"|'[^']*')*>/)?.[0];
const native = (html) =>
  html.match(/<select\b(?:[^>"']|"[^"]*"|'[^']*')*>/)?.[0];
const classes = (html) =>
  [...html.matchAll(/\bclass="([^"]*)"/g)].flatMap((match) =>
    match[1].split(/\s+/).filter(Boolean),
  );

test("select exposes a named native button trigger and hidden native form field", () => {
  const html = render({
    id: "framework",
    name: "framework",
    children: "Framework",
    "aria-describedby": "help",
    title: "Native title",
    class: "max-w-md",
    "data-test": "trigger",
  });
  for (const attribute of [
    'id="framework"',
    'type="button"',
    'aria-haspopup="listbox"',
    'aria-expanded="false"',
    'aria-describedby="help"',
    'title="Native title"',
    'data-test="trigger"',
  ])
    assert.ok(trigger(html).includes(attribute));
  assert.ok(
    native(html).includes('name="framework"') &&
      /\btabindex="-1"/i.test(native(html)),
  );
  assert.match(html, /<span\b[^>]*id="[^"]*-label"[^>]*>Framework<\/span>/);
  assert.ok(html.includes("请选择 / Select an option"));
  assert.equal(
    trigger(html)
      .match(/class="([^"]*)"/)[1]
      .trim()
      .split(/\s+/)
      .at(-1),
    "max-w-md",
  );
  assert.doesNotMatch(
    trigger(html),
    /\s(?:size|value|name|invalid|defaultOpen|defaultValue)=/,
  );
  assert.ok(trigger(render({ type: "submit" })).includes('type="button"'));
});
test("select renders string-keyed defaults and controlled null takes precedence", () => {
  assert.ok(render({ defaultValue: "react" }).includes(">React</span>"));
  assert.ok(
    render({ value: "solid", defaultValue: "react" }).includes(
      ">SolidJS</span>",
    ),
  );
  assert.ok(
    render({ value: null, defaultValue: "react" }).includes(
      "请选择 / Select an option",
    ),
  );
  assert.ok(render({ value: "missing" }).includes("请选择 / Select an option"));
  assert.doesNotMatch(trigger(render()), /\sdisabled(?:\s|=|>)/);
});
test("select supports invalid/disabled/required native semantics and external form ownership", () => {
  const html = render({
    invalid: true,
    disabled: true,
    required: true,
    form: "outside-form",
    "aria-invalid": false,
  });
  assert.ok(trigger(html).includes('aria-invalid="true"'));
  assert.match(trigger(html), /\sdisabled(?:\s|=|>)/);
  assert.match(native(html), /\srequired(?:\s|=|>)/);
  assert.match(native(html), /\sdisabled(?:\s|=|>)/);
  assert.ok(
    trigger(html).includes('form="outside-form"') &&
      native(html).includes('form="outside-form"'),
  );
  assert.deepEqual(
    classes(html).filter((name) => /^border-(border|danger)$/.test(name)),
    ["border-danger"],
  );
  assert.ok(!native(html).includes("multiple"));
});
test("select handles empty options, label-free ARIA naming, numeric labels and escaped option text", () => {
  assert.ok(
    render({
      options: [],
      placeholder: "No options",
      "aria-label": "Empty",
    }).includes("No options"),
  );
  assert.ok(!render({ "aria-label": "Framework" }).includes('-label"'));
  assert.match(
    render({ children: 0 }),
    /<span\b[^>]*id="[^"]*-label"[^>]*>0<\/span>/,
  );
  const escaped = render({
    options: [{ value: "<&", label: "<script>& option" }],
    defaultValue: "<&",
  });
  assert.ok(escaped.includes("&lt;script>&amp; option"));
  assert.ok(!escaped.includes("<script>"));
});
test("select utility maps generate token-only sizing, focus, interaction and disabled styles", async () => {
  const names = new Set();
  for (const size of ["sm", "md", "lg"])
    for (const invalid of [false, true])
      for (const disabled of [false, true])
        for (const name of classes(render({ size, invalid, disabled })))
          names.add(name);
  const source = await readFile(
    new URL("../src/components/Select/Select.tsx", import.meta.url),
    "utf8",
  );
  for (const literal of source.matchAll(/"(solid-select-option [^"]+)"/g))
    for (const name of literal[1].split(/\s+/))
      if (name !== "solid-select-option") names.add(name);
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const variable of [
    "--radius-md",
    "--font-size-md",
    "--font-size-lg",
    "--color-ring",
    "--transition-duration",
  ])
    assert.ok(css.includes(`var(${variable})`));
  for (const state of [
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "disabled:opacity-50",
    "disabled:cursor-not-allowed",
    "aria-disabled:opacity-50",
    "aria-disabled:cursor-not-allowed",
  ])
    assert.ok(names.has(state));
  assert.doesNotMatch(
    source,
    /keycap|mahjong|gradient|transition-all|animate-/,
  );
  for (const variable of [
    "--kb-popper-anchor-width",
    "--kb-popper-content-available-width",
    "--kb-popper-content-available-height",
  ])
    assert.ok(source.includes(`var(${variable})`));
});
test("select popover styles follow Kobalte selected/highlighted/disabled state without arbitrary variants", async () => {
  const source = await readFile(
    new URL("../src/components/Select/Select.css", import.meta.url),
    "utf8",
  );
  for (const token of [
    "primary",
    "primary-fg",
    "primary-hover",
    "primary-active",
    "surface-hover",
    "surface-active",
  ])
    assert.ok(source.includes(`var(--color-${token})`));
  assert.ok(
    source.includes("[data-selected][data-highlighted]:not([data-disabled])"),
  );
  assert.doesNotMatch(
    source,
    /#[\da-f]{3,8}\b|rgba?\(|hsla?\(|\d+px|transform|animation/i,
  );
});
test("select demo covers all sizes, states, native form and edge cases", () => {
  const html = renderToString(() => SelectDemo());
  for (const state of ["empty", "selected", "invalid", "disabled"])
    for (const size of ["sm", "md", "lg"])
      assert.ok(html.includes(`id="select-${state}-${size}"`));
  for (const id of [
    "select-controlled",
    "select-native-form",
    "select-framework",
    "select-no-options",
    "select-long-label",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('type="submit"') && html.includes('type="reset"'));
});

test("select appearance keeps default trigger classes and preserves native form forwarding", () => {
  assert.deepEqual(
    classes(render()),
    classes(render({ appearance: "default" })),
  );
  for (const appearance of ["keycap", "mahjong"]) {
    const html = render({
      appearance,
      name: "framework",
      defaultValue: "solid",
      class: "w-full",
    });
    assert.ok(trigger(html).includes(`shadow-${appearance}`));
    assert.ok(
      trigger(html).includes(`enabled:active:shadow-${appearance}-pressed`),
    );
    assert.doesNotMatch(trigger(html) + native(html), /\sappearance=/);
    assert.ok(native(html).includes('name="framework"'));
    assert.equal(
      trigger(html)
        .match(/class="([^"]*)"/)[1]
        .trim()
        .split(/\s+/)
        .at(-1),
      "w-full",
    );
    const unavailable = classes(render({ appearance, disabled: true }));
    assert.ok(unavailable.includes("shadow-sm"));
    assert.ok(!unavailable.some((name) => /keycap|mahjong/.test(name)));
  }
});

test("select appearance maps generate token shadows without conflicting popover defaults", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const invalid of [false, true])
        for (const disabled of [false, true])
          for (const name of classes(
            render({ appearance, size, invalid, disabled }),
          ))
            names.add(name);
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const appearance of ["keycap", "mahjong"])
    assert.ok(css.includes(`var(--shadow-${appearance})`));
  const source = await readFile(
    new URL("../src/components/Select/Select.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(source.includes('local.appearance === "default" && "shadow-md"'));
  assert.match(
    source,
    /getAppearanceClasses\(local\.appearance, "display", local\.disabled\)/,
  );
});

test("select demo shows every appearance, size and original selection state", () => {
  const html = renderToString(() => SelectDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const state of ["empty", "selected", "invalid", "disabled"])
        assert.ok(html.includes(`id="select-${appearance}-${state}-${size}"`));
});
