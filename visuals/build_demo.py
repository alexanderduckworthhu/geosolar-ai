#!/usr/bin/env python3
"""16:9 product demo of the GeoSolar explorer, styled like the live UI."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np
from matplotlib.patches import Polygon, Rectangle
from matplotlib.path import Path as MplPath
from matplotlib.patches import PathPatch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
from theme import COPPER, INK, KLASSE_COLORS, MUTED, PAPER, SUN

HEXES = json.loads((ROOT / "frontend" / "data" / "hexes.json").read_text())
ROOFS = json.loads((ROOT / "frontend" / "data" / "roofs.json").read_text())
OUT = ROOT / "visuals"

CLASS = [KLASSE_COLORS[k] for k in range(1, 6)]


def lerp(a, b, t):
    pa = [int(a[i : i + 2], 16) for i in (1, 3, 5)]
    pb = [int(b[i : i + 2], 16) for i in (1, 3, 5)]
    m = [int(pa[i] + (pb[i] - pa[i]) * t) for i in range(3)]
    return f"#{m[0]:02x}{m[1]:02x}{m[2]:02x}"


def hex_color(h, floor=1, mode="mean"):
    if h["mean_klasse"] < floor:
        return "#101a16"
    if mode == "pct4":
        return lerp("#1e3a2f", "#f0c27a", min(1, h["pct4"] / 55))
    x = h["mean_klasse"]
    i = max(0, min(3, int(x) - 1))
    t = x - int(x)
    return lerp(CLASS[i], CLASS[i + 1], t)


def in_city(lat, lon, city):
    if city["id"] == "ch":
        return True
    dlat = (lat - city["lat"]) * 111
    dlon = (lon - city["lon"]) * 111 * np.cos(np.radians(city["lat"]))
    return np.hypot(dlat, dlon) <= city["radius_km"]


def city_by(cid):
    return next(c for c in HEXES["cities"] if c["id"] == cid)


def hex_clip():
    # pointy-top hex in axes 0–1 of the map panel
    return np.array([[0.50, 0.96], [0.91, 0.73], [0.91, 0.27], [0.50, 0.04], [0.09, 0.27], [0.09, 0.73]])


def fig_base():
    import matplotlib.pyplot as plt

    fig = plt.figure(figsize=(16, 9), dpi=120)
    fig.patch.set_facecolor(PAPER)
    ax = fig.add_axes([0.03, 0.08, 0.62, 0.82])
    ax.set_facecolor(PAPER)
    ax.set_xticks([])
    ax.set_yticks([])
    for s in ax.spines.values():
        s.set_visible(False)
    axp = fig.add_axes([0.68, 0.10, 0.29, 0.78])
    axp.set_facecolor("#101a16")
    for s in axp.spines.values():
        s.set_color("#24332c")
    axp.set_xticks([])
    axp.set_yticks([])
    axp.set_xlim(0, 1)
    axp.set_ylim(0, 1)
    axp.add_patch(Rectangle((0, 0), 0.018, 1, color=COPPER, transform=axp.transAxes, zorder=5))
    fig.text(0.03, 0.945, "GeoSolar", color=INK, fontsize=18, fontweight="medium")
    fig.text(0.145, 0.948, "AI", color=COPPER, fontsize=10, fontweight="medium")
    return fig, ax, axp


def draw_hexes(ax, hexes, floor=1, mode="mean"):
    lons = [p[0] for h in hexes for p in h["ring"]]
    lats = [p[1] for h in hexes for p in h["ring"]]
    ax.set_xlim(min(lons) - 0.15, max(lons) + 0.15)
    ax.set_ylim(min(lats) - 0.12, max(lats) + 0.12)
    ax.set_aspect("equal")
    for h in hexes:
        ring = np.array(h["ring"])
        ax.add_patch(
            Polygon(
                np.column_stack([ring[:, 0], ring[:, 1]]),
                facecolor=hex_color(h, floor, mode),
                edgecolor=PAPER,
                lw=0.15,
                zorder=2,
            )
        )


def draw_roofs(ax, rows, city):
    pts = [r for r in rows if in_city(r[0], r[1], city)]
    if city["id"] != "ch":
        ax.set_xlim(city["lon"] - 0.06, city["lon"] + 0.06)
        ax.set_ylim(city["lat"] - 0.04, city["lat"] + 0.04)
    ax.set_aspect("equal")
    cols = [CLASS[int(r[2]) - 1] for r in pts]
    ax.scatter([r[1] for r in pts], [r[0] for r in pts], s=6, c=cols, linewidths=0, zorder=3)


def panel(axp, kicker, title, m1, l1, m2, l2, insight, caption):
    axp.text(0.08, 0.92, kicker.upper(), color=COPPER, fontsize=8, transform=axp.transAxes)
    axp.text(0.08, 0.84, title, color=INK, fontsize=16, transform=axp.transAxes)
    axp.text(0.08, 0.68, m1, color=INK, fontsize=22, transform=axp.transAxes)
    axp.text(0.08, 0.62, l1, color=MUTED, fontsize=8, transform=axp.transAxes)
    axp.text(0.52, 0.68, m2, color=INK, fontsize=22, transform=axp.transAxes)
    axp.text(0.52, 0.62, l2, color=MUTED, fontsize=8, transform=axp.transAxes)
    axp.text(0.08, 0.46, insight, color="#d7e0d8", fontsize=9, transform=axp.transAxes, wrap=True)
    axp.text(0.08, 0.12, caption, color=MUTED, fontsize=8, transform=axp.transAxes)


def scene_title():
    import matplotlib.pyplot as plt

    fig = plt.figure(figsize=(16, 9), dpi=120)
    fig.patch.set_facecolor(PAPER)
    fig.text(0.08, 0.58, "GeoSolar AI", color=INK, fontsize=42, fontweight="medium")
    fig.text(0.08, 0.48, "Swiss rooftop solar, from the Sonnendach cadastre.", color=MUTED, fontsize=16)
    fig.text(0.08, 0.22, "Hex neighbourhoods  ·  each roof  ·  EN / DE / FR / IT", color=COPPER, fontsize=12)
    return fig


def scene_end():
    import matplotlib.pyplot as plt

    fig = plt.figure(figsize=(16, 9), dpi=120)
    fig.patch.set_facecolor(PAPER)
    fig.text(0.08, 0.55, "Open the explorer", color=INK, fontsize=32)
    fig.text(0.08, 0.44, "cd frontend && python3 -m http.server 8000", color=SUN, fontsize=14)
    fig.text(0.08, 0.22, "100,000 official roofs  ·  no live API", color=MUTED, fontsize=12)
    return fig


def rgb(fig):
    fig.canvas.draw()
    buf = np.asarray(fig.canvas.buffer_rgba())[:, :, :3].copy()
    return buf


def main():
    import matplotlib.pyplot as plt
    import imageio.v2 as imageio

    cities = {c["id"]: c for c in HEXES["cities"]}
    frames = []

    def hold(fig, n=8):
        im = rgb(fig)
        plt.close(fig)
        frames.extend([im] * n)

    hold(scene_title(), 10)

    vis = HEXES["hexes"]
    fig, ax, axp = fig_base()
    draw_hexes(ax, vis)
    panel(
        axp,
        "Switzerland",
        "All sampled roofs",
        "2.9",
        "mean class",
        "34.5",
        "% class 4–5",
        "Class 4–5 roofs are 34.5% of this set — the same mix as the national sample.",
        "Hex 2.4 km  ·  100,000 roofs",
    )
    hold(fig, 12)

    fig, ax, axp = fig_base()
    draw_hexes(ax, vis, floor=4)
    panel(
        axp,
        "Switzerland",
        "Class floor 4",
        "2.9",
        "mean class",
        "34.5",
        "% class 4–5",
        "Cells below class 4 dim. Copper remains where mean suitability is high.",
        "Class floor  ·  4",
    )
    hold(fig, 10)

    fig, ax, axp = fig_base()
    draw_hexes(ax, vis, mode="pct4")
    panel(
        axp,
        "Switzerland",
        "Share of class 4–5",
        "2.9",
        "mean class",
        "34.5",
        "% class 4–5",
        "Colour is the share of excellent roofs, not the neighbourhood mean.",
        "Mode  ·  Class 4–5",
    )
    hold(fig, 10)

    sion = cities["vs"]
    vis_s = [h for h in vis if in_city(h["lat"], h["lon"], sion)]
    fig, ax, axp = fig_base()
    draw_hexes(ax, vis_s)
    panel(
        axp,
        "City",
        "Sion",
        "3.7",
        "mean class",
        "58.6",
        "% class 4–5",
        "Sion is 24 points ahead of the Swiss sample on class 4–5 roofs.",
        "City chip  ·  Valais",
    )
    hold(fig, 12)

    fig, ax, axp = fig_base()
    draw_roofs(ax, ROOFS["rows"], cities["zh"])
    panel(
        axp,
        "City",
        "Zürich",
        "2.7",
        "mean class",
        "26.6",
        "% class 4–5",
        "Each mark is one sampled Sonnendach MultiPoint — cadastre precision.",
        "Each roof  ·  7,851 points",
    )
    hold(fig, 14)

    fig, ax, axp = fig_base()
    draw_hexes(ax, vis)
    panel(
        axp,
        "Schweiz",
        "Alle beprobten Dächer",
        "2,9",
        "mittlere Klasse",
        "34,5",
        "% Klasse 4–5",
        "Sprache: Deutsch. Dieselbe Karte, gleicher Kataster.",
        "EN  DE  FR  IT",
    )
    hold(fig, 10)

    hold(scene_end(), 10)

    gif = OUT / "explorer_demo.gif"
    mp4 = OUT / "explorer_demo.mp4"
    imageio.mimsave(gif, frames, fps=4, loop=0)
    print("wrote", gif, gif.stat().st_size)
    imageio.mimsave(mp4, frames, fps=4, codec="libx264", quality=7)
    print("wrote", mp4, mp4.stat().st_size)


if __name__ == "__main__":
    main()
