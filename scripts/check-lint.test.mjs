import assert from "node:assert/strict";
import test from "node:test";
import { ESLint } from "eslint";

const eslint = new ESLint();
const filePath = "src/components/LintFixture.tsx";

test("reactive props access passes lint", async () => {
  const [result] = await eslint.lintText(
    "export function Valid(props: { a: string }) { return <div>{props.a}</div>; }",
    { filePath },
  );
  assert.equal(result.errorCount, 0);
  assert.equal(result.warningCount, 0);
});

test("props destructuring and React conventions are rejected", async () => {
  const fixtures = [
    {
      source:
        "export function Broken(props: { a: string }) { const { a } = props; return <div>{a}</div>; }",
      rule: "solid/reactivity",
    },
    {
      source:
        "export function Broken({ a }: { a: string }) { return <div>{a}</div>; }",
      rule: "solid/no-destructure",
    },
    {
      source: 'export function Broken() { return <div className="p-4" />; }',
      rule: "solid/no-react-specific-props",
    },
    {
      source: "export type Broken = any;",
      rule: "@typescript-eslint/no-explicit-any",
    },
  ];

  for (const fixture of fixtures) {
    const [result] = await eslint.lintText(fixture.source, { filePath });
    assert.ok(
      result.messages.some(
        (message) => message.ruleId === fixture.rule && message.severity === 2,
      ),
      `Expected ${fixture.rule} to reject the fixture`,
    );
  }
});
