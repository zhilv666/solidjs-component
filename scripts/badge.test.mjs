import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Badge, BadgeDemo;
before(async () => {
  harness = await createComponentHarness("badge");
  ({ Badge } = await harness.load("/src/components/index.ts"));
  ({ BadgeDemo } = await harness.load("/src/components/Badge/Badge.demo.tsx"));
});
after(async () => await harness?.close());
const render = (props = {}) => renderToString(() => Badge(props));
const classes = (html) =>
  html
    .match(/class="([^"]*)"/)[1]
    .trim()
    .split(/\s+/);
test("badge is a noninteractive span with native props, class and numeric content", () => {
  const html = render({
    id: "count",
    class: "w-full",
    title: "Native title",
    children: 0,
  });
  assert.match(html, /^<span\b/);
  assert.ok(
    html.includes('id="count"') &&
      html.includes('title="Native title"') &&
      html.endsWith(">0</span>"),
  );
  assert.equal(classes(html).at(-1), "w-full");
  assert.doesNotMatch(html, /\s(?:tabindex|role|variant|size|disabled)=/i);
  assert.ok(
    classes(html).includes("bg-primary") &&
      classes(html).includes("text-primary-fg") &&
      classes(html).includes("min-h-7"),
  );
});
test("badge variants preserve exclusive theme color mappings", () => {
  for (const [variant, bg, color] of [
    ["solid", "bg-primary", "text-primary-fg"],
    ["outline", "bg-surface", "text-primary"],
    ["neutral", "bg-bg", "text-fg"],
  ]) {
    const names = classes(render({ variant }));
    assert.ok(names.includes(bg) && names.includes(color));
    assert.equal(names.filter((name) => name.startsWith("bg-")).length, 1);
    assert.ok(
      names.every(
        (name) => !/shadow|hover:|active:|animate|keycap|mahjong/.test(name),
      ),
    );
  }
});
test("badge uses approved typography and generates every utility", async () => {
  const names = new Set();
  for (const variant of ["solid", "outline", "neutral"])
    for (const size of ["sm", "md", "lg"])
      for (const name of classes(render({ variant, size }))) names.add(name);
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const variable of [
    "--radius-md",
    "--font-size-md",
    "--font-size-lg",
    "--font-weight-medium",
    "--color-primary",
    "--color-primary-fg",
  ])
    assert.ok(css.includes(`var(${variable})`));
  assert.ok(!names.has("text-sm"));
});
test("badge demo covers every variant and size with live numeric and wrapping examples", () => {
  const html = renderToString(() => BadgeDemo());
  for (const variant of ["solid", "outline", "neutral"])
    for (const size of ["sm", "md", "lg"])
      assert.ok(html.includes(`id="badge-${variant}-${size}"`));
  for (const id of ["badge-count", "badge-increment", "badge-long-label"])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(
    html.includes('aria-live="polite"') && html.includes('aria-label="已完成"'),
  );
});
