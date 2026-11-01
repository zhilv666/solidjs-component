import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { URL } from "node:url";
import { createComponent } from "solid-js";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Tooltip, TooltipDemo;
before(async () => {
  harness = await createComponentHarness("tooltip");
  ({ Tooltip } = await harness.load("/src/components/index.ts"));
  ({ TooltipDemo } = await harness.load(
    "/src/components/Tooltip/Tooltip.demo.tsx",
  ));
});
after(async () => await harness?.close());
const render = (root = {}, trigger = {}, content = {}) =>
  renderToString(() =>
    createComponent(Tooltip, {
      ...root,
      get children() {
        return [
          createComponent(Tooltip.Trigger, { children: "Trigger", ...trigger }),
          createComponent(Tooltip.Content, {
            children: "Description",
            ...content,
          }),
        ];
      },
    }),
  );
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );

test("tooltip compound API forwards native trigger attributes and defaults to safe button semantics", () => {
  for (const key of ["Root", "Trigger", "Portal", "Content"])
    assert.equal(typeof Tooltip[key], "function");
  const html = render(
    {},
    { id: "trigger", title: "Native title", class: "w-full" },
  );
  assert.match(html, /^<button\b/);
  for (const attribute of [
    'type="button"',
    'id="trigger"',
    'title="Native title"',
  ])
    assert.ok(html.includes(attribute));
  assert.ok(
    classes(html).includes("h-10") && classes(html).includes("text-md"),
  );
  assert.equal(
    html
      .match(/class="([^"]*)"/)[1]
      .trim()
      .split(/\s+/)
      .at(-1),
    "w-full",
  );
  assert.doesNotMatch(html, /\s(?:variant|size|appearance)=/);
  assert.ok(render({}, { type: "submit" }).includes('type="submit"'));
});

test("tooltip disabled trigger preserves native disabling and flattens only the control base", () => {
  const html = render({ appearance: "mahjong" }, { disabled: true });
  assert.ok(
    /\sdisabled(?=[\s=>])/.test(html) &&
      classes(html).includes("disabled:opacity-50") &&
      classes(html).includes("shadow-sm"),
  );
  assert.ok(!classes(html).includes("enabled:active:shadow-mahjong-pressed"));
  const enabled = render({ appearance: "keycap", disabled: true });
  assert.ok(
    classes(enabled).includes("shadow-keycap") &&
      !/\sdisabled(?=[\s=>])/.test(enabled),
  );
});

test("tooltip content keeps Kobalte semantics, native attributes and independent token shadows", () => {
  for (const appearance of ["default", "keycap", "mahjong"]) {
    const html = render(
      { defaultOpen: true, appearance },
      {},
      {
        id: "description",
        class: "text-left",
        "aria-label": "Extra description",
      },
    );
    assert.ok(
      html.includes('role="tooltip"') &&
        html.includes('id="description"') &&
        html.includes('aria-label="Extra description"'),
    );
    const content = html.slice(html.indexOf('role="tooltip"'));
    assert.ok(
      content.includes(
        appearance === "default" ? "shadow-md" : `shadow-${appearance}`,
      ),
    );
    assert.ok(!content.includes("enabled:active:"));
    assert.ok(content.includes("--kb-popper-content-available-width"));
  }
});

test("every tooltip appearance, trigger variant and size emits approved utilities", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["outline", "ghost"])
        for (const name of classes(
          render({ appearance, size, defaultOpen: true }, { variant }),
        ))
          names.add(name);
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const token of [
    "--radius-md",
    "--color-fg",
    "--color-ring",
    "--shadow-keycap",
    "--shadow-mahjong",
    "--font-size-lg",
  ])
    assert.ok(css.includes(`var(${token})`));
});

test("tooltip parts require their root and delegate focus, timers, dismissal and ARIA to Kobalte", async () => {
  assert.throws(
    () => renderToString(() => Tooltip.Trigger({})),
    /within Tooltip/,
  );
  const source = await readFile(
    new URL("../src/components/Tooltip/Tooltip.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(source.includes("@kobalte/core/tooltip"));
  assert.doesNotMatch(
    source,
    /addEventListener|setTimeout|\.focus\(|onKeyDown=|aria-describedby=/,
  );
});

test("tooltip demo includes all appearance, variant, size and availability states and labelled icon control", () => {
  const html = renderToString(() => TooltipDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["outline", "ghost"])
      for (const size of ["sm", "md", "lg"])
        for (const state of ["enabled", "trigger-disabled", "tooltip-disabled"])
          assert.ok(
            html.includes(
              `id="tooltip-${appearance}-${variant}-${size}-${state}"`,
            ),
          );
  for (const id of [
    "tooltip-live-trigger",
    "tooltip-toggle-disabled",
    "tooltip-live-status",
    "tooltip-icon-trigger",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('aria-label="帮助说明"'));
});
