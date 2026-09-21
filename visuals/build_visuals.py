#!/usr/bin/env python3
"""Build portfolio/class visuals from the inspected Sonnendach FileGDB.

Every plotted point is a real roof from SOLKAT_CH_DACH.
"""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

import numpy as np
import pyogrio
import pyogrio.raw as raw
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
VSI = (
    "/vsizip/"
    + str(ROOT / "data/raw/solarenergie-eignung-daecher_2056_generalized.gdb.zip")
    + "/SOLKAT_DACH_generalisiert.gdb"
)
LAYER = "SOLKAT_CH_DACH"
OUT = ROOT / "visuals"
OUT.mkdir(exist_ok=True)

# Solar-cadastre sequential palette (low → excellent)
KLASSE_COLORS = {
    1: "#6B7C93",
    2: "#C4B056",
    3: "#E09B2D",
    4: "#E26A21",
    5: "#C81E1E",
}
KLASSE_LABELS = {
    1: "gering  ·  low",
    2: "mittel  ·  medium",
    3: "gut  ·  good",
    4: "sehr gut  ·  very good",
    5: "hervorragend  ·  excellent",
}
PAPER = "#F6F3EE"
INK = "#1C1C1C"
MUTED = "#6A645C"

CITIES = [
    # name, subtitle, lon, lat, radius_m
    ("Zürich", "Zürich, Switzerland", 8.5417, 47.3769, 2200),
    ("Genève", "Geneva, Switzerland", 6.1432, 46.2044, 2200),
    ("Bern", "Bern, Switzerland", 7.4474, 46.9480, 2200),
    ("Basel", "Basel, Switzerland", 7.5886, 47.5596, 2200),
    ("Lausanne", "Lausanne, Switzerland", 6.6323, 46.5197, 2200),
    ("Lugano", "Ticino, Switzerland", 8.9511, 46.0101, 2200),
    ("Luzern", "Lucerne, Switzerland", 8.3093, 47.0502, 2000),
    ("Sion", "Valais, Switzerland", 7.3606, 46.2331, 2200),
]


def unpack_read(out):
    if len(out) == 4:
        meta, _fids, geometry, arrays = out
        return meta, geometry, arrays
    meta, geometry, arrays = out
    return meta, geometry, arrays


def parse_wkb_xy(wkb: bytes):
    endian = wkb[0]
    fmt_d = "<d" if endian == 1 else ">d"
    gtype = int.from_bytes(wkb[1:5], "little" if endian == 1 else "big")
    base = gtype & 0xFF
    if base == 4:
        return struct.unpack_from(fmt_d, wkb, 14)[0], struct.unpack_from(fmt_d, wkb, 22)[0]
    if base == 1:
        return struct.unpack_from(fmt_d, wkb, 5)[0], struct.unpack_from(fmt_d, wkb, 13)[0]
    raise ValueError(gtype)


def arrays_to_points(meta, geometry, arrays):
    names = list(meta["fields"])
    k = np.asarray(arrays[names.index("KLASSE")]).astype(np.int16)
    n = len(k)
    e = np.empty(n, dtype=np.float64)
    nn = np.empty(n, dtype=np.float64)
    for i, g in enumerate(geometry):
        x, y = parse_wkb_xy(g)
        e[i] = x
        nn[i] = y
    extra = {}
    for col in ("FLAECHE", "NEIGUNG", "AUSRICHTUNG"):
        if col in names:
            extra[col] = np.asarray(arrays[names.index(col)])
    return {"e": e, "n": nn, "klasse": k, **extra}


def load_city(east, north, radius, max_features=None):
    pad = radius * 1.05
    bbox = (east - pad, north - pad, east + pad, north + pad)
    meta, geometry, arrays = unpack_read(
        raw.read(
            VSI,
            layer=LAYER,
            bbox=bbox,
            max_features=max_features,
            read_geometry=True,
            columns=["KLASSE", "FLAECHE", "NEIGUNG", "AUSRICHTUNG"],
        )
    )
    pts = arrays_to_points(meta, geometry, arrays)
    d2 = (pts["e"] - east) ** 2 + (pts["n"] - north) ** 2
    mask = d2 <= radius**2
    out = {k: v[mask] for k, v in pts.items()}
    print(f"    bbox hits={len(pts['e']):,}  in-circle={len(out['e']):,}")
    return out


