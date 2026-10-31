import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Radio, RadioGroup, RadioGroupDemo, synchronizeRadioInputs;
before(async () => {
  harness = await createComponentHarness("radio");
  ({ Radio, RadioGroup } = await harness.load("/src/components/index.ts"));
  ({ synchronizeRadioInputs } = await harness.load(
    "/src/components/Radio/Radio.tsx",
  ));
  ({ RadioGroupDemo } = await harness.load(
    "/src/components/RadioGroup/RadioGroup.demo.tsx",
  ));
});
after(async () => await harness?.close());
const inputs = (html) =>
  [...html.matchAll(/<input\b(?:[^>"']|"[^"]*"|'[^']*')*>/g)].map(
    (match) => match[0],
  );
const classes = (html) =>
  [...html.matchAll(/\bclass="([^"]*)"/g)].flatMap((match) =>
    match[1].split(/\s+/).filter(Boolean),
  );
function render(groupProps = {}, radioProps = {}) {
  return renderToString(() =>
    RadioGroup({
      ...groupProps,
      get children() {
        return [
          Radio({
            id: "radio-a",
            value: "a",
            children: "Option A",
            ...radioProps,
          }),
          Radio({ id: "radio-b", value: "b", children: "Option B" }),
        ];
      },
    }),
  );
}

test("radio group exports native semantics, names, labels and explicit defaults", () => {
  const html = render(
    { id: "choice", name: "choice", "aria-label": "Choice", class: "w-full" },
    {
      title: "Native title",
      class: "max-w-md",
      "aria-describedby": "choice-help",
    },
  );
  assert.match(html, /role="radiogroup"/);
  assert.match(html, /aria-orientation="vertical"/);
  assert.ok(html.includes('aria-label="Choice"'));
  assert.ok(html.includes('title="Native title"'));
  for (const input of inputs(html)) {
    assert.ok(input.includes('type="radio"'));
    assert.ok(input.includes('name="choice"'));
  }
  assert.ok(inputs(html)[0].includes('aria-describedby="choice-help"'));
  assert.ok(classes(html).includes("h-5"));
  assert.match(html, /<label\b[^>]*>Option A<\/label>/);
  const root = html
    .match(/\bclass="([^"]*)"/)[1]
    .trim()
    .split(/\s+/);
  assert.equal(root.at(-1), "w-full");
  for (const input of inputs(html))
    assert.doesNotMatch(input, /(?:\ssize=|defaultValue|prop:defaultChecked)/);
});

test("radio controlled/default values select only one item", () => {
  assert.match(inputs(render({ defaultValue: "a" }))[0], /\schecked(?:\s|=|>)/);
  assert.doesNotMatch(
    inputs(render({ defaultValue: "a" }))[1],
    /\schecked(?:\s|=|>)/,
  );
  const controlled = inputs(render({ value: "b", defaultValue: "a" }));
  assert.doesNotMatch(controlled[0], /\schecked(?:\s|=|>)/);
  assert.match(controlled[1], /\schecked(?:\s|=|>)/);
  assert.ok(
    inputs(render()).every((input) => !/\schecked(?:\s|=|>)/.test(input)),
  );
  assert.ok(
    inputs(render({}, { type: "checkbox" }))[0].includes('type="radio"'),
  );
});

test("read-only native synchronization mirrors Kobalte and does not affect nested groups", () => {
  const nestedRoot = {};
  const root = { querySelectorAll: () => fields };
  const fields = [
    { value: "a", checked: false, closest: () => root },
    { value: "b", checked: true, closest: () => root },
    { value: "c", checked: true, closest: () => nestedRoot },
  ];
  const reads = [];
  synchronizeRadioInputs(fields[1], (value) => {
    reads.push(value);
    return value === "a";
  });
  assert.deepEqual(
    fields.map((field) => field.checked),
    [true, false, true],
  );
  assert.deepEqual(reads, ["a", "b"]);
  assert.doesNotThrow(() =>
    synchronizeRadioInputs({ closest: () => null }, () => {
      throw new Error("Unexpected selection read");
    }),
  );
});

test("radio group validation and disabled/read-only states remain Kobalte-owned", () => {
  const html = render({
    invalid: true,
    required: true,
    disabled: true,
    readOnly: true,
    "aria-invalid": false,
  });
  for (const state of ["invalid", "required", "disabled", "readonly"])
    assert.ok(html.includes(`aria-${state}="true"`));
  for (const input of inputs(html)) {
    for (const state of ["required", "disabled", "readonly"])
      assert.match(input, new RegExp(`\\s${state}(?:\\s|=|>)`));
  }
  const colorClasses = classes(render({ invalid: true, value: "a" })).filter(
    (name) => /^border-(?:border|primary|danger)$/.test(name),
  );
  assert.deepEqual(colorClasses, ["border-danger", "border-danger"]);
  assert.match(
    inputs(render({}, { disabled: true }))[0],
    /\sdisabled(?:\s|=|>)/,
  );
  assert.doesNotMatch(
    inputs(render({}, { disabled: true }))[1],
    /\sdisabled(?:\s|=|>)/,
  );
});

test("radio size inherits from the group and supports an individual override", () => {
  assert.ok(classes(render({ size: "sm" })).includes("h-4"));
  const names = classes(render({ size: "sm" }, { size: "lg" }));
  assert.ok(names.includes("h-6") && names.includes("h-4"));
  assert.ok(
    classes(render({ orientation: "horizontal" })).includes("flex-wrap"),
  );
  assert.throws(
    () => renderToString(() => Radio({ value: "a" })),
    /within RadioGroup/,
  );
});

test("all radio utilities are tokenized and native focus reaches the visible control", async () => {
  const names = new Set();
  for (const size of ["sm", "md", "lg"])
    for (const value of [undefined, "a"])
      for (const invalid of [false, true])
        for (const disabled of [false, true])
          for (const readOnly of [false, true])
            for (const orientation of ["vertical", "horizontal"])
              for (const name of classes(
                render({
                  size,
                  value,
                  invalid,
                  disabled,
                  readOnly,
                  orientation,
                }),
              ))
                names.add(name);
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    if (name !== "peer")
      assert.ok(matched.has(name), `Missing utility: ${name}`);
  assert.ok(
    css.includes(".peer:focus-visible~") &&
      css.includes("--un-ring-width:2px") &&
      css.includes("var(--color-ring)"),
  );
  assert.ok(
    [...names].every(
      (name) =>
        !/(keycap|mahjong|translate|scale|transform|gradient)/.test(name),
    ),
  );
});

test("disabled items cannot receive control clicks and noninteractive states omit hover/active", () => {
  assert.ok(
    classes(render({}, { disabled: true })).includes("pointer-events-none"),
  );
  for (const group of [{ disabled: true }, { readOnly: true }])
    assert.ok(
      !classes(render(group)).some((name) => /^(hover|active):/.test(name)),
    );
});

test("radio demo covers all sizes and states with controlled/native examples", () => {
  const html = renderToString(() => RadioGroupDemo());
  for (const state of ["default", "empty", "invalid", "disabled", "readonly"])
    for (const size of ["sm", "md", "lg"])
      for (const value of ["a", "b", "c"])
        assert.ok(html.includes(`id="radio-${state}-${size}-${value}"`));
  for (const id of [
    "radio-controlled-group",
    "radio-native-form",
    "radio-framework-solid",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('type="submit"') && html.includes('type="reset"'));
  assert.ok(html.includes('aria-label="手动保存"'));
});
