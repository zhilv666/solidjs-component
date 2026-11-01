import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { URL } from "node:url";
import { createComponent } from "solid-js";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Popover, PopoverDemo;
before(async () => {
  harness = await createComponentHarness("popover");
  ({ Popover } = await harness.load("/src/components/index.ts"));
  ({ PopoverDemo } = await harness.load(
    "/src/components/Popover/Popover.demo.tsx",
  ));
});
after(async () => await harness?.close());
const render = (root = {}, trigger = {}, content = {}, close = {}) =>
  renderToString(() =>
    createComponent(Popover, {
      ...root,
      get children() {
        return [
          createComponent(Popover.Trigger, { children: "Trigger", ...trigger }),
          createComponent(Popover.Content, {
            ...content,
            get children() {
              return [
                createComponent(Popover.Title, {
                  id: "title",
                  children: "Heading",
                }),
                createComponent(Popover.Description, {
                  id: "description",
                  children: "Help text",
                }),
                createComponent(Popover.CloseButton, {
                  "aria-label": "Close example",
                  ...close,
                }),
              ];
            },
          }),
        ];
      },
    }),
  );
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );

test("popover compound API provides native safe triggers and Kobalte dialog semantics", () => {
  for (const key of [
    "Root",
    "Trigger",
    "Portal",
    "Content",
    "Title",
    "Description",
    "CloseButton",
  ])
    assert.equal(typeof Popover[key], "function");
  const html = render(
    {},
    { id: "trigger", title: "Native title", class: "text-left" },
  );
  assert.match(html, /^<button\b/);
  for (const attribute of [
    'type="button"',
    'aria-haspopup="dialog"',
    'aria-expanded="false"',
    'id="trigger"',
    'title="Native title"',
  ])
    assert.ok(html.includes(attribute));
  assert.ok(classes(html).includes("h-10"));
  assert.equal(
    html
      .match(/class="([^"]*)"/)[1]
      .trim()
      .split(/\s+/)
      .at(-1),
    "text-left",
  );
  assert.doesNotMatch(html, /\s(?:size|appearance|variant)=/);
});

test("popover content includes semantic title, description and named type=button close control", () => {
  const html = render(
    { defaultOpen: true },
    {},
    { id: "content", title: "Content title", class: "text-left" },
  );
  for (const attribute of [
    'role="dialog"',
    'id="content"',
    'id="title"',
    'id="description"',
    'aria-label="Close example"',
    'title="Content title"',
  ])
    assert.ok(html.includes(attribute));
  assert.match(html, /<h2\b[^>]*>Heading<\/h2>/);
  assert.match(html, /<p\b[^>]*>Help text<\/p>/);
  assert.ok(
    classes(html).includes("shadow-md") &&
      classes(html).includes("text-fg-muted"),
  );
  assert.equal([...html.matchAll(/type="button"/g)].length, 2);
});

test("popover sizes and appearances propagate to content, title, trigger and close without shadow competition", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["outline", "ghost"]) {
        const html = render(
          { appearance, size, defaultOpen: true },
          { variant },
          {},
          { variant },
        );
        const current = classes(html);
        assert.ok(current.includes({ sm: "p-3", md: "p-4", lg: "p-5" }[size]));
        if (appearance !== "default") {
          assert.ok(current.includes(`shadow-${appearance}`));
          assert.ok(!current.includes("shadow-md"));
        }
        for (const name of current) names.add(name);
      }
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const token of [
    "--radius-md",
    "--color-ring",
    "--color-fg-muted",
    "--shadow-keycap",
    "--shadow-mahjong",
    "--font-size-xl",
  ])
    assert.ok(css.includes(`var(${token})`));
});

test("popover disabled controls retain native state and omit their pressed shadows", () => {
  const html = render(
    { appearance: "mahjong", defaultOpen: true },
    { disabled: true },
    {},
    { disabled: true },
  );
  assert.equal([...html.matchAll(/\sdisabled(?=[\s=>])/g)].length, 2);
  assert.equal(classes(html).filter((name) => name === "shadow-sm").length, 2);
  assert.ok(!classes(html).includes("enabled:active:shadow-mahjong-pressed"));
});

test("popover forwards string and object native styles after viewport constraints", () => {
  const first = render(
    { defaultOpen: true },
    {},
    { style: { "text-align": "right" } },
  );
  const second = render(
    { defaultOpen: true },
    {},
    { style: "text-align: left" },
  );
  for (const html of [first, second])
    assert.ok(
      html.includes("--kb-popper-content-available-width") &&
        html.includes("--kb-popper-content-available-height"),
    );
  assert.ok(
    first.includes("text-align:right") || first.includes("text-align: right"),
  );
  assert.match(second, /text-align:\s*left(?:;|")/);
});

test("popover delegates focus, scroll locking, outside interactions, title association and dismissal to Kobalte", async () => {
  assert.throws(
    () => renderToString(() => Popover.Trigger({})),
    /within Popover/,
  );
  const source = await readFile(
    new URL("../src/components/Popover/Popover.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(
    source.includes("@kobalte/core/popover") && source.includes("modal: false"),
  );
  assert.doesNotMatch(
    source,
    /addEventListener|\.focus\(|onKeyDown=|aria-labelledby=|aria-describedby=/,
  );
});

test("popover demo covers all trigger variants, sizes, appearances and disabled states plus modal and controlled editing", () => {
  const html = renderToString(() => PopoverDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["outline", "ghost"])
      for (const size of ["sm", "md", "lg"])
        for (const state of ["enabled", "disabled"])
          assert.ok(
            html.includes(
              `id="popover-${appearance}-${variant}-${size}-${state}"`,
            ),
          );
  for (const id of [
    "popover-live-trigger",
    "popover-toggle-disabled",
    "popover-live-status",
    "popover-modal-trigger",
    "popover-native-trigger",
  ])
    assert.ok(html.includes(`id="${id}"`));
});