def load_national_sample(n_points=90000, seed=42):
    info = pyogrio.read_info(VSI, layer=LAYER)
    n = int(info["features"])
    rng = np.random.default_rng(seed)
    fids = np.sort(rng.choice(np.arange(1, n + 1), size=n_points, replace=False))
    print(f"  national random sample {n_points:,} of {n:,} (seed={seed})")
    # Read in FID chunks to keep memory/time reasonable
    chunks = []
    step = 15000
    for i in range(0, len(fids), step):
        batch = fids[i : i + step].tolist()
        meta, geometry, arrays = unpack_read(
            raw.read(
                VSI,
                layer=LAYER,
                fids=batch,
                read_geometry=True,
                columns=["KLASSE"],
            )
        )
        chunks.append(arrays_to_points(meta, geometry, arrays))
        print(f"    fids {i:,}–{i+len(batch):,}")
    return {
        "e": np.concatenate([c["e"] for c in chunks]),
        "n": np.concatenate([c["n"] for c in chunks]),
        "klasse": np.concatenate([c["klasse"] for c in chunks]),
        "n_population": n,
    }


def scatter_city(ax, pts, east, north, radius, s=1.8, alpha=0.82):
    from matplotlib.patches import Circle

    ax.set_facecolor(PAPER)
    ax.set_aspect("equal")
    ax.axis("off")
    ax.set_xlim(east - radius * 1.02, east + radius * 1.02)
    ax.set_ylim(north - radius * 1.02, north + radius * 1.02)
    ring = Circle(
        (east, north),
        radius,
        facecolor="none",
        edgecolor="#D9D3C8",
        lw=0.7,
        zorder=10,
    )
    clip = Circle((east, north), radius, transform=ax.transData)
    ax.add_patch(ring)
    ax.add_patch(
        Circle((east, north), radius, facecolor=PAPER, edgecolor="none", zorder=0)
    )
    order = np.argsort(pts["klasse"])
    for k in (1, 2, 3, 4, 5):
        m = pts["klasse"][order] == k
        if not np.any(m):
            continue
        sc = ax.scatter(
            pts["e"][order][m],
            pts["n"][order][m],
            s=s,
            c=KLASSE_COLORS[k],
            alpha=alpha,
            linewidths=0,
            rasterized=True,
            zorder=k,
        )
        sc.set_clip_path(clip)


def add_legend(fig, y=0.06):
    handles = []
    labels = []
    import matplotlib.pyplot as plt
    from matplotlib.lines import Line2D

    for k in range(1, 6):
        handles.append(
            Line2D(
                [0],
                [0],
                marker="o",
                color="none",
                markerfacecolor=KLASSE_COLORS[k],
                markersize=8,
                label=f"{k}  {KLASSE_LABELS[k]}",
            )
        )
        labels.append(f"{k}  {KLASSE_LABELS[k]}")
    fig.legend(
        handles,
        labels,
        loc="lower center",
        ncol=5,
        frameon=False,
        fontsize=8.5,
        bbox_to_anchor=(0.5, y),
        handletextpad=0.4,
        columnspacing=1.4,
    )


def render_city_grid(cities_data, path: Path):
    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(2, 4, figsize=(16, 9.2), dpi=180)
    fig.patch.set_facecolor(PAPER)
    fig.suptitle(
        "GeoSolar AI  ·  Swiss rooftop solar suitability",
        fontsize=16,
        fontweight="medium",
        color=INK,
        y=0.975,
        fontfamily="sans-serif",
    )
    fig.text(
        0.5,
        0.942,
        "Each dot is a real roof surface from Sonnendach.ch  ·  colour = official BFE class (KLASSE)",
        ha="center",
        fontsize=9,
        color=MUTED,
    )
    for ax, rec in zip(axes.ravel(), cities_data):
        scatter_city(ax, rec["pts"], rec["east"], rec["north"], rec["radius"], s=2.2)
        ax.set_title("")
        ax.text(
            0.5,
            1.03,
            rec["name"],
            transform=ax.transAxes,
            ha="center",
            va="bottom",
            fontsize=11,
            color=INK,
            fontweight="medium",
        )
        ax.text(
            0.5,
            1.005,
            rec["subtitle"],
            transform=ax.transAxes,
            ha="center",
            va="bottom",
            fontsize=7.5,
            color=MUTED,
        )
        ax.text(
            0.5,
            -0.02,
            f"{len(rec['pts']['e']):,} roofs in {rec['radius']/1000:.1f} km",
            transform=ax.transAxes,
            ha="center",
            va="top",
            fontsize=7,
            color=MUTED,
        )
    add_legend(fig, y=0.012)
    fig.text(
        0.5,
        0.008,
        "Source: BFE / swisstopo / MeteoSwiss  ·  Eignung von Hausdächern  ·  10,071,755 roofs nationwide  ·  EPSG:2056",
        ha="center",
        fontsize=7,
        color=MUTED,
    )
    fig.subplots_adjust(left=0.02, right=0.98, top=0.88, bottom=0.11, wspace=0.04, hspace=0.28)
    fig.savefig(path, dpi=180, facecolor=fig.get_facecolor())
    fig.savefig(path.with_suffix(".png"), dpi=180, facecolor=fig.get_facecolor())
    plt.close(fig)
    print("wrote", path)


