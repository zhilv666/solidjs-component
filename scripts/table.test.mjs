import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";
import { after, before, test } from "node:test";
import { renderToString } from "solid-js/web";
import { createGenerator } from "unocss";
import unoConfig from "../uno.config.ts";
import { createComponentHarness } from "./component-harness.mjs";

let harness, Table, TableDemo, AppearanceProvider, state;
before(async () => {
  harness = await createComponentHarness("table");
  ({ Table } = await harness.load("/src/components/index.ts"));
  ({ TableDemo } = await harness.load("/src/components/Table/Table.demo.tsx"));
  ({ AppearanceProvider } = await harness.load("/src/theme/appearance.tsx"));
  state = await harness.load("/src/components/Table/state.ts");
});
after(async () => await harness?.close());

const data = [
  { id: "a", name: "Alpha", score: 3 },
  { id: "locked", name: "Locked", score: 2, disabled: true },
  { id: "b", name: "Beta", score: 1 },
  { id: "c", name: "Gamma", score: 1 },
  { id: "empty", name: "Empty", score: null },
];
const columns = [
  {
    key: "name",
    header: "Name",
    cell: (row) => row.name,
    sortValue: (row) => row.name,
  },
  {
    key: "score",
    header: "Score",
    cell: (row) => row.score ?? "No score",
    sortValue: (row) => row.score,
    align: "end",
  },
  {
    key: "status",
    header: "Status",
    cell: (row) => (row.disabled ? "Locked row" : "Available"),
  },
];
const baseProps = {
  data,
  columns,
  getRowKey: (row) => row.id,
  getRowLabel: (row) => row.name,
  getRowDisabled: (row) => row.disabled ?? false,
};
const render = (props = {}) =>
  renderToString(() => Table({ ...baseProps, ...props }));
const rowKeys = (html) =>
  [...html.matchAll(/data-table-key="([^"]+)"/g)].map((match) => match[1]);
const rowInputs = (html) =>
  [...html.matchAll(/<input\b[^>]*data-table-select-key="[^"]+"[^>]*>/g)].map(
    (match) => match[0],
  );
const isChecked = (input) => /\schecked(?:[\s>]|=)/.test(input);
const isDisabled = (input) => /\sdisabled(?:[\s>]|=)/.test(input);
const classes = (html) =>
  [...html.matchAll(/class="([^"]*)"/g)].flatMap((match) =>
    match[1].trim().split(/\s+/),
  );

test("table keeps native table/caption/header/body semantics and forwards native attributes and external classes", () => {
  const html = render({
    id: "native-table",
    title: "Native title",
    class: "min-w-160",
    containerClass: "w-full",
    caption: "Projects",
    "aria-label": "Project scores",
  });
  assert.equal([...html.matchAll(/<table\b/g)].length, 1);
  const table = html.match(/<table\b[^>]*>/)[0];
  for (const attribute of [
    'id="native-table"',
    'title="Native title"',
    'aria-label="Project scores"',
  ])
    assert.ok(table.includes(attribute), attribute);
  assert.match(table, /class="[^"]*min-w-160\s*"/);
  assert.match(html, /<caption\b[^>]*>Projects<\/caption>/);
  assert.ok(html.includes("<thead") && html.includes("<tbody"));
  assert.equal([...html.matchAll(/scope="col"/g)].length, 3);
  assert.deepEqual(
    rowKeys(html),
    data.map((row) => row.id),
  );
  assert.doesNotMatch(
    html,
    /role="(?:grid|gridcell)"|\stabIndex=|\saria-selected=/,
  );
  assert.doesNotMatch(
    table,
    /\s(?:data|columns|getRowKey|getRowLabel|variant|size|appearance|caption|striped|selectable|paginate|pageSize|containerClass)=/,
  );
});

test("table rejects missing/duplicate row and column keys and unsafe page sizes", () => {
  for (const invalid of ["", " ", 1, undefined])
    assert.throws(
      () => render({ data: [{ id: invalid }] }),
      /row keys must be unique, non-empty strings/,
    );
  assert.throws(() => render({ data: [data[0], data[0]] }), /row keys/);
  for (const invalid of ["", " ", 1])
    assert.throws(
      () => render({ columns: [{ ...columns[0], key: invalid }] }),
      /column keys/,
    );
  assert.throws(
    () => render({ columns: [columns[0], columns[0]] }),
    /column keys/,
  );
  for (const pageSize of [
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ])
    assert.throws(
      () => render({ paginate: true, pageSize }),
      /positive safe integer/,
    );
  assert.equal(state.getTablePageSize(3), 3);
});

