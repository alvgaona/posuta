// Data files for charts: CSV, JSON or Parquet from the project's data/ folder, read at build.
import { readFile } from "node:fs/promises";
import { extname, isAbsolute, join } from "node:path";
import { autoType, csvParse } from "d3-dsv";
import { parquetReadObjects } from "hyparquet";

/**
 * Load `data/<file>` as an array of rows. Series longer than `max` rows are thinned.
 * @param {string} file path under data/ (or absolute)
 * @param {{ max?: number }} [opts]
 */
export async function load(file, { max = 2000 } = {}) {
  const root = globalThis.__posutaRoot ?? process.cwd(); // set by the integration
  const path = isAbsolute(file) ? file : join(root, "data", file);
  const ext = extname(path).toLowerCase();
  let rows;
  if (ext === ".csv") rows = csvParse(await readFile(path, "utf8"), autoType);
  else if (ext === ".json") rows = JSON.parse(await readFile(path, "utf8"));
  else if (ext === ".parquet") {
    const buf = await readFile(path);
    rows = (await parquetReadObjects({ file: buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) }))
      .map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === "bigint" ? Number(v) : v])));
  } else throw new Error(`posuta: cannot load ${file}; use .csv, .json or .parquet`);
  if (!Array.isArray(rows)) throw new Error(`posuta: ${file} must hold an array of rows`);
  return downsample(rows, max);
}

// shortcut: keeps every k-th row (plus the last), which can drop narrow peaks; switch to LTTB if a plot needs them.
export function downsample(rows, max) {
  if (!max || rows.length <= max) return rows;
  const k = (rows.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => rows[Math.round(i * k)]);
}
