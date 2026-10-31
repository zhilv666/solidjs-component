import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Alert, AlertDemo;
before(async () => {
  harness = await createComponentHarness("alert");
  ({ Alert } = await harness.load("/src/components/index.ts"));
  ({ AlertDemo } = await harness.load("/src/components/Alert/Alert.demo.tsx"));
});
after(async () => await harness?.close());
const render = (props = {}) => renderToString(() => Alert(props));
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );

test("alert uses Kobalte alert semantics with native attributes, class and safe typography", () => {
  const html = render({
    id: "alert",
    title: "Native title",
    class: "w-full",
    children: "Message",
  });
  assert.match(html, /^<div\b[^>]*role="alert"/);
  assert.ok(
    html.includes('id="alert"') &&
      html.includes('title="Native title"') &&
      html.includes("Message"),
  );
  assert.ok(
    html
      .match(/class="([^"]*)"/)[1]
      .trim()
      .endsWith("w-full"),
  );
  assert.ok(classes(html).includes("p-4") && classes(html).includes("text-md"));
  assert.doesNotMatch(html, /\s(?:variant|size|heading|tabindex)=/i);
});
test("alert variants use existing semantic border/icon colors and never tint the body text", () => {
  for (const [variant, color, icon] of [
    ["info", "primary", "ⓘ"],
    ["success", "success", "✓"],
    ["warning", "warning", "!"],
    ["danger", "danger", "×"],
  ]) {
    const html = render({ variant }),
      names = classes(html);
    assert.ok(
      names.includes(`border-${color}`) &&
        names.includes(`text-${color}`) &&
        names.includes("bg-surface") &&
        names.includes("text-fg") &&
        html.includes(icon),
    );
    assert.ok(html.includes('aria-hidden="true"'));
    assert.equal(
      names.filter((name) =>
        /^border-(?:primary|success|warning|danger)$/.test(name),
      ).length,
      1,
    );
    assert.ok(
      names.every(
        (name) => !/shadow|keycap|mahjong|hover:|active:|animate/.test(name),
      ),
    );
  }
});
test("optional alert headings preserve numeric zero and omit empty content without clobbering native title", () => {
  const html = render({ heading: 0, children: 0, title: "Native title" });
  assert.ok(
    html.includes('<div class="font-medium">0</div>') &&
      html.includes(">0</div>"),
  );
  for (const heading of [undefined, null, false, ""])
    assert.ok(!render({ heading }).includes('<div class="font-medium">'));
});
test("alert forwards native ARIA overrides for polite status messages", () => {
  const html = render({
    role: "status",
    "aria-live": "polite",
    "aria-atomic": true,
    "aria-label": "Saved",
  });
  assert.ok(
    html.includes('role="status"') &&
      html.includes('aria-live="polite"') &&
      html.includes('aria-atomic="true"') &&
      html.includes('aria-label="Saved"'),
  );
  assert.ok(!html.includes('role="alert"'));
});
test("all alert utility combinations generate from existing tokens", async () => {
  const names = new Set();
  for (const variant of ["info", "success", "warning", "danger"])
    for (const size of ["sm", "md", "lg"])
      for (const name of classes(render({ variant, size, heading: "Heading" })))
        names.add(name);
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const variable of [
    "--color-primary",
    "--color-success",
    "--color-warning",
    "--color-danger",
    "--color-fg",
    "--radius-md",
    "--font-size-md",
    "--font-size-lg",
    "--font-size-xl",
    "--font-weight-normal",
    "--font-weight-medium",
  ])
    assert.ok(css.includes(`var(${variable})`));
});
test("alert demo covers every severity/size and dynamic, polite, zero and wrapping messages", () => {
  const html = renderToString(() => AlertDemo());
  for (const variant of ["info", "success", "warning", "danger"])
    for (const size of ["sm", "md", "lg"])
      assert.ok(html.includes(`id="alert-${variant}-${size}"`));
  for (const id of [
    "alert-live",
    "alert-next-message",
    "alert-toggle-size",
    "alert-toggle-heading",
    "alert-zero",
    "alert-polite",
    "alert-long-content",
  ])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(html.includes('aria-live="off"') && html.includes('role="status"'));
});
