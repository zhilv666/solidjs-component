import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, FormField, Input, FormFieldDemo;
before(async () => {
  harness = await createComponentHarness("form-field");
  ({ FormField, Input } = await harness.load("/src/components/index.ts"));
  ({ FormFieldDemo } = await harness.load(
    "/src/components/FormField/FormField.demo.tsx",
  ));
});
after(async () => await harness?.close());
const render = (props = {}) =>
  renderToString(() =>
    FormField({
      label: "Username",
      controlId: "username",
      children: (field) => Input(field),
      ...props,
    }),
  );
const native = (html) =>
  html.match(/<input\b(?:[^>"']|"[^"]*"|'[^']*')*>/)?.[0];
const classes = (html) =>
  [...html.matchAll(/\bclass="([^"]*)"/g)].flatMap((match) =>
    match[1].split(/\s+/).filter(Boolean),
  );

test("form field renders matching native labels and help associations with root props/class", () => {
  const html = render({
    id: "root",
    description: "Help",
    title: "Native title",
    "data-test": "wrapper",
    class: "max-w-md",
  });
  assert.match(
    html,
    /<label\b[^>]*for="username"[^>]*id="username-label"[^>]*>Username<\/label>/,
  );
  assert.match(html, /<p\b[^>]*id="username-description"[^>]*>Help<\/p>/);
  assert.ok(
    native(html).includes('id="username"') &&
      native(html).includes('aria-labelledby="username-label"') &&
      native(html).includes('aria-describedby="username-description"'),
  );
  const root = html.match(/<div\b[^>]*>/)[0];
  assert.ok(
    root.includes('id="root"') &&
      root.includes('title="Native title"') &&
      root.includes('data-test="wrapper"'),
  );
  assert.equal(
    root
      .match(/class="([^"]*)"/)[1]
      .trim()
      .split(/\s+/)
      .at(-1),
    "max-w-md",
  );
  assert.doesNotMatch(
    root,
    /\s(?:controlId|description|invalid|required|disabled|group|size)=/,
  );
});
test("form field synchronizes size/invalid/disabled/required props to its control", () => {
  for (const size of ["sm", "md", "lg"]) {
    const html = render({
      size,
      invalid: true,
      disabled: true,
      required: true,
      description: "Help",
      error: "Invalid name",
    });
    const input = native(html);
    for (const attribute of [
      'aria-invalid="true"',
      'aria-describedby="username-description username-error"',
    ])
      assert.ok(input.includes(attribute));
    assert.match(input, /\srequired(?:\s|=|>)/);
    assert.match(input, /\sdisabled(?:\s|=|>)/);
    assert.match(
      html,
      /<p\b[^>]*id="username-error"[^>]*role="alert"[^>]*>Invalid name<\/p>/,
    );
    assert.ok(html.includes('aria-hidden="true"') && html.includes("*</span>"));
    assert.ok(classes(html).includes(size === "lg" ? "text-lg" : "text-md"));
  }
});
test("valid, missing and empty messages never leave stale ARIA references", () => {
  for (const error of [undefined, null, false, true, ""]) {
    const html = render({ invalid: true, error });
    assert.ok(
      !html.includes('id="username-error"') &&
        !native(html).includes("aria-describedby"),
    );
  }
  const valid = render({ error: "Not yet invalid" });
  assert.ok(
    !valid.includes("Not yet invalid") &&
      !native(valid).includes("username-error"),
  );
  const zero = render({ description: 0, error: 0, invalid: true });
  assert.match(zero, /id="username-description"[^>]*>0<\/p>/);
  assert.match(zero, /id="username-error"[^>]*>0<\/p>/);
});
test("description IDs combine, trim and deduplicate external references", () => {
  const html = render({
    description: "Help",
    error: "Error",
    invalid: true,
    describedBy: " external external username-description ",
  });
  assert.ok(
    native(html).includes(
      'aria-describedby="external username-description username-error"',
    ),
  );
});
test("group labels use spans and keep ARIA naming without an invalid for attribute", () => {
  const html = render({ group: true });
  assert.match(html, /<span\b[^>]*id="username-label"[^>]*>Username<\/span>/);
  assert.ok(!html.includes("<label") && !html.includes('for="username"'));
  assert.ok(native(html).includes('aria-labelledby="username-label"'));
});
test("generated control IDs are isolated and render props preserve component defaults", () => {
  const html = renderToString(() => [
    FormField({ label: "First", children: (field) => Input(field) }),
    FormField({ label: "Second", children: (field) => Input(field) }),
  ]);
  const ids = [...html.matchAll(/<input\b[^>]*id="([^"]+)"/g)].map(
    (match) => match[1],
  );
  assert.equal(ids.length, 2);
  assert.equal(new Set(ids).size, 2);
  for (const id of ids)
    assert.ok(
      html.includes(`for="${id}"`) && html.includes(`id="${id}-label"`),
    );
  let calls = 0;
  const rendered = render({
    children: (field) => {
      calls++;
      assert.equal(field.size, "md");
      assert.equal(field.invalid, false);
      assert.equal(field.disabled, false);
      assert.equal(field.required, false);
      return Input({ ...field, defaultValue: "SolidJS" });
    },
  });
  assert.equal(calls, 1);
  assert.ok(native(rendered).includes('value="SolidJS"'));
});
test("form field utilities use existing tokens and do not introduce interactive wrapper styles", async () => {
  const names = new Set();
  for (const size of ["sm", "md", "lg"])
    for (const disabled of [false, true])
      for (const name of classes(
        render({
          size,
          disabled,
          required: true,
          invalid: true,
          description: "Help",
          error: "Error",
        }),
      ))
        names.add(name);
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const token of [
    "--color-fg",
    "--color-fg-muted",
    "--color-danger",
    "--font-size-md",
    "--font-size-lg",
  ])
    assert.ok(css.includes(`var(${token})`));
  assert.ok(
    [...names].every((name) => !/keycap|mahjong|gradient|animate/.test(name)),
  );
});
test("form field demo covers every size/state with existing controls and a native form", () => {
  const html = renderToString(() => FormFieldDemo());
  for (const state of ["normal", "required", "invalid", "disabled"])
    for (const size of ["sm", "md", "lg"])
      assert.ok(html.includes(`id="form-field-${state}-${size}"`));
  for (const id of [
    "form-field-reactive",
    "form-field-bio",
    "form-field-language",
    "form-field-consent",
    "form-field-density",
    "form-field-native-form",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(
    html.includes('type="submit"') &&
      html.includes('type="reset"') &&
      html.includes('role="radiogroup"'),
  );
});