def render_switzerland(national, path: Path):
    import matplotlib.pyplot as plt

    fig, ax = plt.subplots(figsize=(16, 10.5), dpi=180)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    ax.set_aspect("equal")
    ax.axis("off")
    order = np.argsort(national["klasse"])
    for k in (1, 2, 3, 4, 5):
        m = national["klasse"][order] == k
        ax.scatter(
            national["e"][order][m],
            national["n"][order][m],
            s=0.55,
            c=KLASSE_COLORS[k],
            alpha=0.75,
            linewidths=0,
            rasterized=True,
            zorder=k,
        )
    fig.suptitle(
        "Switzerland drawn by its roofs",
        fontsize=18,
        color=INK,
        y=0.97,
        fontweight="medium",
    )
    fig.text(
        0.5,
        0.935,
        f"Random sample of {len(national['e']):,} roof surfaces  ·  seed=42  ·  from {national['n_population']:,} roofs",
        ha="center",
        fontsize=9,
        color=MUTED,
        transform=fig.transFigure,
    )
    add_legend(fig, y=0.03)
    fig.text(
        0.5,
        0.012,
        "GeoSolar AI  ·  BFE Sonnendach.ch  ·  points in EPSG:2056 (Swiss LV95)  ·  no basemap added",
        ha="center",
        fontsize=7.5,
        color=MUTED,
    )
    fig.subplots_adjust(left=0.03, right=0.97, top=0.88, bottom=0.09)
    fig.savefig(path, dpi=180, facecolor=fig.get_facecolor())
    plt.close(fig)
    print("wrote", path)


def render_aspect_plot(cities_data, path: Path):
    """Aspect vs slope, coloured by class — shows why south-facing roofs rank higher."""
    import matplotlib.pyplot as plt

    fig, axes = plt.subplots(2, 4, figsize=(16, 8.4), dpi=160)
    fig.patch.set_facecolor(PAPER)
    fig.suptitle(
        "Slope vs aspect  ·  0° = south  ·  colour = suitability class",
        fontsize=15,
        color=INK,
        y=0.98,
    )
    fig.text(
        0.5,
        0.935,
        "Same roofs as the city maps. High classes concentrate near south (0°) and moderate pitch.",
        ha="center",
        fontsize=9,
        color=MUTED,
    )
    for ax, rec in zip(axes.ravel(), cities_data):
        ax.set_facecolor(PAPER)
        pts = rec["pts"]
        order = np.argsort(pts["klasse"])
        ax.scatter(
            pts["AUSRICHTUNG"][order],
            pts["NEIGUNG"][order],
            s=2.5,
            c=[KLASSE_COLORS[int(k)] for k in pts["klasse"][order]],
            alpha=0.35,
            linewidths=0,
            rasterized=True,
        )
        ax.set_xlim(-180, 180)
        ax.set_ylim(0, 90)
        ax.set_title(rec["name"], fontsize=11, color=INK, pad=6)
        ax.set_xticks([-180, -90, 0, 90, 180])
        ax.set_xticklabels(["N", "E", "S", "W", "N"], fontsize=8, color=MUTED)
        ax.tick_params(colors=MUTED, labelsize=8)
        ax.spines["top"].set_visible(False)
        ax.spines["right"].set_visible(False)
        ax.spines["left"].set_color("#D0CBC3")
        ax.spines["bottom"].set_color("#D0CBC3")
        ax.axvline(0, color="#D0CBC3", lw=0.6, ls="--")
    axes[0, 0].set_ylabel("Slope (°)", color=MUTED, fontsize=9)
    axes[1, 0].set_ylabel("Slope (°)", color=MUTED, fontsize=9)
    add_legend(fig, y=0.02)
    fig.subplots_adjust(left=0.05, right=0.98, top=0.86, bottom=0.12, wspace=0.22, hspace=0.38)
    fig.savefig(path, dpi=160, facecolor=fig.get_facecolor())
    plt.close(fig)
    print("wrote", path)


