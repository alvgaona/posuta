// A poster built from the tools only (test/fixtures/custom): its own layout on <Canvas>, no
// theme.css, a CSS grid, a hand-drawn SVG, a chart and APA references. It must build and export.
import { strict as assert } from "node:assert";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const dir = fileURLToPath(new URL("fixtures/custom/", import.meta.url));
const cli = fileURLToPath(new URL("../bin/posuta.mjs", import.meta.url));
const out = mkdtempSync(join(tmpdir(), "posuta-custom-"));
const pdf = (...args) => spawnSync(process.execPath, [cli, "pdf", "--dist", join(dir, "dist"), "--no-png", ...args], { encoding: "utf8" });

test("a poster built from the tools only builds, exports, and names an overflowing block", { timeout: 180_000 }, () => {
  const build = spawnSync(join(dir, "node_modules/.bin/astro"), ["build"], { cwd: dir, encoding: "utf8" });
  assert.equal(build.status, 0, build.stdout + build.stderr);

  const ok = pdf("--out", join(out, "poster.pdf"));
  assert.equal(ok.status, 0, ok.stderr);
  assert.ok(existsSync(join(out, "poster.pdf")));

  const over = pdf("--page", "/overflow/", "--out", join(out, "overflow.pdf"));
  assert.equal(over.status, 1);
  assert.match(over.stderr, /"tall figure" runs \d+ mm past the bottom/);
  assert.doesNotMatch(over.stderr, /"Method"/);
});
