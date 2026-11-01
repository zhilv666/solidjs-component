import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness,
  Pagination,
  PaginationDemo,
  AppearanceProvider,
  clampPaginationPage,
  getPaginationCount;
before(async () => {
  harness = await createComponentHarness("pagination");
  ({ Pagination } = await harness.load("/src/components/index.ts"));
  ({ PaginationDemo } = await harness.load(
    "/src/components/Pagination/Pagination.demo.tsx",
  ));
  ({ AppearanceProvider } = await harness.load("/src/theme/appearance.tsx"));
  ({ clampPaginationPage, getPaginationCount } = await harness.load(
    "/src/components/Pagination/state.ts",
  ));
});
after(async () => await harness?.close());
const render = (props = {}) =>
  renderToString(() => Pagination({ count: 5, ...props }));
const buttons = (html) =>
  [...html.matchAll(/<button\b[^>]*>/g)].map((match) => match[0]);
const isDisabled = (button) => /\sdisabled(?:[\s>]|=)/.test(button);
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );

test("pagination forwards native nav attributes and class with one semantic list, named pages and safe native buttons", () => {
  const html = render({
    id: "pages",
    title: "Native navigation",
    class: "w-full",
    "aria-label": "Projects",
  });
  const nav = html.match(/<nav\b[^>]*>/)[0];
  for (const attribute of [
    'id="pages"',
    'title="Native navigation"',
    'aria-label="Projects"',
  ])
    assert.ok(nav.includes(attribute), attribute);
  assert.match(nav, /class="[^"]*w-full\s*"/);
  assert.equal([...html.matchAll(/<ul\b/g)].length, 1);
  assert.equal(buttons(html).length, 7);
  assert.ok(buttons(html).every((button) => button.includes('type="button"')));
  assert.ok(
    html.includes('aria-label="第 1 页"') &&
      html.includes('aria-current="page"'),
  );
  assert.doesNotMatch(
    html,
    /\s(?:count|page|defaultPage|size|variant|appearance|siblingCount|fixedItems)=/,
  );
});

test("pagination controlled values override defaults and first/last boundaries disable only the relevant controls", () => {
  const first = buttons(render());
  assert.ok(isDisabled(first[0]) && !isDisabled(first.at(-1)));
  const last = buttons(render({ page: 5, defaultPage: 1 }));
  assert.ok(!isDisabled(last[0]) && isDisabled(last.at(-1)));
  assert.ok(last[5].includes('aria-current="page"'));
  const controlled = buttons(render({ page: 2, defaultPage: 4 }));
  assert.ok(controlled[2].includes('aria-current="page"'));
  assert.equal(
    controlled.filter((button) => button.includes('aria-current="page"'))
      .length,
    1,
  );
});

test("zero-page and globally disabled pagination cannot leave an interactive page or edge button", () => {
  for (const props of [
    { count: 0 },
    { disabled: true, page: 2 },
    { count: 1, disabled: true },
  ])
    assert.ok(buttons(render(props)).every(isDisabled));
  assert.equal(buttons(render({ count: 0 })).length, 3);
  assert.match(render({ count: 0 }), /data-disabled=""/);
});

