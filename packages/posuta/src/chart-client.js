// Live charts: redraw each <Chart plot="name" interactive|slider> in the browser, from the same
// chart file in charts/ and the rows embedded at build time. Loaded only on pages that have one.
const charts = import.meta.glob("/charts/*.js");

async function hydrate(fig) {
  const load = charts[`/charts/${fig.dataset.chart}.js`];
  if (!load) throw new Error(`posuta: charts/${fig.dataset.chart}.js is missing from the build`);
  // Plot downloads only once a live chart scrolls into view.
  const [{ Plot, plotLive, withPointer, attachTip }, { default: chart }] = await Promise.all([import("./plot.js"), load()]);
  const rows = JSON.parse(fig.querySelector("script[type='application/json']").textContent);
  const slider = fig.dataset.slider && JSON.parse(fig.dataset.slider);
  const input = fig.querySelector(".posuta-slider input");
  const out = fig.querySelector(".posuta-slider output");
  const box = fig.querySelector(".posuta-plot");
  // The build-time drawing stays as the print frame, whatever the slider or a script shows on screen.
  const still = box.cloneNode(true);
  still.dataset.print = "only";
  box.dataset.print = "hide";
  box.after(still);
  let latest = 0;
  const render = async () => {
    const n = ++latest;
    const state = slider ? { [slider.name]: +input.value } : {};
    if (out) out.value = input.value;
    let options = { ariaLabel: fig.dataset.alt, ...chart(rows, Plot, state) };
    if (fig.hasAttribute("data-interactive")) options = withPointer(options);
    const el = await plotLive(options);
    if (n !== latest) return; // a newer slider position finished first
    box.replaceChildren(el);
    if (fig.hasAttribute("data-interactive")) attachTip(el, options, box);
  };
  if (input) {
    input.closest(".posuta-slider").hidden = false;
    input.addEventListener("input", render);
  }
  await render();
}

// Watch the plot box, not the figure: a figure with display: contents has no box to intersect.
const seen = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) {
    seen.unobserve(e.target);
    hydrate(e.target.closest(".posuta-chart")).catch((err) => console.error(err));
  }
});
document.querySelectorAll(".posuta-chart[data-chart] > .posuta-plot").forEach((b) => seen.observe(b));
