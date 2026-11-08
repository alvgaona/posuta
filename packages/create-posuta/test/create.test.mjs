import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

const cli = new URL("../index.mjs", import.meta.url).pathname;

test("copies the template with the title, print size and a real posuta version", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "create-posuta-")), "my poster");
  const r = spawnSync(process.execPath, [cli, dir, "--title", "Tilted: rotors, faults", "--print", "A1 landscape"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  const mdx = readFileSync(join(dir, "src/pages/index.mdx"), "utf8");
  assert.match(mdx, /^title: "Tilted: rotors, faults"$/m);
  assert.doesNotMatch(mdx, /^highlight:/m);
  assert.match(mdx, /^print: \{ size: A1, orientation: landscape \}$/m);
  const pj = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  assert.equal(pj.name, "my-poster");
  assert.match(pj.dependencies["@posuta/posuta"], /^\^\d/);
  assert.ok(existsSync(join(dir, ".gitignore")));
  assert.ok(existsSync(join(dir, ".github/workflows/deploy.yaml")));
  assert.ok(!existsSync(join(dir, "node_modules")) && !existsSync(join(dir, "dist")));
});

test("rejects an unknown print size", () => {
  const dir = join(mkdtempSync(join(tmpdir(), "create-posuta-")), "p");
  const r = spawnSync(process.execPath, [cli, dir, "--title", "x", "--print", "B5"], { encoding: "utf8" });
  assert.equal(r.status, 1);
  assert.match(r.stderr, /unknown print size "B5"/);
});

test("works when installed inside node_modules, as npm and pnpm create run it", () => {
  const root = mkdtempSync(join(tmpdir(), "create-posuta-"));
  const pkg = join(root, "node_modules", "create-posuta");
  mkdirSync(pkg, { recursive: true });
  for (const f of ["index.mjs", "package.json"]) cpSync(new URL(`../${f}`, import.meta.url), join(pkg, f));
  cpSync(new URL("../../../template", import.meta.url), join(pkg, "template"), {
    recursive: true,
    filter: (src) => !/[/\\](node_modules|dist|\.astro)$/.test(src),
  });
  const dir = join(root, "poster");
  const r = spawnSync(process.execPath, [join(pkg, "index.mjs"), dir, "--title", "x", "--print", "A1"], { encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr);
  assert.ok(existsSync(join(dir, "src/pages/index.mdx")));
});
