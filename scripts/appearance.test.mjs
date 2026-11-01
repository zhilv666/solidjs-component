import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { URL } from "node:url";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { getAppearanceClasses } from "../src/components/appearance.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, AppearancePreview;
before(async () => {
  harness = await createComponentHarness("appearance");
  ({ AppearancePreview } = await harness.load(
    "/src/demo/AppearancePreview.tsx",
  ));
});
after(async () => await harness?.close());

test("default appearance emits no classes in every interaction and unavailable state", () => {
  for (const interaction of ["display", "native", "control"])
    for (const unavailable of [false, true])
      assert.equal(
        getAppearanceClasses("default", interaction, unavailable),
        "",
      );
});
test("display appearances add token shadows without implying interaction", () => {
  for (const appearance of ["keycap", "mahjong"]) {
    const classes = getAppearanceClasses(appearance);
    assert.ok(classes.includes(`shadow-${appearance}`));
    assert.ok(
      classes.includes("transition-shadow") &&
        classes.includes("duration-token"),
    );
    assert.doesNotMatch(classes, /active:|cursor|tabindex|scale|translate|bg-/);
  }
});
test("native and hidden-input controls receive their matching pressed shadows", () => {
  for (const appearance of ["keycap", "mahjong"]) {
    assert.ok(
      getAppearanceClasses(appearance, "native").includes(
        `enabled:active:shadow-${appearance}-pressed`,
      ),
    );
    const classes = getAppearanceClasses(appearance, "control");
    assert.ok(
      classes.includes(`active:shadow-${appearance}-pressed`) &&
        classes.includes(`peer-active:shadow-${appearance}-pressed`),
    );
  }
});
test("unavailable appearances flatten the base and omit every pressed state", () => {
  for (const appearance of ["keycap", "mahjong"])
    for (const interaction of ["display", "native", "control"])
      assert.equal(
        getAppearanceClasses(appearance, interaction, true),
        "shadow-sm transition-shadow duration-token",
      );
});
test("appearance classes all generate from approved shadow and duration tokens", async () => {
  const names = new Set();
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const interaction of ["display", "native", "control"])
      for (const unavailable of [false, true])
        for (const name of getAppearanceClasses(
          appearance,
          interaction,
          unavailable,
        )
          .split(/\s+/)
          .filter(Boolean))
          names.add(name);
  const uno = await createGenerator(unoConfig),
    { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const variable of [
    "--shadow-sm",
    "--shadow-keycap",
    "--shadow-keycap-pressed",
    "--shadow-mahjong",
    "--shadow-mahjong-pressed",
    "--transition-duration",
  ])
    assert.ok(css.includes(`var(${variable})`));
});
test("the Vite content scan includes the shared TypeScript appearance map", async () => {
  assert.ok(
    unoConfig.content.filesystem.includes("src/components/appearance.ts"),
  );
  const source = await readFile(
    new URL("../src/components/appearance.ts", import.meta.url),
    "utf8",
  );
  assert.match(source, /\/\/ @unocss-include/);
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate(source);
  for (const appearance of ["keycap", "mahjong"]) {
    assert.ok(matched.has(`peer-active:shadow-${appearance}-pressed`));
    assert.ok(css.includes(`var(--shadow-${appearance}-pressed)`));
    assert.ok(css.includes(".peer:active"));
  }
});
test("reusable appearance demo covers each appearance and size without adding controls", () => {
  const html = renderToString(() =>
    AppearancePreview({
      id: "audit",
      children: (appearance, size) => `${appearance}-${size}`,
    }),
  );
  assert.ok(
    html.includes('id="audit-appearances"') &&
      html.includes('aria-labelledby="audit-appearances-heading"'),
  );
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const size of ["sm", "md", "lg"])
      assert.ok(html.includes(`${appearance}-${size}`));
  assert.ok(!html.includes("<button") && !html.includes("tabindex"));
});
