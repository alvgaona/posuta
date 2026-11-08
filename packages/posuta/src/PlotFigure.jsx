// Observable Plot in a React island: server-rendered SVG first (that is what prints and what
// shows without JS), then a live chart in the browser. The island's initial props are its
// print state, e.g. <Scrubber client:visible frame={62} />.
import { useEffect, useRef } from "react";
import { plotLive, renderPlot } from "./plot.js";

export default function PlotFigure({ options, className }) {
  const ref = useRef(null);
  useEffect(() => {
    let el, gone = false;
    plotLive(options).then((e) => { if (!gone) ref.current.replaceChildren((el = e)); });
    return () => { gone = true; el?.remove(); };
  }, [options]);
  const html = typeof window === "undefined" ? renderPlot(options) : "";
  return <div ref={ref} className={["posuta-plot", className].filter(Boolean).join(" ")}
    dangerouslySetInnerHTML={{ __html: html }} suppressHydrationWarning />;
}