test("pagination numeric bounds reject unsafe counts and never produce zero negative or oversized visible page numbers", () => {
  assert.equal(getPaginationCount(0), 1);
  for (const invalid of [-1, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(
      () => render({ count: invalid }),
      /non-negative safe integer/,
    );
  for (const [page, count, expected] of [
    [-3, 5, 1],
    [0, 5, 1],
    [10, 5, 5],
    [2.8, 5, 2],
    [NaN, 5, 1],
    [4, 0, 1],
  ]) {
    assert.equal(clampPaginationPage(page, count), expected);
    const html = render({ page, count });
    assert.match(
      html,
      new RegExp(
        `aria-current="page"[^>]*aria-label="第 ${expected} 页"|aria-label="第 ${expected} 页"[^>]*aria-current="page"`,
      ),
    );
  }
});

test("large pagination remains Kobalte-rendered with hidden non-focusable ellipses and configurable sibling/edge policies", () => {
  const html = render({ count: 1000, page: 500 });
  assert.ok(html.includes("…") && html.includes('aria-hidden="true"'));
  assert.ok(buttons(html).length < 12);
  for (const page of [1, 2, 10, 19, 20])
    for (const fixedItems of [false, true, "no-ellipsis"])
      for (const siblingCount of [-1, 0, 1, 2]) {
        const result = render({ count: 20, page, fixedItems, siblingCount });
        const numbers = [...result.matchAll(/aria-label="第 (\d+) 页"/g)].map(
          (match) => Number(match[1]),
        );
        assert.ok(numbers.every((number) => number >= 1 && number <= 20));
        assert.equal(
          buttons(result).filter((button) =>
            button.includes('aria-current="page"'),
          ).length,
          1,
        );
      }
});

test("pagination appearances apply to available controls only, leave wrappers static, and inherit or override global defaults", () => {
  for (const appearance of ["default", "keycap", "mahjong"]) {
    const inherited = renderToString(() =>
      AppearanceProvider({
        appearance,
        get children() {
          return Pagination({ count: 5 });
        },
      }),
    );
    assert.deepEqual(classes(inherited), classes(render({ appearance })));
    const explicit = renderToString(() =>
      AppearanceProvider({
        appearance,
        get children() {
          return Pagination({ count: 5, appearance: "default" });
        },
      }),
    );
    assert.deepEqual(classes(explicit), classes(render()));
    if (appearance != "default") {
      const html = render({ appearance });
      assert.ok(buttons(html)[1].includes(`shadow-${appearance}`));
      assert.ok(
        buttons(html)[1].includes(
          `enabled:active:shadow-${appearance}-pressed`,
        ),
      );
      assert.ok(
        buttons(html)[0].includes("shadow-sm") &&
          !buttons(html)[0].includes(`shadow-${appearance}`),
      );
      assert.doesNotMatch(html.match(/<nav\b[^>]*>/)[0], /shadow-|active:/);
      assert.doesNotMatch(
        render({ appearance, disabled: true }),
        /shadow-(?:keycap|mahjong)/,
      );
    }
  }
});

test("every pagination variant size appearance and disabled combination emits valid token utilities", async () => {
  const names = new Set();
  for (const variant of ["outline", "ghost"])
    for (const size of ["sm", "md", "lg"])
      for (const appearance of ["default", "keycap", "mahjong"])
        for (const disabled of [false, true])
          for (const name of classes(
            render({ variant, size, appearance, disabled }),
          ))
            if (!["solid-pagination", "solid-pagination-button"].includes(name))
              names.add(name);
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const variable of [
    "--color-fg",
    "--color-primary",
    "--radius-md",
    "--font-size-md",
    "--font-size-lg",
    "--shadow-keycap",
    "--shadow-mahjong",
    "--transition-duration",
  ])
    assert.ok(css.includes(`var(${variable})`), variable);
});

test("pagination delegates page requests and native keyboard behavior without hand-written focus, click or keyboard management", async () => {
  const source = await readFile(
    new URL("../src/components/Pagination/Pagination.tsx", import.meta.url),
    "utf8",
  );
  const css = await readFile(
    new URL("../src/components/Pagination/Pagination.css", import.meta.url),
    "utf8",
  );
  assert.ok(
    source.includes('from "@kobalte/core/pagination"') &&
      source.includes("<PaginationItems />"),
  );
  assert.doesNotMatch(
    source,
    /onKeyDown=|onClick=|addEventListener|setTimeout|\.focus\(|createSignal|createEffect/,
  );
  assert.ok(
    css.includes('[aria-current="page"]') &&
      css.includes("var(--color-primary-fg)"),
  );
});

test("current-page hover has higher specificity than the normal enabled hover utilities", async () => {
  const css = await readFile(
    new URL("../src/components/Pagination/Pagination.css", import.meta.url),
    "utf8",
  );
  assert.ok(
    css
      .replace(/\s+/g, "")
      .includes(
        '.solid-pagination-button[aria-current="page"]:not(:disabled):hover:not(:active){background-color:var(--color-primary-hover);',
      ),
  );
});

test("pagination demo covers the whole matrix, controlled refusal, count changes, uncontrolled values, zero pages, disabled state and long native form labels", () => {
  const html = renderToString(() => PaginationDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["outline", "ghost"])
      for (const size of ["sm", "md", "lg"])
        assert.ok(
          html.includes(`id="pagination-${appearance}-${variant}-${size}"`),
        );
  for (const id of [
    "pagination-live",
    "pagination-live-status",
    "pagination-uncontrolled",
    "pagination-fixed",
    "pagination-empty",
    "pagination-disabled",
    "pagination-long",
    "pagination-form-status",
  ])
    assert.ok(html.includes(`id="${id}"`), id);
});