test("table sorting is stable, non-mutating, evaluates each value once, and keeps empty scores last in both directions", () => {
  const rows = state.createTableRows(data, baseProps.getRowKey);
  let calls = 0;
  const sortingColumns = [
    {
      key: "score",
      sortValue: (row) => {
        calls += 1;
        return row.score;
      },
    },
  ];
  const asc = state.sortTableRows(
    rows,
    { column: "score", direction: "asc" },
    sortingColumns,
  );
  assert.deepEqual(
    asc.map((row) => row.key),
    ["b", "c", "locked", "a", "empty"],
  );
  assert.equal(calls, data.length);
  const desc = state.sortTableRows(
    rows,
    { column: "score", direction: "desc" },
    columns,
  );
  assert.deepEqual(
    desc.map((row) => row.key),
    ["a", "locked", "b", "c", "empty"],
  );
  assert.deepEqual(
    rows.map((row) => row.key),
    data.map((row) => row.id),
  );
  assert.equal(asc[0].row, data[2]);
  assert.deepEqual(
    state.sortTableRows(rows, null, columns).map((row) => row.key),
    data.map((row) => row.id),
  );
});

test("table numeric text, booleans and dates sort predictably; invalid dates and non-finite numbers are empty", () => {
  const sort = (values, direction = "asc") => {
    const rows = state.createTableRows(
      values.map((value, index) => ({ id: String(index), value })),
      (row) => row.id,
    );
    return state
      .sortTableRows(rows, { column: "value", direction }, [
        { key: "value", sortValue: (row) => row.value },
      ])
      .map((row) => Number(row.key));
  };
  assert.deepEqual(sort(["Item10", "Item2", "item2", "Item1"]), [3, 1, 2, 0]);
  assert.deepEqual(sort([true, false, true]), [1, 0, 2]);
  assert.deepEqual(
    sort([new Date("2025-01-01"), new Date("2024-01-01"), new Date("invalid")]),
    [1, 0, 2],
  );
  for (const direction of ["asc", "desc"]) {
    const result = sort([null, undefined, NaN, Infinity, 2, 1], direction);
    assert.deepEqual(result.slice(-4), [0, 1, 2, 3]);
  }
});

test("sort cycles asc/desc/none, changes columns with asc, and safely ignores removed or non-sortable columns", () => {
  const first = state.cycleTableSort(null, "score");
  const second = state.cycleTableSort(first, "score");
  assert.deepEqual(first, { column: "score", direction: "asc" });
  assert.deepEqual(second, { column: "score", direction: "desc" });
  assert.equal(state.cycleTableSort(second, "score"), null);
  assert.deepEqual(state.cycleTableSort(second, "name"), {
    column: "name",
    direction: "asc",
  });
  assert.equal(
    state.normalizeTableSort({ column: "status", direction: "asc" }, columns),
    null,
  );
  assert.equal(
    state.normalizeTableSort({ column: "missing", direction: "asc" }, columns),
    null,
  );
  assert.equal(
    state.normalizeTableSort(
      { column: "score", direction: "invalid" },
      columns,
    ),
    null,
  );
  assert.equal(state.normalizeTableSort(null, columns), null);
  assert.equal(state.normalizeTableSort(first, columns), first);
});

test("selection normalization keeps disabled row values, filters missing keys, and deduplicates without changing order", () => {
  const rows = state.createTableRows(data, baseProps.getRowKey);
  assert.deepEqual(
    state.normalizeTableKeys(["b", "missing", "locked", "b"], rows),
    ["b", "locked"],
  );
  assert.deepEqual(
    state.normalizeTableKeys(["b", "locked"], rows.slice(0, 1)),
    [],
  );
  const html = render({
    selectable: true,
    defaultValue: ["a", "locked", "missing", "a"],
  });
  assert.deepEqual(
    rowInputs(html)
      .filter(isChecked)
      .map((input) => input.match(/data-table-select-key="([^"]+)"/)[1]),
    ["a", "locked"],
  );
  assert.ok(isDisabled(rowInputs(html)[1]));
  assert.equal(
    rowInputs(
      render({ selectable: true, value: [], defaultValue: ["a"] }),
    ).filter(isChecked).length,
    0,
  );
});

