// A BibTeX entry for the poster itself, so the web page can be cited.
//   bibtex({ title, authors: ["Ada Lovelace", "Babbage, Charles"], event: "ICRA 2026", year: 2026, doi, url })

const esc = (s) => String(s).replace(/[&%#_$]/g, "\\$&");
const last = (name) => (name.includes(",") ? name.split(",")[0] : name.trim().split(/\s+/).at(-1));
const ascii = (s) => s.normalize("NFD").replace(/[^A-Za-z0-9]/g, "").toLowerCase();

/**
 * @param {{ title: string, authors: string[], year: number | string, event?: string, doi?: string, url?: string, key?: string }} c
 *   authors as "First Last" or "Last, First"; event: where it was presented
 */
export function bibtex({ title, authors, year, event, doi, url, key }) {
  if (!title || !authors?.length || !year) throw new Error("posuta bibtex: needs title, authors and year");
  key ??= ascii(last(authors[0])) + year + ascii(title.split(/\s+/).find((w) => w.length > 3) ?? "");
  const fields = [
    ["author", authors.map(esc).join(" and ")],
    ["title", `{${esc(title)}}`], // double braces keep its capitals
    ["howpublished", event ? `Poster, ${esc(event)}` : "Poster"],
    ["year", year],
    doi && ["doi", doi],
    url && ["url", url],
  ].filter(Boolean);
  return `@misc{${key},\n${fields.map(([k, v]) => `  ${k.padEnd(12)} = {${v}}`).join(",\n")}\n}`;
}
