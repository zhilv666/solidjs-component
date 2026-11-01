import assert from "node:assert/strict";
import { resolve } from "node:path";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness;
let Textarea;
let TextareaDemo;

before(async () => {
  harness = await createComponentHarness("textarea");
  ({ Textarea } = await harness.load("/src/components/index.ts"));
  ({ TextareaDemo } = await harness.load(
    "/src/components/Textarea/Textarea.demo.tsx",
  ));
});

after(async () => await harness?.close());

function render(props = {}) {
  return renderToString(() => Textarea(props));
}

function tag(html) {
  const result = html.match(/<textarea\b(?:[^>"']|"[^"]*"|'[^']*')*>/)?.[0];
  assert.ok(result, "Expected a native textarea");
  return result;
}

function classes(html) {
  return tag(html)
    .match(/\sclass="([^"]*)"/)[1]
    .trim()
    .split(/\s+/);
}

test("textarea harness isolates cache and disables HMR/WebSocket", () => {
  assert.notEqual(
    resolve(harness.config.cacheDir),
    resolve(harness.config.root, "node_modules/.vite"),
  );
  assert.equal(harness.config.server.hmr, false);
  assert.equal(harness.config.server.ws, false);
});

test("textarea forwards native attributes and class with explicit defaults", () => {
  const html = render({
    id: "notes",
    name: "notes",
    title: "Native title",
    maxlength: 200,
    "aria-label": "Notes",
    "aria-describedby": "notes-help",
    class: "max-w-md",
  });
  const native = tag(html);
  for (const attribute of [
    'id="notes"',
    'name="notes"',
    'rows="3"',
    'maxlength="200"',
    'title="Native title"',
    'aria-label="Notes"',
    'aria-describedby="notes-help"',
  ]) {
    assert.ok(native.includes(attribute), `Missing ${attribute}`);
  }
  assert.equal(classes(html).at(-1), "max-w-md");
  assert.ok(classes(html).includes("min-h-28"));
  assert.ok(classes(html).includes("resize-y"));
  assert.doesNotMatch(
    native,
    /\s(?:size|invalid|autoResize|defaultValue|onValueChange)=/,
  );
  assert.doesNotMatch(native, /prop:defaultValue/);
  assert.doesNotMatch(native, /\s(?:disabled|readonly|required)(?:\s|=|>)/);
  assert.match(tag(render({ rows: 6 })), /\srows="6"/);
  assert.match(tag(render()), /\sname=""/);
});

test("textarea renders initial and controlled multiline values as native text", () => {
  assert.ok(
    render({ defaultValue: "\nFirst line" }).includes(
      "\n\nFirst line</textarea>",
    ),
  );
  assert.ok(
    render({ defaultValue: "第一行\nSecond line" }).includes(
      "第一行\nSecond line</textarea>",
    ),
  );
  const html = render({ value: "Controlled\nValue", defaultValue: "Ignored" });
  assert.ok(html.includes("Controlled\nValue</textarea>"));
  assert.ok(!html.includes("Ignored"));
  assert.ok(render({ value: 0 }).includes(">0</textarea>"));
  assert.ok(
    render({ value: "<script>&" }).includes("&lt;script>&amp;</textarea>"),
  );
});

test("textarea invalid/required/disabled/readonly are provided by Kobalte", () => {
  const native = tag(
    render({
      invalid: true,
      required: true,
      disabled: true,
      readOnly: true,
      "aria-invalid": false,
    }),
  );
  for (const state of ["invalid", "required", "disabled", "readonly"]) {
    assert.match(native, new RegExp(`\\saria-${state}="true"`));
    assert.match(native, new RegExp(`\\sdata-${state}=""`));
  }
  for (const state of ["required", "disabled", "readonly"]) {
    assert.match(native, new RegExp(`\\s${state}(?:\\s|=|>)`));
  }
  assert.ok(classes(render({ invalid: true })).includes("border-danger"));
  assert.match(tag(render({ readonly: true })), /\sreadonly(?:\s|=|>)/);
  assert.doesNotMatch(
    tag(render({ readonly: true, readOnly: false })),
    /\sreadonly(?:\s|=|>)/,
  );
});

test("every textarea size/state/resize utility is generated from existing tokens", async () => {
  const names = new Set();
  for (const size of ["sm", "md", "lg"]) {
    for (const invalid of [false, true]) {
      for (const disabled of [false, true]) {
        for (const readOnly of [false, true]) {
          for (const autoResize of [false, true]) {
            for (const name of classes(
              render({ size, invalid, disabled, readOnly, autoResize }),
            ))
              names.add(name);
          }
        }
      }
    }
  }
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const name of [
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "disabled:opacity-50",
    "disabled:cursor-not-allowed",
    "duration-token",
    "text-md",
    "text-lg",
    "font-normal",
  ])
    assert.ok(names.has(name));
  for (const variable of ["--color-ring", "--color-danger", "--radius-md"])
    assert.ok(css.includes(`var(${variable})`));
  assert.ok(
    [...names].every(
      (name) =>
        !/(?:keycap|mahjong|translate|scale|transform|gradient)/.test(name),
    ),
  );
});

test("textarea hover excludes active and disabled states", async () => {
  const uno = await createGenerator(unoConfig);
  const { css } = await uno.generate(
    [...classes(render()), ...classes(render({ invalid: true }))].join(" "),
  );
  const rules = css.split("\n").filter((rule) => rule.includes("\\:hover\\:"));
  assert.equal(rules.length, 2);
  for (const rule of rules) {
    assert.ok(rule.includes(":enabled"));
    assert.ok(rule.includes(":not(:active)"));
  }
});

test("auto-resize uses the Kobalte option without leaking custom DOM props", () => {
  const html = render({ autoResize: true });
  assert.ok(classes(html).includes("resize-none"));
  assert.doesNotMatch(tag(html), /\s(?:autoResize|submitOnEnter)=/);
});

test("textarea demo covers all sizes/states and native controlled/form examples", () => {
  const html = renderToString(() => TextareaDemo());
  for (const state of [
    "常规 / Default",
    "错误 / Invalid",
    "禁用 / Disabled",
    "只读 / Read only",
  ]) {
    for (const size of ["sm", "md", "lg"])
      assert.ok(html.includes(`aria-label="${state} ${size}"`));
  }
  for (const size of ["sm", "md", "lg"]) {
    assert.ok(html.includes(`aria-describedby="textarea-${size}-error"`));
    assert.ok(html.includes(`id="textarea-${size}-error"`));
  }
  for (const id of [
    "textarea-controlled",
    "textarea-native-form",
    "textarea-notes",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('name="notes"'));
  assert.ok(html.includes('type="submit"'));
  assert.ok(html.includes('type="reset"'));
  assert.ok(html.includes('data-demo="class-passthrough"'));
  assert.ok(html.includes("SolidJS\n组件库</textarea>"));
});

test("textarea appearance defaults preserve original classes, native content and class forwarding", () => {
  assert.deepEqual(
    classes(render()),
    classes(render({ appearance: "default" })),
  );
  for (const appearance of ["keycap", "mahjong"]) {
    const html = render({
      appearance,
      name: "notes",
      defaultValue: "First\nSecond",
      class: "max-w-md",
    });
    assert.equal(classes(html).at(-1), "max-w-md");
    assert.ok(
      html.includes("First\nSecond</textarea>") &&
        html.includes('name="notes"'),
    );
    assert.doesNotMatch(html, /\sappearance=/);
  }
});
test("textarea appearances keep validation/focus/resize and flatten unavailable controls", async () => {
  const names = new Set();
  for (const appearance of ["keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const autoResize of [false, true])
        for (const state of [
          {},
          { invalid: true },
          { disabled: true },
          { readOnly: true },
          { readonly: true },
        ]) {
          const values = classes(
            render({ appearance, size, autoResize, ...state }),
          );
          const unavailable =
            state.disabled || state.readOnly || state.readonly;
          assert.ok(
            values.includes(unavailable ? "shadow-sm" : `shadow-${appearance}`),
          );
          assert.equal(
            values.includes(`enabled:active:shadow-${appearance}-pressed`),
            !unavailable,
          );
          assert.ok(
            values.includes("focus-visible:ring-ring") &&
              values.includes(autoResize ? "resize-none" : "resize-y"),
          );
          assert.ok(
            values.includes(state.invalid ? "border-danger" : "border-border"),
          );
          for (const name of values) names.add(name);
        }
  const uno = await createGenerator(unoConfig),
    { matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
});
test("textarea appearance demo covers every size and state", () => {
  const html = renderToString(() => TextareaDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const state of ["default", "invalid", "disabled", "readonly"])
        assert.ok(
          html.includes(`id="textarea-${appearance}-${state}-${size}"`),
        );
});