test("current-page select-all and indeterminate state exclude disabled rows and preserve off-page selection", () => {
  assert.deepEqual(state.getTablePageSelection([], []), {
    checked: false,
    indeterminate: false,
  });
  assert.deepEqual(
    state.getTablePageSelection(["a", "locked", "other"], ["a", "b"]),
    { checked: false, indeterminate: true },
  );
  assert.deepEqual(
    state.getTablePageSelection(["a", "b", "locked"], ["a", "b"]),
    { checked: true, indeterminate: false },
  );
  assert.deepEqual(
    state.toggleTableSelection(["locked", "other", "a"], ["a", "b"], true),
    ["locked", "other", "a", "b"],
  );
  assert.deepEqual(
    state.toggleTableSelection(
      ["locked", "other", "a", "b"],
      ["a", "b"],
      false,
    ),
    ["locked", "other"],
  );
});

test("controlled sorting overrides defaults and aria-sort belongs only to sortable native column headers", () => {
  const sorted = render({
    sort: { column: "score", direction: "desc" },
    defaultSort: { column: "name", direction: "asc" },
  });
  assert.deepEqual(rowKeys(sorted), ["a", "locked", "b", "c", "empty"]);
  assert.equal([...sorted.matchAll(/aria-sort="descending"/g)].length, 1);
  assert.equal([...sorted.matchAll(/aria-sort="none"/g)].length, 1);
  assert.equal([...sorted.matchAll(/aria-sort=/g)].length, 2);
  const fixed = render({
    sort: null,
    defaultSort: { column: "score", direction: "asc" },
  });
  assert.deepEqual(
    rowKeys(fixed),
    data.map((row) => row.id),
  );
  assert.equal([...fixed.matchAll(/aria-sort="none"/g)].length, 2);
});

test("table sorts all rows before local paging, clamps visible pages, and uses reusable Kobalte navigation", () => {
  const props = {
    paginate: true,
    pageSize: 2,
    defaultSort: { column: "score", direction: "asc" },
  };
  assert.deepEqual(rowKeys(render({ ...props, defaultPage: 2 })), [
    "locked",
    "a",
  ]);
  assert.deepEqual(rowKeys(render({ ...props, page: 1, defaultPage: 2 })), [
    "b",
    "c",
  ]);
  const final = render({ ...props, page: 100 });
  assert.deepEqual(rowKeys(final), ["empty"]);
  assert.match(
    final,
    /aria-current="page"[^>]*aria-label="第 3 页"|aria-label="第 3 页"[^>]*aria-current="page"/,
  );
  assert.deepEqual(
    rowKeys(render({ ...props, data: data.slice(0, 1), page: 3 })),
    ["a"],
  );
  assert.deepEqual(
    rowKeys(render({ page: 3, pageSize: 2 })),
    data.map((row) => row.id),
  );
});

test("empty tables keep numeric captions, one valid empty cell and disabled selection/pagination", () => {
  const html = render({
    data: [],
    caption: 0,
    emptyContent: "No projects",
    selectable: true,
    paginate: true,
  });
  assert.match(html, /<caption\b[^>]*>0<\/caption>/);
  assert.match(html, /colspan="4"[^>]*>No projects<\/td>/);
  assert.equal(rowKeys(html).length, 0);
  assert.ok(
    [...html.matchAll(/<input\b[^>]*>/g)].every((match) =>
      isDisabled(match[0]),
    ),
  );
  assert.ok(
    [...html.matchAll(/<nav\b[\s\S]*?<\/nav>/g)][0][0]
      .match(/<button\b[^>]*>/g)
      .every(isDisabled),
  );
  assert.match(render({ data: [], columns: [] }), /colspan="1"/);
});

