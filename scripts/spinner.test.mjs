import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Spinner, SpinnerDemo;
before(async () => {
  harness = await createComponentHarness("spinner");
  ({ Spinner } = await harness.load("/src/components/index.ts"));
  ({ SpinnerDemo } = await harness.load(
    "/src/components/Spinner/Spinner.demo.tsx",
  ));
});
after(async () => await harness?.close());
const render = (props = {}) => renderToString(() => Spinner(props));
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );

test("spinner exposes noninteractive loading semantics and forwards native attributes/class", () => {
  const html = render({ id: "spinner", title: "Native title", class: "mr-2" });
  assert.match(html, /^<span\b[^>]*role="status"/);
  for (const value of [
    'id="spinner"',
    'title="Native title"',
    'aria-live="polite"',
    'aria-busy="true"',
    'class="sr-only">加载中',
  ])
    assert.ok(html.includes(value));
  assert.ok(
    html
      .match(/class="([^"]*)"/)[1]
      .trim()
      .endsWith("mr-2"),
  );
  assert.ok(
    classes(html).includes("h-10") && classes(html).includes("text-primary"),
  );
  assert.doesNotMatch(
    html,
    /\s(?:size|variant|appearance|label|tabindex)=|<button/,
  );
});
test("spinner separates its static frame from the animated hidden graphic in every matrix case", () => {
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["primary", "neutral"]) {
        const html = render({ appearance, size, variant });
        const outer = html.match(/^<span[^>]*class="([^"]*)"/)[1];
        assert.doesNotMatch(outer, /animate|active:|cursor/);
        assert.match(
          html,
          /<svg\b[^>]*aria-hidden="true"[^>]*class="[^"]*animate-spinner motion-reduce:animate-none/,
        );
        if (appearance === "default") assert.doesNotMatch(outer, /shadow|bg-/);
        else
          assert.ok(
            outer.includes(`shadow-${appearance}`) &&
              outer.includes("border-border"),
          );
        assert.ok(
          classes(html).includes(
            variant === "primary" ? "text-primary" : "text-fg-muted",
          ),
        );
      }
});
test("spinner labels escape text and preserve caller ARIA overrides for decoration", () => {
  const html = render({
    label: "<Loading & wait>",
    role: "img",
    "aria-live": "off",
    "aria-busy": false,
    "aria-hidden": true,
  });
  assert.match(html, /&lt;Loading &amp; wait(?:&gt;|>)/);
  for (const value of [
    'role="img"',
    'aria-live="off"',
    'aria-busy="false"',
    'aria-hidden="true"',
  ])
    assert.ok(html.includes(value));
});
test("spinner utilities all generate from theme tokens with reduced-motion stopping the animation", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["primary", "neutral"])
        for (const name of classes(render({ appearance, size, variant })))
          names.add(name);
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const variable of [
    "--animation-spin-duration",
    "--shadow-keycap",
    "--shadow-mahjong",
    "--color-primary",
    "--color-fg-muted",
    "--radius-md",
  ])
    assert.ok(css.includes(`var(${variable})`));
  assert.ok(
    css.includes("prefers-reduced-motion: reduce") &&
      css.includes("animation:none"),
  );
  assert.ok(
    css.includes("@keyframes spinner") && css.includes("rotate(360deg)"),
  );
  assert.doesNotMatch(css, /\banimation(?:-duration)?[^;]*\b(?:1000ms|1s)\b/);
});
test("spinner demo covers each appearance/size/variant and a keyboard-operable loading toggle", () => {
  const html = renderToString(() => SpinnerDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      for (const variant of ["primary", "neutral"])
        assert.ok(
          html.includes(`id="spinner-${appearance}-${variant}-${size}"`),
        );
  for (const id of ["spinner-toggle", "spinner-live", "spinner-status"])
    assert.ok(html.includes(`id="${id}"`));
  assert.ok(
    html.includes('aria-hidden="true"') && html.includes('aria-live="off"'),
  );
});
