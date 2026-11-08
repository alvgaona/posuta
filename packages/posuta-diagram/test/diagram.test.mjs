import { strict as assert } from "node:assert";
import { test } from "node:test";
import { draw, layout, renderDiagram, route } from "../src/diagram.js";

const r = (x, y, w = 100, h = 50) => ({ x, y, w, h });

test("boxes in one row get a straight horizontal arrow, edge to edge", () => {
  assert.deepEqual(route(r(0, 0), r(200, 0)).pts, [[100, 25], [200, 25]]);
  assert.deepEqual(route(r(200, 0), r(0, 0)).pts, [[200, 25], [100, 25]]);
});

test("stacked boxes get a vertical arrow inside their shared x range", () => {
  assert.deepEqual(route(r(0, 0), r(50, 200)).pts, [[75, 50], [75, 200]]);
  assert.deepEqual(route(r(0, 200), r(0, 0), { x: 10 }).pts, [[10, 200], [10, 50]]);
});

test("over/under routes clear both boxes; others become elbows", () => {
  const over = route(r(0, 0), r(300, 10), { route: "over" }).pts;
  assert.ok(over[1][1] < 0 && over[1][1] === over[2][1]);
  const elbow = route(r(0, 0), r(300, 300)).pts;
  assert.equal(elbow.length, 4);
  assert.deepEqual(elbow[0], [50, 50]);
  assert.deepEqual(elbow.at(-1), [350, 300]);
});

test("YAML spec with shorthand arrows and math labels renders", () => {
  const svg = renderDiagram(`
boxes:
  a: { at: [0, 0], title: A }
  b: { at: [5, 0], title: B, style: highlight }
arrows:
  - a -> b: $\\omega$
  - b -> a
`);
  assert.match(svg, /<svg viewBox=/);
  assert.match(svg, /class="katex"/);
  assert.equal((svg.match(/<path class="arrow"/g) ?? []).length, 2);
  assert.throws(() => renderDiagram({ boxes: {}, arrows: ["a -> b"] }), /no box named "a"/);
});

test("layout gives geometry, draw turns an edited layout into SVG", () => {
  const spec = { boxes: { a: { at: [0, 0], title: "A" }, b: { at: [5, 0], title: "B" } }, arrows: ["a -> b: go"] };
  const g = layout(spec);
  assert.deepEqual(g.boxes.map((b) => [b.name, b.x, b.y, b.w, b.h]), [["a", 0, 0, 120, 56], ["b", 200, 0, 120, 56]]);
  assert.deepEqual(g.arrows[0].pts, [[120, 28], [200, 28]]);
  assert.deepEqual(g.arrows[0].labelAt, { x: 160, y: 21, anchor: "middle" });
  assert.equal(draw(g), renderDiagram(spec));
  g.boxes[1].y = 40;
  assert.match(draw(g), /<rect class="box" x="200" y="40"/);
});
