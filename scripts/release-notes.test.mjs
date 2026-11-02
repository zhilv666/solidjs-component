import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { after, before, test } from "node:test";
import { fileURLToPath, pathToFileURL, URL } from "node:url";

const repository = "https://github.com/zhilv666/solidjs-component";
const script = fileURLToPath(
  new URL("./release-notes.sh", import.meta.url),
).replace(/\\/g, "/");
const temporaryRoot = resolve(tmpdir());
const prefix = "solidjs-release-notes-";
let temporaryDirectory;

before(async () => {
  temporaryDirectory = await mkdtemp(join(temporaryRoot, prefix));
});

after(async () => {
  if (!temporaryDirectory) return;
  assert.equal(dirname(resolve(temporaryDirectory)), temporaryRoot);
  assert.ok(basename(temporaryDirectory).startsWith(prefix));
  await rm(temporaryDirectory, { recursive: true, force: true });
});

function git(directory, ...args) {
  const result = spawnSync("git", args, {
    cwd: directory,
    encoding: "utf8",
    timeout: 10000,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

async function fixture(name) {
  const directory = join(temporaryDirectory, name);
  await mkdir(directory);
  git(directory, "init", "--quiet", "--initial-branch=main");
  git(directory, "config", "user.name", "Release Notes Test");
  git(directory, "config", "user.email", "release-test@example.com");
  git(directory, "config", "commit.gpgsign", "false");
  git(directory, "config", "core.hooksPath", join(directory, "hooks"));
  return directory;
}

function commit(directory, subject) {
  git(directory, "commit", "--quiet", "--allow-empty", "-m", subject);
  return git(directory, "rev-parse", "HEAD");
}

function notes(directory, tag, ...args) {
  const result = spawnSync(
    "bash",
    [script, "-t", tag, "-r", repository, ...args],
    { cwd: directory, encoding: "utf8", timeout: 10000 },
  );
  assert.ifError(result.error);
  return result;
}

test("first release preserves all commit categories, subjects and Markdown links", async () => {
  const directory = await fixture("first");
  const feature = commit(
    directory,
    "✨ feat(ui): Add [pixel] _style_ & <keys>",
  );
  const fix = commit(directory, "🐛 fix(ui)!: Preserve values");
  const documentation = commit(directory, "📝 docs(ui): Explain usage");
  const other = commit(directory, "🔧 chore(build): Package components");
  commit(directory, 'Revert "feat(ui): Add a control"');
  commit(directory, "feat(ui):Missing space");
  commit(directory, "FEAT(ui): Uppercase type");
  git(directory, "tag", "v0.0.1");
  const result = notes(directory, "v0.0.1");
  assert.equal(result.status, 0, result.stderr);
  const body = result.stdout;
  const headings = body.match(/^### .+$/gm);
  assert.deepEqual(headings, [
    "### Features",
    "### Fixes",
    "### Documentation",
    "### Other Changes",
  ]);
  assert.ok(body.includes("Add \\[pixel\\] \\_style\\_ &amp; &lt;keys&gt;"));
  for (const sha of [feature, fix, documentation, other])
    assert.ok(
      body.includes(`([${sha.slice(0, 7)}](${repository}/commit/${sha}))`),
    );
  const others = body.slice(body.indexOf("### Other Changes"));
  assert.ok(others.includes('Revert "feat(ui): Add a control"'));
  assert.ok(others.includes("feat(ui):Missing space"));
  assert.ok(others.includes("FEAT(ui): Uppercase type"));
  assert.equal(body.match(/^- /gm).length, 7);
  assert.ok(body.endsWith(`(${repository}/commits/tag/v0.0.1)\n`));
  assert.ok(!body.includes("/compare/"));
});

test("release range uses the highest lower reachable numeric version", async () => {
  const directory = await fixture("range");
  const base = commit(directory, "feat(ui): Old feature");
  git(directory, "tag", "v0.9.0");
  commit(directory, "fix(ui): Previous fix");
  git(directory, "tag", "v0.10.0");
  const target = commit(directory, "chore(build): New package");
  git(directory, "tag", "v0.11.0");
  git(directory, "tag", "v0.12.0");
  git(directory, "tag", "v0.10.1-rc.1");
  git(directory, "tag", "archive");
  git(directory, "switch", "--quiet", "-c", "unrelated", base);
  commit(directory, "feat(ui): Unreachable feature");
  git(directory, "tag", "v9.0.0");
  git(directory, "switch", "--quiet", "main");
  const result = notes(directory, "v0.11.0");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.match(/^- /gm).length, 1);
  assert.ok(result.stdout.includes(`${repository}/commit/${target}`));
  assert.ok(result.stdout.includes(`${repository}/compare/v0.10.0...v0.11.0`));
  assert.ok(!result.stdout.includes("Old feature"));
  assert.ok(!result.stdout.includes("Previous fix"));
  assert.ok(!result.stdout.includes("Unreachable feature"));
  assert.deepEqual(result.stdout.match(/^### .+$/gm), ["### Other Changes"]);
});

test("release notes include merged changes but exclude merge commit subjects", async () => {
  const directory = await fixture("merge");
  commit(directory, "chore(init): Initialize");
  git(directory, "tag", "v0.0.1");
  git(directory, "switch", "--quiet", "-c", "feature");
  commit(directory, "feat(ui): Branch feature");
  git(directory, "switch", "--quiet", "main");
  commit(directory, "docs(ui): Main documentation");
  git(
    directory,
    "merge",
    "--quiet",
    "--no-ff",
    "feature",
    "-m",
    "feat(ui): Merge marker",
  );
  git(directory, "tag", "v0.1.0");
  const result = notes(directory, "v0.1.0");
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.stdout.match(/^- /gm).length, 2);
  assert.ok(result.stdout.includes("Branch feature"));
  assert.ok(result.stdout.includes("Main documentation"));
  assert.ok(!result.stdout.includes("Merge marker"));
});

test("release notes write reproducible output without changing tracked files", async () => {
  const directory = await fixture("output");
  commit(directory, "feat(ui): First feature");
  git(directory, "tag", "v0.0.1");
  const expected = notes(directory, "v0.0.1");
  assert.equal(expected.status, 0, expected.stderr);
  const output = join(directory, "release-notes.md").replace(/\\/g, "/");
  for (let attempt = 0; attempt < 2; attempt++) {
    const result = notes(directory, "v0.0.1", "-o", output);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(await readFile(output, "utf8"), expected.stdout);
    assert.equal(git(directory, "diff", "--name-only"), "");
  }
});

test("release notes reject malformed tags, missing tags, HTTP URLs and shallow history", async () => {
  const directory = await fixture("invalid");
  commit(directory, "feat(ui): First feature");
  commit(directory, "fix(ui): Second change");
  git(directory, "tag", "v0.0.1");
  for (const tag of ["latest", "v0.0.1-beta.1", "v0.0.2"]) {
    const result = notes(directory, tag);
    assert.notEqual(result.status, 0);
    assert.equal(result.stdout, "");
  }
  const http = notes(
    directory,
    "v0.0.1",
    "-r",
    "http://github.com/example/repo",
  );
  assert.notEqual(http.status, 0);
  assert.match(http.stderr, /HTTPS repository URL/);
  const shallow = join(temporaryDirectory, "shallow");
  git(
    directory,
    "clone",
    "--quiet",
    "--depth=1",
    pathToFileURL(directory).href,
    shallow,
  );
  assert.equal(git(shallow, "rev-parse", "--is-shallow-repository"), "true");
  const result = notes(shallow, "v0.0.1");
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /complete Git history/);
  assert.equal(result.stdout, "");
});
