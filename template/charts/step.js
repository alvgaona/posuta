// The step-response chart. Used at build time (static SVG, what prints) and, because the chart is
// interactive, again in the browser. `state.t` comes from the slider. Text may hold $math$.
export default (d, Plot, { t }) => {
  // The row closest to the slider's time, for each system.
  const at = Object.values(Object.groupBy(d, (r) => r.system))
    .map((rows) => rows.reduce((a, b) => (Math.abs(b.t - t) < Math.abs(a.t - t) ? b : a)));
  return {
    width: 760, height: 320,
    x: { label: "time $t$ (s)" }, y: { label: "output $y(t)$", grid: true },
    color: { legend: true },
    marks: [
      Plot.ruleY([1], { strokeDasharray: "4 3", stroke: "currentColor", strokeOpacity: 0.4 }),
      Plot.lineY(d, { x: "t", y: "y", stroke: "system", strokeWidth: 2 }),
      Plot.ruleX([t], { stroke: "currentColor", strokeOpacity: 0.3 }),
      Plot.dot(at, { x: "t", y: "y", fill: "system", r: 4 }),
      Plot.text(at, { x: "t", y: "y", text: (r) => `$y = ${r.y.toFixed(2)}$`, dx: 10, textAnchor: "start" }),
    ],
  };
};
