import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness;
let Checkbox;
let CheckboxDemo;
before(async () => {
  harness = await createComponentHarness("checkbox");
  ({ Checkbox } = await harness.load("/src/components/index.ts"));
  ({ CheckboxDemo } = await harness.load(
    "/src/components/Checkbox/Checkbox.demo.tsx",
  ));
});
after(async () => await harness?.close());

const render = (props = {}) => renderToString(() => Checkbox(props));
const native = (html) =>
  html.match(/<input\b(?:[^>"']|"[^"]*"|'[^']*')*>/)?.[0];
const classes = (html) =>
  [...html.matchAll(/\bclass="([^"]*)"/g)].flatMap((match) =>
    match[1].split(/\s+/).filter(Boolean),
  );

test("checkbox exports native semantics, accessible labels and explicit defaults", () => {
  const html = render({
    id: "consent",
    name: "consent",
    value: "yes",
    children: "Agree",
    title: "Native title",
    class: "w-full",
    "aria-describedby": "consent-help",
  });
  const input = native(html);
  for (const attribute of [
    'type="checkbox"',
    'id="consent"',
    'name="consent"',
    'value="yes"',
    'title="Native title"',
    'aria-describedby="consent-help"',
  ])
    assert.ok(input.includes(attribute), attribute);
  assert.match(html, /<label\b[^>]*for="consent"[^>]*>Agree<\/label>/);
  const rootClasses = html
    .match(/\bclass="([^"]*)"/)[1]
    .trim()
    .split(/\s+/);
  assert.ok(rootClasses.includes("min-h-10"));
  assert.equal(rootClasses.at(-1), "w-full");
  assert.ok(classes(html).includes("h-5"));
  assert.doesNotMatch(
    input,
    /\s(?:checked|disabled|readonly|required)(?:\s|=|>)/,
  );
  assert.doesNotMatch(
    input,
    /(?:defaultChecked|onCheckedChange|prop:defaultChecked|\ssize=)/,
  );
  assert.ok(native(render()).includes('name=""'));
  assert.ok(native(render()).includes('value="on"'));
  assert.ok(native(render({ type: "radio" })).includes('type="checkbox"'));
});

test("checkbox renders checked/mixed indicators and native controlled states", () => {
  assert.match(native(render({ defaultChecked: true })), /\schecked(?:\s|=|>)/);
  assert.doesNotMatch(
    native(render({ checked: false, defaultChecked: true })),
    /\schecked(?:\s|=|>)/,
  );
  assert.ok(render({ checked: true }).includes('d="m6 12 4 4 8-8"'));
  assert.ok(render({ indeterminate: true }).includes('d="M5 12h14"'));
  assert.ok(render({ indeterminate: true }).includes('data-indeterminate=""'));
  assert.ok(!render().includes("<svg"));
  assert.match(native(render({ value: 0 })), /\svalue="0"/);
});

test("Kobalte supplies invalid/required/disabled/readonly attributes", () => {
  const input = native(
    render({
      invalid: true,
      required: true,
      disabled: true,
      readOnly: true,
      "aria-invalid": false,
    }),
  );
  for (const state of ["invalid", "required", "disabled", "readonly"]) {
    assert.match(input, new RegExp(`\\saria-${state}="true"`));
    assert.match(input, new RegExp(`\\sdata-${state}=""`));
  }
  for (const state of ["required", "disabled", "readonly"])
    assert.match(input, new RegExp(`\\s${state}(?:\\s|=|>)`));
  assert.match(native(render({ readonly: true })), /\sreadonly(?:\s|=|>)/);
  assert.doesNotMatch(
    native(render({ readonly: true, readOnly: false })),
    /\sreadonly(?:\s|=|>)/,
  );
  assert.ok(classes(render({ invalid: true })).includes("border-danger"));
  for (const state of [{}, { checked: true }, { indeterminate: true }]) {
    const colorClasses = classes(render({ ...state, invalid: true })).filter(
      (name) => /^border-(?:border|primary|danger)$/.test(name),
    );
    assert.deepEqual(colorClasses, ["border-danger"]);
  }
});

test("checkbox generates all size/state styles and maps native focus to its visible control", async () => {
  const names = new Set();
  for (const size of ["sm", "md", "lg"])
    for (const checked of [false, true])
      for (const indeterminate of [false, true])
        for (const invalid of [false, true])
          for (const disabled of [false, true])
            for (const readOnly of [false, true])
              for (const name of classes(
                render({
                  size,
                  checked,
                  indeterminate,
                  invalid,
                  disabled,
                  readOnly,
                }),
              ))
                names.add(name);
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    if (name !== "peer")
      assert.ok(matched.has(name), `Missing utility: ${name}`);
  assert.ok(css.includes(".peer:focus-visible~"));
  assert.ok(css.includes("--un-ring-width:2px"));
  assert.ok(css.includes("var(--color-ring)"));
  assert.ok(names.has("disabled:opacity-50"));
  assert.ok(names.has("disabled:cursor-not-allowed"));
  assert.ok(names.has("opacity-50"));
  assert.ok(
    [...names].every(
      (name) =>
        !/(keycap|mahjong|translate|scale|transform|gradient)/.test(name),
    ),
  );
});

test("disabled/read-only checkboxes omit interactive visual states", () => {
  for (const props of [{ disabled: true }, { readOnly: true }]) {
    const names = classes(render(props));
    assert.ok(!names.some((name) => /^(hover|active):/.test(name)));
    assert.ok(!names.includes("cursor-pointer"));
  }
  assert.ok(classes(render()).includes("hover:not-active:bg-surface-hover"));
  assert.ok(
    classes(render({ checked: true })).includes("active:bg-primary-active"),
  );
});

test("checkbox supports aria-label without adding an empty visible label", () => {
  const html = render({ "aria-label": "Auto save" });
  assert.ok(native(html).includes('aria-label="Auto save"'));
  assert.ok(!html.includes("<label"));
  assert.ok(render({ children: 0 }).includes(">0</label>"));
});

test("checkbox demo covers all sizes/states and controlled native form examples", () => {
  const html = renderToString(() => CheckboxDemo());
  for (const state of [
    "unchecked",
    "checked",
    "mixed",
    "invalid",
    "disabled",
    "disabled-checked",
    "readonly",
  ])
    for (const size of ["sm", "md", "lg"])
      assert.ok(html.includes(`id="checkbox-${state}-${size}"`));
  for (const id of [
    "checkbox-controlled",
    "checkbox-consent",
    "checkbox-newsletter",
    "checkbox-icon-only",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('type="submit"'));
  assert.ok(html.includes('type="reset"'));
  assert.ok(html.includes('data-demo="class-passthrough"'));
});

test("checkbox appearance defaults preserve original classes, labels and native forwarding", () => {
  assert.deepEqual(
    classes(render()),
    classes(render({ appearance: "default" })),
  );
  for (const appearance of ["keycap", "mahjong"]) {
    const html = render({
      appearance,
      id: "consent",
      name: "consent",
      value: "yes",
      children: "Agree",
      class: "w-full",
    });
    assert.doesNotMatch(html, /\sappearance=/);
    assert.ok(
      native(html).includes('name="consent"') && html.includes('for="consent"'),
    );
    assert.ok(
      html
        .match(/class="([^"]*)"/)[1]
        .trim()
        .endsWith("w-full"),
    );
    assert.doesNotMatch(native(html), /shadow-/);
  }
});
test("checkbox appearance shadows preserve checked/mixed/invalid/focus and unavailable states", async () => {
  const names = new Set();
  for (const appearance of ["keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const state of [
        {},
        { checked: true },
        { indeterminate: true },
        { checked: true, invalid: true },
        { disabled: true },
        { readOnly: true },
        { readonly: true },
      ]) {
        const html = render({ appearance, size, ...state }),
          values = classes(html);
        const unavailable = state.disabled || state.readOnly || state.readonly;
        assert.ok(
          values.includes(unavailable ? "shadow-sm" : `shadow-${appearance}`),
        );
        assert.equal(
          values.includes(`peer-active:shadow-${appearance}-pressed`),
          !unavailable,
        );
        assert.equal(
          values.includes(`active:shadow-${appearance}-pressed`),
          !unavailable,
        );
        assert.ok(values.includes("peer-focus-visible:ring-ring"));
        if (state.invalid) assert.ok(values.includes("border-danger"));
        if (state.checked || state.indeterminate)
          assert.ok(
            values.includes("bg-primary") && values.includes("text-primary-fg"),
          );
        for (const name of values) names.add(name);
      }
  const uno = await createGenerator(unoConfig),
    { matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    if (name !== "peer")
      assert.ok(matched.has(name), `Missing utility: ${name}`);
});
test("checkbox appearance demo covers every size and selection/availability state", () => {
  const html = renderToString(() => CheckboxDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const state of [
        "unchecked",
        "checked",
        "mixed",
        "invalid",
        "disabled",
        "disabled-checked",
        "readonly",
      ])
        assert.ok(
          html.includes(`id="checkbox-${appearance}-${state}-${size}"`),
        );
});
