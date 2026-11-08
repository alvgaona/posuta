// The step response as lines only: no slider state, so it suits static and interactive charts.
export default (d, Plot) => ({
  width: 760, height: 320,
  x: { label: "time $t$ (s)" },
  y: { label: "output $y(t)$", grid: true },
  color: { legend: true },
  marks: [
    Plot.ruleY([1], { strokeDasharray: "4 3", stroke: "currentColor", strokeOpacity: 0.4 }),
    Plot.lineY(d, { x: "t", y: "y", stroke: "system" }),
  ],
});
