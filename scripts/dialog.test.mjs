import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { URL } from "node:url";
import { createComponent } from "solid-js";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Dialog, DialogDemo;
before(async () => {
  harness = await createComponentHarness("dialog");
  ({ Dialog } = await harness.load("/src/components/index.ts"));
  ({ DialogDemo } = await harness.load(
    "/src/components/Dialog/Dialog.demo.tsx",
  ));
});
after(async () => await harness?.close());
const render = (
  root = {},
  trigger = {},
  content = {},
  close = {},
  overlay = {},
) =>
  renderToString(() =>
    createComponent(Dialog, {
      ...root,
      get children() {
        return [
          createComponent(Dialog.Trigger, { children: "Trigger", ...trigger }),
          createComponent(Dialog.Overlay, overlay),
          createComponent(Dialog.Content, {
            ...content,
            get children() {
              return [
                createComponent(Dialog.Title, {
                  id: "title",
                  children: "Heading",
                }),
                createComponent(Dialog.Description, {
                  id: "description",
                  children: "Help text",
                }),
                createComponent(Dialog.CloseButton, {
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
const classLists = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].map((match) =>
    match[1].trim().split(/\s+/),
  );
const classes = (html) => classLists(html).flat();

test("dialog compound API defaults to a closed modal with a native safe trigger", () => {
  for (const key of [
    "Root",
    "Trigger",
    "Portal",
    "Overlay",
    "Content",
    "Title",
    "Description",
    "CloseButton",
  ])
    assert.equal(typeof Dialog[key], "function");
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
  assert.equal(classLists(html)[0].at(-1), "text-left");
  assert.ok(classes(html).includes("h-10"));
  assert.doesNotMatch(html, /role="dialog"|\s(?:size|appearance|variant)=/);
});

test("dialog content supplies heading, description and named safe close controls", () => {
  const html = render(
    { defaultOpen: true },
    {},
    { id: "content", class: "text-left", title: "Native content" },
  );
  for (const attribute of [
    'role="dialog"',
    'id="content"',
    'id="title"',
    'id="description"',
    'aria-label="Close example"',
    'title="Native content"',
  ])
    assert.ok(html.includes(attribute));
  assert.match(html, /<h2\b[^>]*>Heading<\/h2>/);
  assert.match(html, /<p\b[^>]*>Help text<\/p>/);
  assert.equal([...html.matchAll(/type="button"/g)].length, 2);
  assert.ok(
    classes(html).includes("shadow-md") &&
      classes(html).includes("text-fg-muted"),
  );
  assert.equal(
    classLists(html)
      .find((list) => list.includes("max-w-full"))
      .at(-1),
    "text-left",
  );
});

test("dialog sizes and appearances propagate without competing shadows or pressed display surfaces", async () => {
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
        assert.ok(
          current.includes({ sm: "w-80", md: "w-96", lg: "w-128" }[size]),
        );
        assert.ok(current.includes({ sm: "p-3", md: "p-4", lg: "p-5" }[size]));
        const content = classLists(html).find((list) =>
          list.includes("max-w-full"),
        );
        assert.ok(!content.some((name) => name.includes("active:")));
        if (appearance !== "default") {
          assert.ok(content.includes(`shadow-${appearance}`));
          assert.ok(!current.includes("shadow-md"));
        } else
          assert.ok(
            !current.some(
              (name) =>
                name.startsWith("shadow-keycap") ||
                name.startsWith("shadow-mahjong"),
            ),
          );
        for (const name of current) names.add(name);
      }
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const token of [
    "--radius-md",
    "--color-ring",
    "--color-bg",
    "--shadow-keycap",
    "--shadow-mahjong",
    "--font-size-xl",
  ])
    assert.ok(css.includes(`var(${token})`));
});

test("dialog disables only native controls and omits their pressed bases", () => {
  const html = render(
    { appearance: "mahjong", defaultOpen: true },
    { disabled: true },
    {},
    { disabled: true },
  );
  assert.equal([...html.matchAll(/\sdisabled(?=[\s=>])/g)].length, 2);
  assert.equal(classes(html).filter((name) => name === "shadow-sm").length, 2);
  assert.ok(!classes(html).includes("enabled:active:shadow-mahjong-pressed"));
  assert.ok(
    classes(html).includes("disabled:opacity-50") &&
      classes(html).includes("disabled:cursor-not-allowed"),
  );
});

test("dialog overlay and content preserve native styles and viewport containment without extra focus stops", () => {
  for (const style of [{ "text-align": "right" }, "text-align: right"]) {
    const html = render(
      { defaultOpen: true },
      {},
      { style },
      {},
      { id: "overlay", class: "select-none", style },
    );
    assert.match(html, /text-align:\s*right(?:;|")/);
    assert.ok(
      classes(html).includes("fixed") && classes(html).includes("inset-0"),
    );
    assert.ok(
      classes(html).includes("overflow-y-auto") &&
        classes(html).includes("max-h-full"),
    );
    assert.ok(
      classes(html).includes("bg-bg") && classes(html).includes("opacity-80"),
    );
    const overlay = html.match(/<div\b[^>]*id="overlay"[^>]*>/)[0];
    assert.doesNotMatch(overlay, /tabindex|role=|shadow-|active:/);
    assert.ok(classLists(overlay)[0].at(-1) === "select-none");
  }
});

test("dialog delegates modal focus, dismissal, scroll, mounting and ARIA to Kobalte", async () => {
  assert.throws(
    () => renderToString(() => Dialog.Trigger({})),
    /within Dialog/,
  );
  const source = await readFile(
    new URL("../src/components/Dialog/Dialog.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(
    source.includes("@kobalte/core/dialog") && source.includes("modal: true"),
  );
  assert.doesNotMatch(
    source,
    /addEventListener|\.focus\(|onKeyDown=|aria-labelledby=|aria-describedby=/,
  );
  assert.ok(render({ open: true }).includes('role="dialog"'));
  assert.ok(
    !render({ open: false, defaultOpen: true }).includes('role="dialog"'),
  );
});

test("dialog demo covers all appearances, sizes, variants and disabled states plus controlled and nonmodal examples", () => {
  const html = renderToString(() => DialogDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["outline", "ghost"])
      for (const size of ["sm", "md", "lg"])
        for (const state of ["enabled", "disabled"])
          assert.ok(
            html.includes(
              `id="dialog-${appearance}-${variant}-${size}-${state}"`,
            ),
          );
  for (const id of [
    "dialog-live-trigger",
    "dialog-toggle-disabled",
    "dialog-live-status",
    "dialog-nonmodal-trigger",
    "dialog-native-trigger",
  ])
    assert.ok(html.includes(`id="${id}"`));
});
