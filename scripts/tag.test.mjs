import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { URL } from "node:url";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";
let harness, Tag, TagDemo;
before(async () => {
  harness = await createComponentHarness("tag");
  ({ Tag } = await harness.load("/src/components/index.ts"));
  ({ TagDemo } = await harness.load("/src/components/Tag/Tag.demo.tsx"));
});
after(async () => await harness?.close());
const render = (props = {}) => renderToString(() => Tag(props));
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );
test("tag is a native span with default styles and no implicit close control", () => {
  const html = render({
    children: 0,
    class: "w-full",
    title: "Native title",
    id: "tag",
  });
  assert.match(html, /^<span\b/);
  assert.ok(
    html.includes('id="tag"') &&
      html.includes('title="Native title"') &&
      html.includes(">0</span>"),
  );
  assert.equal(
    html
      .match(/class="([^"]*)"/)[1]
      .trim()
      .split(/\s+/)
      .at(-1),
    "w-full",
  );
  assert.ok(!html.includes("<button"));
  assert.doesNotMatch(
    html,
    /\s(?:variant|size|closable|disabled|closeLabel|onClose)=/,
  );
  assert.ok(
    classes(html).includes("min-h-9") && classes(html).includes("bg-primary"),
  );
});
test("closable tag uses a named native button that is safe inside forms", () => {
  const html = render({
    closable: true,
    closeLabel: "Remove SolidJS",
    onClose() {},
    children: "SolidJS",
  });
  assert.match(
    html,
    /<button\b[^>]*type="button"[^>]*aria-label="Remove SolidJS"/,
  );
  assert.ok(html.includes('aria-hidden="true"') && html.includes("×"));
  assert.doesNotMatch(html, /\sdisabled(?:\s|=|>)/);
});
test("disabled tag blocks its close action without compounded opacity", () => {
  const html = render({
    disabled: true,
    closable: true,
    closeLabel: "Remove",
    onClose() {},
  });
  assert.match(html, /<button\b[^>]*\sdisabled(?:\s|=|>)/);
  assert.ok(!html.match(/<span\b[^>]*>/)[0].includes("opacity-50"));
  assert.ok(
    classes(html).includes("opacity-50") &&
      classes(html).includes("disabled:opacity-50") &&
      classes(html).includes("disabled:cursor-not-allowed"),
  );
});
test("all tag variants and sizes use valid token utilities with a visible offset focus ring", async () => {
  const names = new Set();
  for (const variant of ["solid", "outline", "neutral"])
    for (const size of ["sm", "md", "lg"])
      for (const disabled of [false, true])
        for (const name of classes(
          render({
            variant,
            size,
            disabled,
            closable: true,
            closeLabel: "Remove",
            onClose() {},
          }),
        ))
          names.add(name);
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const name of [
    "focus-visible:ring-2",
    "focus-visible:ring-ring",
    "focus-visible:ring-offset-2",
    "focus-visible:ring-offset-bg",
  ])
    assert.ok(names.has(name));
  for (const token of [
    "--radius-md",
    "--radius-sm",
    "--color-ring",
    "--color-bg",
    "--transition-duration",
  ])
    assert.ok(css.includes(`var(${token})`));
  assert.ok(
    [...names].every(
      (name) => !/keycap|mahjong|shadow|animate|transition-all/.test(name),
    ),
  );
});
test("tag demo covers every variant/size/state and a removable controlled list", () => {
  const html = renderToString(() => TagDemo());
  for (const state of ["plain", "closable", "disabled"])
    for (const variant of ["solid", "outline", "neutral"])
      for (const size of ["sm", "md", "lg"])
        assert.ok(html.includes(`id="tag-${state}-${variant}-${size}"`));
  for (const id of [
    "tag-controlled-list",
    "tag-list-solid",
    "tag-list-ts",
    "tag-list-a11y",
    "tag-long-label",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('aria-label="移除 SolidJS 标签"'));
});

test("tag appearance preserves default classes and close-button semantics", () => {
  assert.deepEqual(
    classes(render()),
    classes(render({ appearance: "default" })),
  );
  for (const appearance of ["keycap", "mahjong"]) {
    const plain = render({ appearance, children: 0, class: "w-full" });
    assert.ok(classes(plain).includes(`shadow-${appearance}`));
    assert.ok(!plain.includes("<button"));
    assert.doesNotMatch(plain, /\s(?:appearance|role|tabindex)=/);
    const html = render({
      appearance,
      closable: true,
      closeLabel: "Remove",
      onClose() {},
    });
    assert.match(html, /<button\b[^>]*type="button"[^>]*aria-label="Remove"/);
    const unavailable = render({
      appearance,
      disabled: true,
      closable: true,
      closeLabel: "Remove",
      onClose() {},
    });
    assert.ok(classes(unavailable).includes("shadow-sm"));
    assert.match(unavailable, /<span\b[^>]*data-disabled=""/);
    assert.match(unavailable, /<button\b[^>]*\sdisabled(?:\s|=|>)/);
  }
});

test("tag appearance utilities and close-only pressed rules use approved tokens", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["solid", "outline", "neutral"])
      for (const size of ["sm", "md", "lg"])
        for (const disabled of [false, true])
          for (const name of classes(
            render({
              appearance,
              variant,
              size,
              disabled,
              closable: true,
              closeLabel: "Remove",
              onClose() {},
            }),
          ))
            names.add(name);
  const uno = await createGenerator(unoConfig);
  const { matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  const source = await readFile(
    new URL("../src/components/Tag/Tag.css", import.meta.url),
    "utf8",
  );
  for (const appearance of ["keycap", "mahjong"]) {
    assert.ok(
      source.includes(
        `[data-tag-appearance="${appearance}"]:not([data-disabled]):has(> button:active)`,
      ),
    );
    assert.ok(source.includes(`var(--shadow-${appearance}-pressed)`));
  }
  assert.doesNotMatch(
    source,
    /#[\da-f]{3,8}\b|rgba?\(|\d+px|transform|animation/i,
  );
});

test("tag demo shows every appearance, variant, size and close state", () => {
  const html = renderToString(() => TagDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["solid", "outline", "neutral"])
      for (const size of ["sm", "md", "lg"])
        for (const state of ["plain", "closable", "disabled"])
          assert.ok(
            html.includes(`id="tag-${appearance}-${state}-${variant}-${size}"`),
          );
});
