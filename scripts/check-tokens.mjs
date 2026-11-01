import { readdir, readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath, URL } from "node:url";
import ts from "typescript";

const rules = [
  ["hex-color", /#[0-9a-fA-F]{3,8}\b/g],
  ["color-function", /\b(?:rgba?|hsla?)\s*\(/gi],
  ["arbitrary-value", /-\[[^\]]+\]/g],
  ["forbidden-radius", /\brounded-(?:[trblse]{1,2}-)?(?:xl|[2-9]xl|full)\b/g],
  [
    "default-palette",
    /\b(?:bg|text|border|ring|outline|fill|stroke|shadow)-(?:red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone|black|white)(?:-\d+)?\b/g,
  ],
  [
    "non-token-typography",
    /\b(?:text-(?:xs|base|[2-9]xl|\d+(?:\.\d+)?(?:px|rem)?)|(?:font|fw)-(?:thin|extralight|light|semibold|bold|extrabold|black|[1-9]00))\b/g,
  ],
  ["non-token-shadow", /\bshadow-(?:xs|lg|xl|[2-9]xl|inner)\b/g],
  [
    "non-token-transition",
    /\b(?:duration|delay)-\d+\b|\btransition-(?!colors\b|shadow\b)[\w-]+|\banimate-[\w-]+/g,
  ],
];

const dimension =
  /(?:^|[^\w-])-?(?:\d+(?:\.\d+)?|\.\d+)(?:px|r?em|%|v[wh]|vmin|vmax|ch|ex|pt|cm|mm|in|ms|s)(?![\w-])/i;
const cssVariable = /^var\(--[\w-]+\)$/;
const structuralValue =
  /^(?:inherit|initial|unset|revert|revert-layer|none|auto)$/;
const colorProperty = /(?:color$|^--color-|^background$|^fill$|^stroke$)/;
const visualProperty =
  /(?:width|height|size|padding|margin|inset|top|right|bottom|left|gap|radius|weight|shadow|duration|delay|basis)/;

function propertyName(node) {
  return ts.isIdentifier(node) || ts.isStringLiteral(node) ? node.text : "";
}

function unwrap(node) {
  while (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isSatisfiesExpression(node)
  ) {
    node = node.expression;
  }
  return node;
}

function radiusAnnotations(source, sourceFile) {
  const scanner = ts.createScanner(
    ts.ScriptTarget.Latest,
    false,
    ts.LanguageVariant.JSX,
    source,
  );
  const annotations = [];
  for (
    let token = scanner.scan();
    token !== ts.SyntaxKind.EndOfFileToken;
    token = scanner.scan()
  ) {
    if (token !== ts.SyntaxKind.MultiLineCommentTrivia) continue;
    const text = scanner.getTokenText();
    const reason = /^\/\*\s*allow-token-bypass:\s*([\s\S]*?)\s*\*\/$/
      .exec(text)?.[1]
      .trim();
    if (!reason) continue;
    const end = scanner.getTextPos();
    annotations.push({
      end,
      line: sourceFile.getLineAndCharacterOfPosition(end).line,
    });
  }
  return annotations;
}

export function findTokenViolations(source, fileName) {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const annotations = radiusAnnotations(source, sourceFile);
  const violations = [];
  const report = (rule, value, position) => {
    const { line, character } =
      sourceFile.getLineAndCharacterOfPosition(position);
    violations.push({
      file: fileName,
      line: line + 1,
      column: character + 1,
      rule,
      value,
    });
  };

  for (const [rule, pattern] of rules) {
    for (const match of source.matchAll(pattern)) {
      const line = sourceFile.getLineAndCharacterOfPosition(match.index).line;
      if (
        rule === "forbidden-radius" &&
        annotations.some(
          (annotation) =>
            annotation.end <= match.index && line - annotation.line <= 1,
        )
      )
        continue;
      // Only the approved Spinner may animate, and its duration is token-mapped.
      if (
        rule === "non-token-transition" &&
        /(?:^|[/\\])Spinner[/\\]Spinner\.tsx$/.test(fileName) &&
        (match[0] === "animate-spinner" ||
          (match[0] === "animate-none" &&
            source.slice(0, match.index).endsWith("motion-reduce:")))
      )
        continue;
      report(rule, match[0], match.index);
    }
  }

  const checkLiteral = (name, value, position, numeric = false) => {
    const normalized = name.replace(
      /[A-Z]/g,
      (letter) => `-${letter.toLowerCase()}`,
    );
    if (cssVariable.test(value) || structuralValue.test(value)) return;
    if (
      colorProperty.test(normalized) ||
      dimension.test(value) ||
      (numeric && visualProperty.test(normalized)) ||
      /(?:font-weight|box-shadow|text-shadow|border-radius)$/.test(normalized)
    )
      report("inline-style-literal", `${name}: ${value}`, position);
  };

  const inspectCss = (text, offset) => {
    for (const match of text.matchAll(/([\w-]+)\s*:\s*([^;{}]+)/g)) {
      const value = match[2].trim();
      checkLiteral(
        match[1],
        value,
        offset + match.index,
        /^-?\d+(?:\.\d+)?$/.test(value),
      );
    }
  };

  const inspectStyle = (expression, name = "") => {
    const node = unwrap(expression);
    if (ts.isObjectLiteralExpression(node)) {
      for (const property of node.properties) {
        if (ts.isPropertyAssignment(property))
          inspectStyle(property.initializer, propertyName(property.name));
      }
    } else if (
      ts.isStringLiteral(node) ||
      ts.isNoSubstitutionTemplateLiteral(node)
    ) {
      checkLiteral(name, node.text, node.getStart(sourceFile));
    } else if (
      ts.isNumericLiteral(node) ||
      (ts.isPrefixUnaryExpression(node) && ts.isNumericLiteral(node.operand))
    ) {
      checkLiteral(
        name,
        node.getText(sourceFile),
        node.getStart(sourceFile),
        true,
      );
    } else if (ts.isTemplateExpression(node)) {
      for (const literal of [
        node.head,
        ...node.templateSpans.map((span) => span.literal),
      ]) {
        checkLiteral(name, literal.text, literal.getStart(sourceFile));
      }
    }
  };

  const visit = (node) => {
    if (
      ts.isJsxAttribute(node) &&
      propertyName(node.name) === "style" &&
      node.initializer
    ) {
      if (ts.isStringLiteral(node.initializer)) {
        inspectCss(
          node.initializer.text,
          node.initializer.getStart(sourceFile) + 1,
        );
      } else if (
        ts.isJsxExpression(node.initializer) &&
        node.initializer.expression
      ) {
        inspectStyle(node.initializer.expression);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  if (extname(fileName) === ".css") inspectCss(source, 0);
  return violations.sort(
    (left, right) => left.line - right.line || left.column - right.column,
  );
}

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await sourceFiles(path)));
    else if (entry.isFile() && /\.(?:[cm]?[jt]sx?|css)$/.test(entry.name))
      files.push(path);
  }
  return files.sort();
}

export async function checkTokens(directory) {
  const files = await sourceFiles(directory);
  const violations = [];
  for (const file of files) {
    violations.push(...findTokenViolations(await readFile(file, "utf8"), file));
  }
  return { files: files.length, violations };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const defaultRoot = fileURLToPath(
    new URL("../src/components", import.meta.url),
  );
  const directory = process.argv[2] ? resolve(process.argv[2]) : defaultRoot;
  try {
    const result = await checkTokens(directory);
    for (const violation of result.violations) {
      console.error(
        `${violation.file}:${violation.line}:${violation.column} ${violation.rule}: ${violation.value}`,
      );
    }
    if (result.violations.length) {
      console.error(
        `Token check failed: ${result.violations.length} violation(s) in ${result.files} file(s).`,
      );
      process.exitCode = 1;
    } else console.log(`Token check passed (${result.files} file(s)).`);
  } catch (error) {
    if (
      directory === defaultRoot &&
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT" &&
      "path" in error &&
      error.path === directory
    ) {
      console.log("Token check passed (0 files; no components yet).");
    } else {
      console.error(error);
      process.exitCode = 1;
    }
  }
}
