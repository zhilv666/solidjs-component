import assert from "node:assert/strict";
import { after, before, test } from "node:test";
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