def render_class_bars(path: Path):
    import matplotlib.pyplot as plt

    counts = {
        1: 1540592,
        2: 2132008,
        3: 2921319,
        4: 2625455,
        5: 852381,
    }
    total = 10071755
    fig, ax = plt.subplots(figsize=(12, 5.2), dpi=160)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    xs = np.arange(1, 6)
    vals = [counts[k] / 1e6 for k in xs]
    ax.bar(xs, vals, color=[KLASSE_COLORS[k] for k in xs], width=0.62, linewidth=0)
    ax.axhline(2.921319, color=MUTED, ls="--", lw=0.8, alpha=0.7)
    ax.text(5.35, 2.95, "majority class 3 = 29.005%", color=MUTED, fontsize=8, va="bottom")
    for k, v, c in zip(xs, vals, [counts[k] for k in xs]):
        ax.text(k, v + 0.05, f"{c/total*100:.1f}%", ha="center", fontsize=9, color=INK)
    ax.set_xticks(xs)
    ax.set_xticklabels([f"{k}\n{KLASSE_LABELS[k].split('·')[0].strip()}" for k in xs], fontsize=9)
    ax.set_ylabel("Roofs (millions)")
    ax.set_title("10,071,755 Swiss roofs  ·  official suitability class", color=INK, fontsize=13, pad=10)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#D0CBC3")
    ax.spines["bottom"].set_color("#D0CBC3")
    ax.tick_params(colors=MUTED)
    ax.set_ylim(0, 3.4)
    fig.tight_layout()
    fig.savefig(path, dpi=160, facecolor=fig.get_facecolor())
    plt.close(fig)
    print("wrote", path)


def _downsample_city(pts, max_n=18000, seed=42):
    n = len(pts["e"])
    if n <= max_n:
        return pts
    rng = np.random.default_rng(seed)
    sl = rng.choice(n, size=max_n, replace=False)
    return {k: v[sl] for k, v in pts.items()}


def _fig_to_rgb(fig):
    fig.canvas.draw()
    buf = np.asarray(fig.canvas.buffer_rgba())
    return buf[:, :, :3].copy()


def animate_cities(cities_data, mp4_path: Path, gif_path: Path):
    import imageio.v2 as imageio
    import matplotlib.pyplot as plt

    # Reveal one extra class per beat, then hold the full map.
    sequence = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5, 5]
    frames = []
    plot_data = []
    for rec in cities_data:
        plot_data.append({**rec, "pts": _downsample_city(rec["pts"], 18000)})

    for k_max in sequence:
        fig, axes = plt.subplots(2, 4, figsize=(16, 9.2), dpi=120)
        fig.patch.set_facecolor(PAPER)
        fig.suptitle(
            "GeoSolar AI  ·  Swiss rooftop solar suitability",
            fontsize=16,
            color=INK,
            y=0.975,
        )
        fig.text(
            0.5,
            0.942,
            f"Showing classes 1–{k_max}  ·  {KLASSE_LABELS[k_max]}",
            ha="center",
            fontsize=9,
            color=MUTED,
        )
        for ax, rec in zip(axes.ravel(), plot_data):
            pts = rec["pts"]
            keep = pts["klasse"] <= k_max
            shown = {k: v[keep] for k, v in pts.items()}
            scatter_city(ax, shown, rec["east"], rec["north"], rec["radius"], s=1.6)
            ax.text(
                0.5,
                1.03,
                rec["name"],
                transform=ax.transAxes,
                ha="center",
                va="bottom",
                fontsize=11,
                color=INK,
            )
            ax.text(
                0.5,
                1.005,
                rec["subtitle"],
                transform=ax.transAxes,
                ha="center",
                va="bottom",
                fontsize=7.5,
                color=MUTED,
            )
        add_legend(fig, y=0.012)
        fig.subplots_adjust(
            left=0.02, right=0.98, top=0.88, bottom=0.11, wspace=0.04, hspace=0.28
        )
        frames.append(_fig_to_rgb(fig))
        plt.close(fig)
        print(f"  city frame class≤{k_max}")

    print("writing city GIF/MP4…")
    imageio.mimsave(gif_path, frames, fps=2, loop=0)
    print("wrote", gif_path, gif_path.stat().st_size)
    imageio.mimsave(mp4_path, frames, fps=2, codec="libx264", quality=7)
    print("wrote", mp4_path, mp4_path.stat().st_size)


