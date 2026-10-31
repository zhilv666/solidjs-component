import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";
let harness, Switch, SwitchDemo;
before(async () => {
  harness = await createComponentHarness("switch");
  ({ Switch } = await harness.load("/src/components/index.ts"));
  ({ SwitchDemo } = await harness.load(
    "/src/components/Switch/Switch.demo.tsx",
  ));
});
after(async () => await harness?.close());
const render = (props = {}) => renderToString(() => Switch(props));
const native = (html) =>
  html.match(/<input\b(?:[^>"']|"[^"]*"|'[^']*')*>/)?.[0];
const classes = (html) =>
  [...html.matchAll(/\bclass="([^"]*)"/g)].flatMap((match) =>
    match[1].split(/\s+/).filter(Boolean),
  );

test("switch exposes native checkbox/switch semantics, labels and defaults", () => {
  const html = render({
    id: "autosave",
    name: "autosave",
    value: "enabled",
    children: "Auto save",
    title: "Native title",
    class: "w-full",
    "aria-describedby": "autosave-help",
  });
  const input = native(html);
  for (const attribute of [
    'type="checkbox"',
    'role="switch"',
    'id="autosave"',
    'name="autosave"',
    'value="enabled"',
    'title="Native title"',
    'aria-describedby="autosave-help"',
  ])
    assert.ok(input.includes(attribute));
  assert.match(html, /<label\b[^>]*for="autosave"[^>]*>Auto save<\/label>/);
  assert.equal(
    html
      .match(/\bclass="([^"]*)"/)[1]
      .trim()
      .split(/\s+/)
      .at(-1),
    "w-full",
  );
  assert.ok(classes(html).includes("h-6") && classes(html).includes("w-11"));
  assert.doesNotMatch(
    input,
    /\s(?:checked|disabled|readonly|required)(?:\s|=|>)/,
  );
  assert.doesNotMatch(
    input,
    /(?:defaultChecked|prop:defaultChecked|\ssize=|\sinvalid=)/,
  );
  const forced = native(render({ type: "radio", role: "button" }));
  assert.ok(
    forced.includes('type="checkbox"') && forced.includes('role="switch"'),
  );
  assert.ok(
    native(render()).includes('name=""') &&
      native(render()).includes('value="on"'),
  );
});
test("switch checked state changes alignment without transform or position animation", () => {
  const checked = render({ defaultChecked: true });
  assert.match(native(checked), /\schecked(?:\s|=|>)/);
  assert.ok(native(checked).includes('aria-checked="true"'));
  assert.ok(classes(checked).includes("justify-end"));
  assert.ok(classes(render()).includes("justify-start"));
  assert.doesNotMatch(
    native(render({ checked: false, defaultChecked: true })),
    /\schecked(?:\s|=|>)/,
  );
  for (const html of [checked, render()])
    assert.ok(
      classes(html).every(
        (name) =>
          !/(transform|translate|scale|transition-all|animate|keycap|mahjong)/.test(
            name,
          ),
      ),
    );
});
test("switch invalid/disabled/required/readonly states stay consistent", () => {
  const input = native(
    render({
      invalid: true,
      disabled: true,
      required: true,
      readOnly: true,
      "aria-invalid": false,
    }),
  );
  for (const state of ["invalid", "disabled", "required", "readonly"])
    assert.ok(input.includes(`aria-${state}="true"`));
  assert.match(native(render({ readonly: true })), /\sreadonly(?:\s|=|>)/);
  assert.doesNotMatch(
    native(render({ readonly: true, readOnly: false })),
    /\sreadonly(?:\s|=|>)/,
  );
  for (const checked of [false, true])
    assert.deepEqual(
      classes(render({ invalid: true, checked })).filter((name) =>
        /^border-(border|primary|danger)$/.test(name),
      ),
      ["border-danger"],
    );
  for (const props of [{ disabled: true }, { readOnly: true }])
    assert.ok(
      !classes(render(props)).some((name) => /^(hover|active):/.test(name)),
    );
});
test("all switch utilities use existing tokens and mirror native focus to the track", async () => {
  const names = new Set();
  for (const size of ["sm", "md", "lg"])
    for (const checked of [false, true])
      for (const invalid of [false, true])
        for (const disabled of [false, true])
          for (const readOnly of [false, true])
            for (const name of classes(
              render({ size, checked, invalid, disabled, readOnly }),
            ))
              names.add(name);
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    if (name !== "peer")
      assert.ok(matched.has(name), `Missing utility: ${name}`);
  assert.ok(
    css.includes(".peer:focus-visible~") &&
      css.includes("--un-ring-width:2px") &&
      css.includes("var(--color-ring)"),
  );
  assert.ok(
    names.has("disabled:opacity-50") &&
      names.has("disabled:cursor-not-allowed"),
  );
  assert.ok(
    css.includes("var(--radius-md)") &&
      css.includes("var(--transition-duration)"),
  );
});
test("switch supports an accessible control-only instance and numeric label", () => {
  const html = render({ "aria-label": "Notifications" });
  assert.ok(native(html).includes('aria-label="Notifications"'));
  assert.ok(!html.includes("<label"));
  assert.ok(render({ children: 0 }).includes(">0</label>"));
});
test("switch demo covers every size/state and controlled/native form examples", () => {
  const html = renderToString(() => SwitchDemo());
  for (const state of [
    "off",
    "on",
    "invalid",
    "invalid-on",
    "disabled",
    "disabled-on",
    "readonly",
  ])
    for (const size of ["sm", "md", "lg"])
      assert.ok(html.includes(`id="switch-${state}-${size}"`));
  for (const id of [
    "switch-controlled",
    "switch-native-form",
    "switch-autosave",
    "switch-icon-only",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('type="submit"') && html.includes('type="reset"'));
});
