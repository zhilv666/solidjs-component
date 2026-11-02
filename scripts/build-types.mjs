import { dirname, relative, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import ts from "typescript";

const root = fileURLToPath(new URL("../", import.meta.url));
const formatHost = {
  getCanonicalFileName: (file) => file,
  getCurrentDirectory: () => root,
  getNewLine: () => "\n",
};

function checkDiagnostics(diagnostics) {
  if (diagnostics.length)
    throw new Error(
      ts.formatDiagnosticsWithColorAndContext(diagnostics, formatHost),
    );
}

/** Declarations must resolve without the repository's aliases or CSS loader. */
function portableImports(options) {
  const cache = ts.createModuleResolutionCache(
    root,
    ts.sys.useCaseSensitiveFileNames
      ? (file) => file
      : (file) => file.toLowerCase(),
    options,
  );
  return (context) => (source) => {
    const rewrite = (specifier) => {
      if (!specifier.startsWith(".") && !specifier.startsWith("@/"))
        return specifier;
      const resolved = ts.resolveModuleName(
        specifier,
        source.fileName,
        options,
        ts.sys,
        cache,
      ).resolvedModule;
      if (!resolved)
        throw new Error(
          `Cannot resolve declaration import ${specifier} in ${source.fileName}`,
        );
      const path = relative(dirname(source.fileName), resolved.resolvedFileName)
        .replace(/\\/g, "/")
        .replace(/\.tsx?$/, ".js");
      return path.startsWith(".") ? path : `./${path}`;
    };
    const visit = (node) => {
      if (
        ts.isImportDeclaration(node) &&
        ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const specifier = node.moduleSpecifier.text;
        if (/\.css(?:$|[?#])/.test(specifier)) return undefined;
        return ts.factory.updateImportDeclaration(
          node,
          node.modifiers,
          node.importClause,
          ts.factory.createStringLiteral(rewrite(specifier)),
          node.attributes,
        );
      }
      if (
        ts.isExportDeclaration(node) &&
        node.moduleSpecifier &&
        ts.isStringLiteral(node.moduleSpecifier)
      )
        return ts.factory.updateExportDeclaration(
          node,
          node.modifiers,
          node.isTypeOnly,
          node.exportClause,
          ts.factory.createStringLiteral(rewrite(node.moduleSpecifier.text)),
          node.attributes,
        );
      if (
        ts.isImportTypeNode(node) &&
        ts.isLiteralTypeNode(node.argument) &&
        ts.isStringLiteral(node.argument.literal)
      )
        return ts.factory.updateImportTypeNode(
          node,
          ts.factory.createLiteralTypeNode(
            ts.factory.createStringLiteral(rewrite(node.argument.literal.text)),
          ),
          node.attributes,
          node.qualifier,
          node.typeArguments,
          node.isTypeOf,
        );
      return ts.visitEachChild(node, visit, context);
    };
    return ts.visitNode(source, visit);
  };
}

export function buildLibraryTypes(outDir = resolve(root, "dist-lib/types")) {
  const configPath = resolve(root, "tsconfig.json");
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  checkDiagnostics(config.error ? [config.error] : []);
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    root,
    {
      noEmit: false,
      declaration: true,
      declarationMap: false,
      emitDeclarationOnly: true,
      rootDir: resolve(root, "src"),
      outDir,
    },
    configPath,
  );
  const program = ts.createProgram(
    [resolve(root, "src/index.ts")],
    parsed.options,
  );
  checkDiagnostics([...parsed.errors, ...ts.getPreEmitDiagnostics(program)]);
  const result = program.emit(undefined, undefined, undefined, true, {
    afterDeclarations: [portableImports(parsed.options)],
  });
  checkDiagnostics(result.diagnostics);
  if (result.emitSkipped)
    throw new Error("Library declaration emission was skipped.");
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  buildLibraryTypes();
  console.log("Library declarations generated in dist-lib/types.");
}