test("table appearance inheritance and explicit overrides preserve defaults and keep frames static and disabled controls flat", () => {
  for (const appearance of ["default", "keycap", "mahjong"]) {
    const inherited = renderToString(() =>
      AppearanceProvider({
        appearance,
        get children() {
          return Table({ ...baseProps, selectable: true, paginate: true });
        },
      }),
    );
    assert.deepEqual(
      classes(inherited),
      classes(render({ appearance, selectable: true, paginate: true })),
    );
    const explicit = renderToString(() =>
      AppearanceProvider({
        appearance,
        get children() {
          return Table({
            ...baseProps,
            appearance: "default",
            selectable: true,
            paginate: true,
          });
        },
      }),
    );
    assert.deepEqual(
      classes(explicit),
      classes(render({ selectable: true, paginate: true })),
    );
    const frame = render({ appearance }).match(
      /class="solid-table-frame[^"]*"/,
    )[0];
    assert.doesNotMatch(frame, /active:|cursor-pointer|ring-/);
    if (appearance !== "default")
      assert.ok(frame.includes(`shadow-${appearance}`));
    const disabled = render({
      appearance,
      selectable: true,
      disabled: true,
      paginate: true,
    });
    assert.ok(rowInputs(disabled).every(isDisabled));
    assert.ok(
      [...disabled.matchAll(/<button\b[^>]*>/g)].every((match) =>
        isDisabled(match[0]),
      ),
    );
    assert.doesNotMatch(disabled, /shadow-(?:keycap|mahjong)/);
  }
});

test("every table variant size appearance selection striping paging and disabled combination generates token utilities", async () => {
  const names = new Set();
  for (const variant of ["outline", "plain"])
    for (const size of ["sm", "md", "lg"])
      for (const appearance of ["default", "keycap", "mahjong"])
        for (const selectable of [false, true])
          for (const disabled of [false, true])
            for (const paginate of [false, true])
              for (const name of classes(
                render({
                  variant,
                  size,
                  appearance,
                  selectable,
                  disabled,
                  paginate,
                  striped: true,
                }),
              ))
                // peer is a selector marker, not a standalone utility.
                if (!name.startsWith("solid-") && name !== "peer")
                  names.add(name);
  const uno = await createGenerator(unoConfig);
  const { css, matched } = await uno.generate([...names].join(" "));
  for (const name of names)
    assert.ok(matched.has(name), `Missing utility: ${name}`);
  for (const variable of [
    "--color-fg",
    "--color-border",
    "--color-surface",
    "--radius-md",
    "--radius-sm",
    "--font-size-md",
    "--font-size-lg",
    "--shadow-keycap",
    "--shadow-mahjong",
    "--transition-duration",
  ])
    assert.ok(css.includes(`var(${variable})`), variable);
  assert.ok(css.includes(":focus-visible") && /overflow-x:\s*auto/.test(css));
});

test("table delegates interaction to existing Kobalte-backed controls, renders stable keys, and observes overflow without managing focus", async () => {
  const source = await readFile(
    new URL("../src/components/Table/Table.tsx", import.meta.url),
    "utf8",
  );
  assert.ok(
    source.includes('from "@kobalte/core/button"') &&
      source.includes("<Checkbox") &&
      source.includes("<Pagination"),
  );
  assert.ok(
    /<For\s+each=\{visibleKeys\(\)\}/.test(source) &&
      source.includes("rowsByKey().get(key)") &&
      /<For\s+each=\{columnKeys\(\)\}>/.test(source),
  );
  assert.ok(
    source.includes("new ResizeObserver(update)") &&
      source.includes("observer.disconnect()"),
  );
  assert.ok(source.includes('<span class="whitespace-nowrap">'));
  assert.doesNotMatch(
    source,
    /onKeyDown=|addEventListener|setTimeout|\.focus\(|role="grid"/,
  );
  const html = render({ selectable: true, paginate: true });
  assert.ok(
    [...html.matchAll(/<button\b[^>]*>/g)].every((match) =>
      match[0].includes('type="button"'),
    ),
  );
});

test("table demo covers the complete matrix, independent controlled/uncontrolled states, refusal, disabled rows, empty data and overflow", () => {
  const html = renderToString(() => TableDemo());
  for (const appearance of ["default", "keycap", "mahjong"])
    for (const variant of ["outline", "plain"])
      for (const size of ["sm", "md", "lg"])
        assert.ok(html.includes(`id="table-${appearance}-${variant}-${size}"`));
  for (const id of [
    "table-live",
    "table-live-status",
    "table-uncontrolled",
    "table-uncontrolled-status",
    "table-fixed",
    "table-fixed-status",
    "table-empty",
    "table-disabled",
    "table-long",
    "table-toggle-disabled",
    "table-toggle-order",
    "table-toggle-data",
    "table-toggle-size",
    "table-note-alpha",
    "table-form-status",
  ])
    assert.ok(html.includes(`id="${id}"`), id);
  assert.ok(html.includes("Tab/Shift+Tab") && html.includes("跨页选择保留"));
});
