import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, mkdir, rmdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath, URL } from "node:url";
import { findTokenViolations } from "./check-tokens.mjs";

test("token utilities and CSS variable styles pass", () => {
  const source =
    'export const valid = <button class="p-4 bg-primary text-primary-fg rounded-md text-md font-medium shadow-sm transition-colors duration-token" style={{ color: "var(--color-fg)", "font-size": "var(--font-size-md)" }} />;';
  assert.deepEqual(findTokenViolations(source, "Valid.tsx"), []);
});

test("all required token violations include file and line", () => {
  const fixtures = [
    ["hex-color", '<div class="text-[#333]" />'],
    ["color-function", '<div style={{ color: "rgba(0, 0, 0, 0.5)" }} />'],
    ["color-function", '<div style={{ color: "hsl(0 0% 0%)" }} />'],
    ["arbitrary-value", '<div class="w-[13px]" />'],
    [
      "forbidden-radius",
      '<div class="rounded-xl rounded-2xl rounded-3xl rounded-full" />',
    ],
    [
      "inline-style-literal",
      '<div style={{ color: "red", width: "13px", "font-weight": 300 }} />',
    ],
    ["inline-style-literal", '<div style="color: red; width: 13px" />'],
    ["inline-style-literal", "<div style={{ width: 13 }} />"],
    ["inline-style-literal", '<div style={{ height: "100%" }} />'],
    ["default-palette", '<div class="bg-red-500 text-gray-400" />'],
    ["non-token-typography", '<div class="font-light text-2xl" />'],
    ["non-token-shadow", '<div class="shadow-lg" />'],
    [
      "non-token-transition",
      '<div class="duration-300 transition-transform" />',
    ],
  ];
  for (const [rule, source] of fixtures) {
    const violations = findTokenViolations(`\n${source}`, "Invalid.tsx");
    assert.ok(
      violations.some((violation) => violation.rule === rule),
      `Missing ${rule}: ${source}`,
    );
    assert.ok(
      violations.every(
        (violation) => violation.file === "Invalid.tsx" && violation.line === 2,
      ),
    );
  }
});

test("a nearby reason exempts only radii and fake or empty annotations do not", () => {
  const source =
    '/* allow-token-bypass: Circular avatar shape */\n<div class="rounded-full text-[#333]" />';
  const violations = findTokenViolations(source, "Avatar.tsx");
  assert.ok(
    !violations.some((violation) => violation.rule === "forbidden-radius"),
  );
  assert.ok(violations.some((violation) => violation.rule === "hex-color"));
  for (const prefix of [
    '"/* allow-token-bypass: fake */";',
    "/* allow-token-bypass: */",
  ]) {
    assert.ok(
      findTokenViolations(
        `${prefix}\n<div class="rounded-full" />`,
        "Invalid.tsx",
      ).some((violation) => violation.rule === "forbidden-radius"),
    );
  }
});

test("only Spinner permits its tokenized animation and reduced-motion stop utility", () => {
  const file = "src/components/Spinner/Spinner.tsx";
  const approved = '<svg class="animate-spinner motion-reduce:animate-none" />';
  assert.deepEqual(findTokenViolations(approved, file), []);
  assert.ok(findTokenViolations(approved, "Other.tsx").length > 0);
  for (const utility of [
    "animate-spin",
    "animate-pulse",
    "animate-spinner-fast",
    "animate-none",
    "motion-safe:animate-none",
    "duration-1000",
    "transition-transform",
  ]) {
    assert.ok(
      findTokenViolations(`<svg class="${utility}" />`, file).some(
        (violation) => violation.rule === "non-token-transition",
      ),
      `Unexpected animation allowance: ${utility}`,
    );
  }
  assert.ok(
    findTokenViolations(
      '<svg style={{ "animation-duration": "1000ms" }} />',
      file,
    ).some((violation) => violation.rule === "inline-style-literal"),
  );
});

test("CLI scans nested files and exits nonzero with a located diagnostic", async () => {
  const directory = await mkdtemp(join(tmpdir(), "solid-token-check-"));
  const nested = join(directory, "Nested");
  const file = join(nested, "Invalid.tsx");
  try {
    await mkdir(nested);
    await writeFile(
      file,
      'export const fixture = <div style={{ color: "red" }} />;\n',
      "utf8",
    );
    const script = fileURLToPath(
      new URL("./check-tokens.mjs", import.meta.url),
    );
    const result = spawnSync(process.execPath, [script, directory], {
      encoding: "utf8",
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Invalid\.tsx:1:\d+ inline-style-literal/);
  } finally {
    await unlink(file);
    await rmdir(nested);
    await rmdir(directory);
  }
});
