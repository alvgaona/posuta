#!/usr/bin/env node
// create-posuta: copy the starter poster into a new folder.
//
//   pnpm create posuta [dir] [--title "…"] [--print "A0 portrait"]
//
// Without flags it asks. The template is bundled at publish time (prepack); inside the repo it
// is read from ../../template.
import { cpSync, existsSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline/promises";
import { parseArgs } from "node:util";

const here = new URL(".", import.meta.url).pathname;
const bundled = join(here, "template");
const repo = join(here, "..", "..", "template");
const skip = (src) => !/[/\\](node_modules|dist|\.astro)([/\\]|$)/.test(src);
const pkg = JSON.parse(readFileSync(join(here, "package.json"), "utf8"));

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: { title: { type: "string" }, print: { type: "string" }, "copy-template": { type: "boolean" } },
});

if (opt["copy-template"]) {
  rmSync(bundled, { recursive: true, force: true });
  cpSync(repo, bundled, { recursive: true, filter: skip });
  // npm drops .gitignore from packages, so ship it under another name.
  cpSync(join(bundled, ".gitignore"), join(bundled, "gitignore"));
  rmSync(join(bundled, ".gitignore"));
  process.exit(0);
}

const PRINT = /^(A[0-3]|24x36in|36x48in|42x56in|48x72in)(\s+(portrait|landscape))?$/;
const rl = createInterface({ input: stdin, output: stdout });
const ask = async (q, def) => (await rl.question(`${q} (${def}) `)).trim() || def;

try {
  const dir = resolve(positionals[0] ?? (await ask("Folder for the poster", "my-poster")));
  if (existsSync(dir) && readdirSync(dir).length) throw new Error(`${dir} is not empty`);
  const title = opt.title ?? (await ask("Title", "My poster"));
  let print = opt.print ?? (await ask("Print size: A0, A1, A2, A3, 24x36in, 36x48in… and portrait or landscape", "A0 portrait"));
  if (!PRINT.test(print)) throw new Error(`unknown print size "${print}"; try "A1" or "36x48in landscape"`);
  const [size, orientation = "portrait"] = print.split(/\s+/);

  const src = existsSync(bundled) ? bundled : repo;
  cpSync(src, dir, { recursive: true, filter: skip });
  if (existsSync(join(dir, "gitignore"))) {
    cpSync(join(dir, "gitignore"), join(dir, ".gitignore"));
    rmSync(join(dir, "gitignore"));
  }

  const pj = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
  pj.name = basename(dir).toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  pj.dependencies.posuta = `^${pkg.version}`; // the workspace link becomes the published release
  writeFileSync(join(dir, "package.json"), JSON.stringify(pj, null, 2) + "\n");

  const page = join(dir, "src", "pages", "index.mdx");
  const yaml = (s) => JSON.stringify(s); // a JSON string is a valid YAML scalar
  writeFileSync(page, readFileSync(page, "utf8")
    .replace(/^title: .*$/m, `title: ${yaml(title)}`)
    .replace(/^highlight: .*\n/m, "")
    .replace(/^print: .*$/m, `print: { size: ${size}, orientation: ${orientation} }`));

  console.log(`\nDone. Next:\n  cd ${dir}\n  pnpm install\n  pnpm dev\n`);
} catch (e) {
  console.error(`create-posuta: ${e.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
}
