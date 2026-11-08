# The pole figure: matplotlib with posuta's style, saved as SVG and placed with <Figure>.
#   uv run --with matplotlib figures/poles.py   (or python figures/poles.py with matplotlib installed)
import logging
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np

logging.getLogger("matplotlib.font_manager").setLevel(logging.ERROR)  # the browser has the font
here = Path(__file__).parent
plt.style.use(here.parent / "node_modules/posuta/posuta.mplstyle")

wn = 4.0
fig, ax = plt.subplots(figsize=(4.6, 3.0))
th = np.linspace(np.pi / 2, 3 * np.pi / 2, 200)
ax.plot(wn * np.cos(th), wn * np.sin(th), color="#6f6e77", lw=0.8, ls="--")
for zeta, color in [(0.7, "#efb118"), (0.2, "#4269d0")]:  # the chart's colours
    s, wd = -zeta * wn, wn * np.sqrt(1 - zeta**2)
    ax.plot([s, s], [wd, -wd], "x", color=color, ms=9, mew=2, label=f"ζ = {zeta}")
    ax.plot([0, s], [0, wd], color=color, lw=0.8, alpha=0.5)
ax.axhline(0, color="#6f6e77", lw=0.8)
ax.axvline(0, color="#6f6e77", lw=0.8)
ax.grid(False)  # light grid lines glare in dark mode
ax.set(xlim=(-7, 1), ylim=(-4.6, 4.6), xlabel="Re s", ylabel="Im s")
ax.legend(loc="center left")

out = here / "poles.svg"
fig.savefig(out)
# Text in currentColor, so the figure follows the page in dark mode.
out.write_text(out.read_text().replace("#282a30", "currentColor"))
