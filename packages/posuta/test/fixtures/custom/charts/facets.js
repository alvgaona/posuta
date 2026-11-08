// Two facets, one above the other: the tooltip must follow the point in the lower one.
export default (d, Plot) => ({
  width: 600, height: 140,
  marks: [Plot.dot(d, { x: "t", y: "v", fy: (r) => (r.t < 5 ? "early" : "late") })],
});
