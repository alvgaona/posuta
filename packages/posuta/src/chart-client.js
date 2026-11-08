// Live charts: redraw each <Chart plot="name" interactive|slider> in the browser, from the same
// chart file in charts/ and the rows embedded at build time. Loaded only on pages that have one.
const charts = import.meta.glob("/charts/*.js");

async function hydrate(fig) {
  const load = charts[`/charts/${fig.dataset.chart}.js`];
  if (!load) throw new Error(`posuta: charts/${fig.dataset.chart}.js is missing from the build`);
  // Plot downloads only once a live chart scrolls into view.
  const [{ Plot, plot: draw, withPointer }, { default: chart }] = await Promise.all([import("./plot.js"), load()]);
  const rows = JSON.parse(fig.querySelector("script[type='application/json']").textContent);
  const slider = fig.dataset.slider && JSON.parse(fig.dataset.slider);
  const input = fig.querySelector(".posuta-slider input");
  const out = fig.querySelector(".posuta-slider output");
  const box = fig.querySelector(".posuta-plot");
  const render = () => {
    const state = slider ? { [slider.name]: +input.value } : {};
    if (out) out.value = input.value;
    let options = { ariaLabel: fig.dataset.alt, ...chart(rows, Plot, state) };
    if (fig.hasAttribute("data-interactive")) options = withPointer(options);
    box.replaceChildren(draw(options));
  };
  if (input) {
    input.closest(".posuta-slider").hidden = false;
    input.addEventListener("input", render);
  }
  render();
}

const seen = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) {
    seen.unobserve(e.target);
    hydrate(e.target).catch((err) => console.error(err));
  }
});
document.querySelectorAll(".posuta-chart[data-chart]").forEach((f) => seen.observe(f));