def animate_switzerland(national, mp4_path: Path, gif_path: Path):
    import imageio.v2 as imageio
    import matplotlib.pyplot as plt

    sequence = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 5, 5]
    frames = []
    xlim = (national["e"].min() - 8000, national["e"].max() + 8000)
    ylim = (national["n"].min() - 8000, national["n"].max() + 8000)
    for k_max in sequence:
        fig, ax = plt.subplots(figsize=(12.8, 8.4), dpi=120)
        fig.patch.set_facecolor(PAPER)
        ax.set_facecolor(PAPER)
        ax.set_aspect("equal")
        ax.axis("off")
        fig.suptitle("Switzerland drawn by its roofs", fontsize=16, color=INK, y=0.96)
        fig.text(
            0.5,
            0.915,
            f"Classes 1–{k_max}  ·  {KLASSE_LABELS[k_max]}",
            ha="center",
            fontsize=9,
            color=MUTED,
        )
        keep = national["klasse"] <= k_max
        order = np.argsort(national["klasse"][keep])
        for k in range(1, k_max + 1):
            m = national["klasse"][keep][order] == k
            ax.scatter(
                national["e"][keep][order][m],
                national["n"][keep][order][m],
                s=0.55,
                c=KLASSE_COLORS[k],
                alpha=0.75,
                linewidths=0,
                rasterized=True,
            )
        ax.set_xlim(*xlim)
        ax.set_ylim(*ylim)
        add_legend(fig, y=0.02)
        fig.subplots_adjust(left=0.03, right=0.97, top=0.88, bottom=0.10)
        frames.append(_fig_to_rgb(fig))
        plt.close(fig)
        print(f"  CH frame class≤{k_max}")
    imageio.mimsave(gif_path, frames, fps=2, loop=0)
    print("wrote", gif_path, gif_path.stat().st_size)
    imageio.mimsave(mp4_path, frames, fps=2, codec="libx264", quality=7)
    print("wrote", mp4_path, mp4_path.stat().st_size)


def city_stats(rec):
    k = rec["pts"]["klasse"]
    n = len(k)
    counts = {int(c): int((k == c).sum()) for c in range(1, 6)}
    return {
        "name": rec["name"],
        "subtitle": rec["subtitle"],
        "n_roofs": n,
        "radius_m": rec["radius"],
        "counts": counts,
        "pct_class5": 100.0 * counts[5] / n if n else 0,
        "pct_class4plus": 100.0 * (counts[4] + counts[5]) / n if n else 0,
        "mean_slope": float(np.mean(rec["pts"]["NEIGUNG"])) if n else None,
        "median_area": float(np.median(rec["pts"]["FLAECHE"])) if n else None,
    }


def main():
    tf = Transformer.from_crs(4326, 2056, always_xy=True)
    cities_data = []
    print("Loading city roofs…")
    for name, subtitle, lon, lat, radius in CITIES:
        east, north = tf.transform(lon, lat)
        print(f"  {name}  LV95=({east:.1f}, {north:.1f})")
        pts = load_city(east, north, radius)
        cities_data.append(
            {
                "name": name,
                "subtitle": subtitle,
                "east": east,
                "north": north,
                "radius": radius,
                "lon": lon,
                "lat": lat,
                "pts": pts,
            }
        )

    stats = {
        "national_n": 10071755,
        "majority_pct": 29.005,
        "cities": [city_stats(r) for r in cities_data],
        "source": "BFE Sonnendach.ch generalized FileGDB, inspected 2026-09-21",
    }
    (OUT / "visual_stats.json").write_text(json.dumps(stats, indent=2))
    print(json.dumps(stats, indent=2))

    render_city_grid(cities_data, OUT / "swiss_cities_roofs.png")
    render_aspect_plot(cities_data, OUT / "city_roof_aspect.png")
    render_class_bars(OUT / "klasse_balance.png")

    skip_national = "--skip-national" in sys.argv
    if skip_national:
        national = None
        print("Skipping national sample")
    else:
        print("Loading national sample…")
        national = load_national_sample(90000, seed=42)
        render_switzerland(national, OUT / "switzerland_by_roofs.png")

    animate_cities(
        cities_data,
        OUT / "swiss_cities_roofs.mp4",
        OUT / "swiss_cities_roofs.gif",
    )
    if national is not None:
        animate_switzerland(
            national,
            OUT / "switzerland_by_roofs.mp4",
            OUT / "switzerland_by_roofs.gif",
        )
    print("done")


if __name__ == "__main__":
    main()
