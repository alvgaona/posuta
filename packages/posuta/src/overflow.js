// The overflow check, run in the page: posuta pdf passes it to page.evaluate, the dev print
// preview imports it. Self-contained (no outer variables) so it survives serialisation.

/**
 * Measure the laid-out canvas against its padding edge. Returns null without a .posuta-canvas,
 * else a message per overflowing block (the innermost: an element led by h1–h4 or with
 * data-name), or for the canvas itself when no block is to blame. Empty when it fits.
 * @param {boolean} [mark] also set data-posuta-overflow on the blocks named
 */
export function overflow(mark = false) {
  const canvas = document.querySelector(".posuta-canvas");
  if (!canvas) return null;
  const pad = getComputedStyle(canvas);
  const box = canvas.getBoundingClientRect();
  const limit = { bottom: box.bottom - parseFloat(pad.paddingBottom), right: box.right - parseFloat(pad.paddingRight) };
  const toMm = (v) => Math.round((v * 25.4) / 96);
  const lead = (el) => (el.firstElementChild?.matches("h1, h2, h3, h4") ? el.firstElementChild : null);
  const blocks = [...canvas.querySelectorAll("*")].filter((el) => el.dataset.name || lead(el));
  const over = [];
  for (const el of blocks) {
    const r = el.getBoundingClientRect();
    const name = el.dataset.name || lead(el).textContent.trim();
    const wide = Math.max(r.right - limit.right, el.scrollWidth - el.clientWidth);
    if (r.bottom > limit.bottom + 1) over.push({ el, msg: `"${name}" runs ${toMm(r.bottom - limit.bottom)} mm past the bottom` });
    else if (wide > 1) over.push({ el, msg: `"${name}" is ${toMm(wide)} mm too wide` });
  }
  // Name the innermost block, not the column or section around it.
  const inner = over.filter((o) => !over.some((p) => p !== o && o.el.contains(p.el)));
  if (mark) inner.forEach((o) => o.el.setAttribute("data-posuta-overflow", ""));
  if (inner.length) return inner.map((o) => o.msg);
  // Nothing named overflows: check the canvas itself (its scroll size includes its end padding).
  const down = canvas.scrollHeight - canvas.clientHeight, wide = canvas.scrollWidth - canvas.clientWidth;
  if (down > 1) return [`the poster runs ${toMm(down)} mm past the bottom`];
  if (wide > 1) return [`the poster is ${toMm(wide)} mm too wide`];
  return [];
}
