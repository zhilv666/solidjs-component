import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, App, LayoutDemo;
before(async () => {
  harness = await createComponentHarness("layout-boundary");
  ({ default: App } = await harness.load("/src/App.tsx"));
  ({ LayoutDemo } = await harness.load(
    "/src/components/Layout/Layout.demo.tsx",
  ));
});
after(async () => await harness?.close());

const elements = (html, tag) =>
  [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, "g"))].map(
    (match) => match[0],
  );
function assertBoundary(element, side) {
  const values = element.match(/class="([^"]*)"/)[1].split(/\s+/);
  for (const value of [`border-${side}-2`, "border-solid", "border-border"])
    assert.ok(values.includes(value), `Missing boundary utility: ${value}`);
}

test("the application header and footer always provide visible token-colored solid boundaries", () => {
  const html = renderToString(App);
  assertBoundary(elements(html, "header")[0], "b");
  assertBoundary(elements(html, "footer").at(-1), "t");
  assert.equal((html.match(/<main\b/g) ?? []).length, 1);
});

test("the workspace and every fixed layout matrix explicitly separate header and footer", () => {
  const html = renderToString(LayoutDemo);
  for (const [tag, side] of [
    ["header", "b"],
    ["footer", "t"],
  ]) {
    const current = elements(html, tag);
    assert.equal(current.length, 19);
    for (const element of current) assertBoundary(element, side);
  }
  assert.doesNotMatch(html, /<main\b/);
});

test("plain boundaries reset all other browser-default edges while outline frames remain unchanged", () => {
  const app = renderToString(App);
  for (const element of [
    elements(app, "header")[0],
    elements(app, "footer").at(-1),
  ])
    assert.ok(
      element
        .match(/class="([^"]*)"/)[1]
        .split(/\s+/)
        .includes("border-0"),
    );
  const demo = renderToString(LayoutDemo);
  for (const tag of ["header", "footer"])
    for (const element of elements(demo, tag)) {
      const values = element.match(/class="([^"]*)"/)[1].split(/\s+/);
      assert.equal(values.includes("border-0"), !values.includes("rounded-md"));
    }
});

test("boundary utilities use default thickness and the existing semantic border variable", async () => {
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate(
    "border-0 border-b-2 border-t-2 border-solid border-border",
  );
  for (const value of [
    "border-b-2",
    "border-t-2",
    "border-solid",
    "border-border",
  ])
    assert.ok(matched.has(value));
  assert.match(css, /border-bottom-width:\s*2px/);
  assert.match(css, /border-top-width:\s*2px/);
  assert.match(css, /border-style:\s*solid/);
  assert.match(css, /border-width:\s*0/);
  assert.ok(css.includes("var(--color-border)"));
});
