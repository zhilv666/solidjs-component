import assert from "node:assert/strict";
import {
  cp,
  mkdir,
  mkdtemp,
  readFile,
  realpath,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { after, before, test } from "node:test";
import { fileURLToPath, URL } from "node:url";
import ts from "typescript";
import { build } from "vite";
import { buildLibraryTypes } from "./build-types.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const temporaryRoot = resolve(tmpdir());
const prefix = "solidjs-library-";
let temporaryDirectory, outputDirectory, consumerFile, dependencyFile, manifest;

before(async () => {
  temporaryDirectory = await mkdtemp(join(temporaryRoot, prefix));
  outputDirectory = join(temporaryDirectory, "dist-lib");
  manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  await build({
    root,
    configFile: join(root, "vite.config.ts"),
    mode: "library",
    cacheDir: join(temporaryDirectory, "vite-cache"),
    logLevel: "error",
    build: { outDir: outputDirectory },
  });
  buildLibraryTypes(join(outputDirectory, "types"));

  const consumerDirectory = join(temporaryDirectory, "consumer");
  const modulesDirectory = join(consumerDirectory, "node_modules");
  const packageDirectory = join(modulesDirectory, manifest.name);
  await mkdir(packageDirectory, { recursive: true });
  await cp(outputDirectory, join(packageDirectory, "dist-lib"), {
    recursive: true,
  });
  await writeFile(
    join(packageDirectory, "package.json"),
    JSON.stringify(manifest),
  );
  await writeFile(join(consumerDirectory, "package.json"), '{"type":"module"}');
  for (const dependency of ["solid-js", "@kobalte/core", "clsx"]) {
    const target = join(modulesDirectory, dependency);
    await mkdir(dirname(target), { recursive: true });
    await symlink(
      await realpath(join(root, "node_modules", dependency)),
      target,
      "junction",
    );
  }
  consumerFile = join(consumerDirectory, "consumer.tsx");
  await writeFile(consumerFile, consumerSource);
  dependencyFile = join(consumerDirectory, "dependency.ts");
  await writeFile(
    dependencyFile,
    'export type { DialogContentProps } from "@kobalte/core/dialog";',
  );
});

after(async () => {
  if (!temporaryDirectory) return;
  assert.equal(dirname(resolve(temporaryDirectory)), temporaryRoot);
  assert.ok(basename(temporaryDirectory).startsWith(prefix));
  await rm(temporaryDirectory, { recursive: true, force: true });
});

test("library artifacts preserve the public exports, standalone CSS and external runtime dependencies", async () => {
  const code = await readFile(join(outputDirectory, "index.js"), "utf8");
  const css = await readFile(join(outputDirectory, "style.css"), "utf8");
  const bundle = ts.createSourceFile(
    "index.js",
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS,
  );
  const imports = [],
    exports = [];
  for (const node of bundle.statements) {
    if (ts.isImportDeclaration(node)) imports.push(node.moduleSpecifier.text);
    if (
      ts.isExportDeclaration(node) &&
      node.exportClause &&
      ts.isNamedExports(node.exportClause)
    )
      exports.push(...node.exportClause.elements.map((item) => item.name.text));
  }
  for (const dependency of ["solid-js", "@kobalte/core", "clsx"])
    assert.ok(
      imports.some(
        (name) => name === dependency || name.startsWith(`${dependency}/`),
      ),
      `Missing external dependency ${dependency}`,
    );
  for (const name of imports)
    assert.ok(
      ["solid-js", "@kobalte/core", "clsx"].some(
        (dependency) =>
          name === dependency || name.startsWith(`${dependency}/`),
      ),
      `Unexpected bundled import ${name}`,
    );

  const config = ts.readConfigFile(
    join(root, "tsconfig.json"),
    ts.sys.readFile,
  );
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
  const program = ts.createProgram(
    [join(root, "src/index.ts")],
    parsed.options,
  );
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(join(root, "src/index.ts"));
  const expected = checker
    .getExportsOfModule(checker.getSymbolAtLocation(source))
    .filter(
      (symbol) =>
        (symbol.flags & ts.SymbolFlags.Alias
          ? checker.getAliasedSymbol(symbol)
          : symbol
        ).flags & ts.SymbolFlags.Value,
    )
    .map((symbol) => symbol.name);
  assert.deepEqual(exports.sort(), expected.sort());
  for (const variable of [
    "--font-family",
    "--color-primary",
    "--radius-pixel",
    "--shadow-keycap-pressed",
    "--shadow-mahjong-pressed",
    "--shadow-pixel-pressed",
    "--animation-spin-duration",
  ])
    assert.ok(css.includes(variable), `Missing standalone style ${variable}`);
  for (const palette of ["sakura", "mint", "lavender", "apricot"])
    assert.ok(
      css.includes(`data-palette=${palette}`) ||
        css.includes(`data-palette="${palette}"`),
      `Missing palette ${palette}`,
    );
  assert.match(css, /prefers-reduced-motion\s*:\s*reduce/);
  assert.ok(css.includes(".peer:active"));
});

test("package entries expose ESM, types and CSS while Solid remains a peer", async () => {
  assert.equal(manifest.private, true);
  assert.equal(
    manifest.peerDependencies["solid-js"],
    manifest.devDependencies["solid-js"],
  );
  assert.ok(!Object.hasOwn(manifest.dependencies, "solid-js"));
  assert.deepEqual(manifest.files, ["dist-lib"]);
  assert.ok(manifest.sideEffects.includes("**/*.css"));
  assert.equal(manifest.main, manifest.exports["."].import);
  assert.equal(manifest.module, manifest.exports["."].import);
  assert.equal(manifest.types, manifest.exports["."].types);
  for (const entry of [
    manifest.exports["."].import,
    manifest.exports["."].types,
    manifest.exports["./style.css"],
  ])
    assert.ok(
      (
        await readFile(
          join(
            temporaryDirectory,
            "consumer/node_modules",
            manifest.name,
            entry,
          ),
        )
      ).length,
      `Missing package entry ${entry}`,
    );
});

for (const [name, module, moduleResolution] of [
  ["Bundler", ts.ModuleKind.ESNext, ts.ModuleResolutionKind.Bundler],
  ["NodeNext", ts.ModuleKind.NodeNext, ts.ModuleResolutionKind.NodeNext],
])
  test(`strict ${name} consumers add no declaration errors and compile without repository aliases`, () => {
    const options = {
      target: ts.ScriptTarget.ES2022,
      module,
      moduleResolution,
      jsx: ts.JsxEmit.Preserve,
      jsxImportSource: "solid-js",
      strict: true,
      noEmit: true,
      skipLibCheck: false,
      noUncheckedSideEffectImports: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      types: [],
    };
    const program = ts.createProgram([consumerFile], options);
    const diagnostics = ts.getPreEmitDiagnostics(program);
    const dependencyProgram = ts.createProgram([dependencyFile], options);
    const dependencyDiagnostics = ts.getPreEmitDiagnostics(dependencyProgram);
    // Kobalte 0.13.14 emits invalid typeof aliases in its Dialog namespace.
    // Check our declarations fully and compare with a direct dependency import.
    assert.equal(dependencyDiagnostics.length, 27);
    for (const diagnostic of dependencyDiagnostics) {
      assert.equal(diagnostic.code, 2693);
      assert.ok(
        diagnostic.file.fileName
          .replace(/\\/g, "/")
          .endsWith("/@kobalte/core/dist/index-e96454a3.d.ts"),
      );
      assert.match(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
        /^'Dialog\w+' only refers to a type, but is being used as a value here\.$/,
      );
    }
    const diagnosticKeys = (values) =>
      values
        .map((diagnostic) =>
          JSON.stringify([
            diagnostic.file?.fileName,
            diagnostic.start,
            diagnostic.code,
            ts.flattenDiagnosticMessageText(diagnostic.messageText, " "),
          ]),
        )
        .sort();
    assert.deepEqual(
      diagnosticKeys(diagnostics),
      diagnosticKeys(dependencyDiagnostics),
    );
    const configuredProgram = ts.createProgram([consumerFile], {
      ...options,
      skipLibCheck: true,
    });
    const configuredDiagnostics = ts.getPreEmitDiagnostics(configuredProgram);
    assert.equal(
      configuredDiagnostics.length,
      0,
      ts.formatDiagnosticsWithColorAndContext(configuredDiagnostics, {
        getCanonicalFileName: (file) => file,
        getCurrentDirectory: () => root,
        getNewLine: () => "\n",
      }),
    );
  });

const consumerSource = `
import { createSignal } from "solid-js";
import {
  Alert, AppearanceProvider, Avatar, Badge, Breadcrumb, Button, Card, Checkbox,
  Content, Dialog, Divider, DropdownMenu, Footer, FormField, Header, Input,
  Layout, List, Pagination, Popover, Radio, RadioGroup, Select, Sidebar, Skeleton,
  Spinner, Switch, Table, Tabs, Tag, Textarea, Toast, Toaster, Tooltip,
  getAppearanceClasses, toast, useAppearance,
  type ButtonProps, type ComponentAppearance, type ListItem, type ListProps,
  type SelectOption, type TableColumn, type TableProps, type TableSortState,
} from "solidjs-component";

export const components = {
  Alert, AppearanceProvider, Avatar, Badge, Breadcrumb, Button, Card, Checkbox,
  Content, Dialog, Divider, DropdownMenu, Footer, FormField, Header, Input,
  Layout, List, Pagination, Popover, Radio, RadioGroup, Select, Sidebar, Skeleton,
  Spinner, Switch, Table, Tabs, Tag, Textarea, Toast, Toaster, Tooltip,
  getAppearanceClasses, toast, useAppearance,
};
interface Row { id: string; label: string; score: number; }
const rows: readonly Row[] = [{ id: "one", label: "One", score: 1 }];
const columns: readonly TableColumn<Row>[] = [
  { key: "label", header: "Label", cell: (row) => row.label, sortValue: (row) => row.label },
];
const items: readonly ListItem[] = [{ value: "one", label: "One" }];
const options: readonly SelectOption[] = [{ value: "one", label: "One" }];
const appearance: ComponentAppearance = "pixel";
export const buttonProps: ButtonProps = { variant: "mahjong", size: "md" };

export function Consumer() {
  const [value, setValue] = createSignal<readonly string[]>([]);
  const [sort, setSort] = createSignal<TableSortState | null>(null);
  return (
    <AppearanceProvider appearance={appearance}>
      <Card>
        <Button {...buttonProps}>Save</Button>
        <FormField label="Name">{(control) => <Input {...control} name="name" />}</FormField>
        <Select options={options} aria-label="Option" />
        <Dialog>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal><Dialog.Content>
            <Dialog.Title>Editor</Dialog.Title>
            <Dialog.Description>Edit a value.</Dialog.Description>
            <Dialog.CloseButton aria-label="Close" />
          </Dialog.Content></Dialog.Portal>
        </Dialog>
        <Breadcrumb aria-label="Path"><Breadcrumb.List><Breadcrumb.Item>
          <Breadcrumb.Link current>Home</Breadcrumb.Link>
        </Breadcrumb.Item></Breadcrumb.List></Breadcrumb>
        <Tabs defaultValue="one"><Tabs.List><Tabs.Trigger value="one">One</Tabs.Trigger></Tabs.List>
          <Tabs.Content value="one">Panel</Tabs.Content>
        </Tabs>
        <List items={items} selectionMode="multiple" value={value()} onValueChange={setValue} aria-label="Items" />
        <Table data={rows} columns={columns} getRowKey={(row) => row.id} caption="Rows"
          selectable value={value()} onValueChange={setValue} sort={sort()} onSortChange={setSort} />
        <Toaster />
      </Card>
    </AppearanceProvider>
  );
}

// @ts-expect-error Button retains its independent variant API.
export const invalidButton: ButtonProps = { appearance: "pixel" };
// @ts-expect-error Selection lists cannot contain interactive action slots.
export const invalidList: ListProps = { items, selectionMode: "single", renderAction: () => <button>Action</button> };
// @ts-expect-error Row keys must be strings.
export const invalidTable: TableProps<Row> = { data: rows, columns, getRowKey: () => 1 };
`;
