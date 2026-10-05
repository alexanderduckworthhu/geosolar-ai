#!/usr/bin/env python3
"""Canton / region map + animation from real Sonnendach roofs.

Boundaries: official swissBOUNDARIES3D 2026 (swisstopo), EPSG:2056.
Roof attributes: SOLKAT_CH_DACH sample, random_state=42.
"""

from __future__ import annotations

import json
import struct
import sys
from pathlib import Path

import numpy as np
import pyogrio
import pyogrio.raw as raw
from matplotlib.path import Path as MplPath
from pyproj import Transformer
from shapely import from_wkb

sys.path.insert(0, str(Path(__file__).resolve().parent))
from theme import COPPER, INK, IRRADIATION, KLASSE_COLORS, LINE, MUTED, PAPER

ROOT = Path(__file__).resolve().parents[1]
ROOF_VSI = (
    "/vsizip/"
    + str(ROOT / "data/raw/solarenergie-eignung-daecher_2056_generalized.gdb.zip")
    + "/SOLKAT_DACH_generalisiert.gdb"
)
BOUND_VSI = (
    "/vsizip/"
    + str(ROOT / "data/raw/swissboundaries3d_2026-01_2056_5728.gpkg.zip")
    + "/swissBOUNDARIES3D_1_5_LV95_LN02.gpkg"
)
OUT = ROOT / "visuals"
OUT.mkdir(exist_ok=True)

HIGHLIGHT = COPPER

# Official BFS canton number → ISO-style code
BFS_TO_CODE = {
    1: "ZH",
    2: "BE",
    3: "LU",
    4: "UR",
    5: "SZ",
    6: "OW",
    7: "NW",
    8: "GL",
    9: "ZG",
    10: "FR",
    11: "SO",
    12: "BS",
    13: "BL",
    14: "SH",
    15: "AR",
    16: "AI",
    17: "SG",
    18: "GR",
    19: "AG",
    20: "TG",
    21: "TI",
    22: "VD",
    23: "VS",
    24: "NE",
    25: "GE",
    26: "JU",
}

# Swiss greater regions (BFS / Eurostat NUTS-2 analogue)
REGION_OF = {
    "GE": "Lake Geneva",
    "VD": "Lake Geneva",
    "VS": "Lake Geneva",
    "BE": "Espace Mittelland",
    "FR": "Espace Mittelland",
    "SO": "Espace Mittelland",
    "NE": "Espace Mittelland",
    "JU": "Espace Mittelland",
    "BS": "Northwestern CH",
    "BL": "Northwestern CH",
    "AG": "Northwestern CH",
    "ZH": "Zurich",
    "SG": "Eastern Switzerland",
    "TG": "Eastern Switzerland",
    "SH": "Eastern Switzerland",
    "AR": "Eastern Switzerland",
    "AI": "Eastern Switzerland",
    "GL": "Eastern Switzerland",
    "GR": "Eastern Switzerland",
    "LU": "Central Switzerland",
    "UR": "Central Switzerland",
    "SZ": "Central Switzerland",
    "OW": "Central Switzerland",
    "NW": "Central Switzerland",
    "ZG": "Central Switzerland",
    "TI": "Ticino",
}

CITIES = [
    ("Basel", 7.5886, 47.5596),
    ("Zurich", 8.5417, 47.3769),
    ("St. Gallen", 9.3767, 47.4245),
    ("Bern", 7.4474, 46.9480),
    ("Luzern", 8.3093, 47.0502),
    ("Lausanne", 6.6323, 46.5197),
    ("Geneva", 6.1432, 46.2044),
    ("Sion", 7.3606, 46.2331),
    ("Lugano", 8.9511, 46.0101),
    ("Chur", 9.5297, 46.8508),
]


def count_k(rec, k):
    c = rec["counts"]
    return int(c.get(k, c.get(str(k), 0)))


def unpack_read(out):
    if len(out) == 4:
        return out[0], out[2], out[3]
    return out[0], out[1], out[2]


def parse_roof_xy(wkb: bytes):
    endian = wkb[0]
    fmt_d = "<d" if endian == 1 else ">d"
    gtype = int.from_bytes(wkb[1:5], "little" if endian == 1 else "big")
    base = gtype & 0xFF
    off = 14 if base == 4 else 5
    return struct.unpack_from(fmt_d, wkb, off)[0], struct.unpack_from(fmt_d, wkb, off + 8)[0]


def load_cantons():
    meta, geometry, arrays = unpack_read(
        raw.read(BOUND_VSI, layer="tlm_kantonsgebiet", read_geometry=True, force_2d=True)
    )
    names = list(meta["fields"])
    idx = {n: i for i, n in enumerate(names)}
    cantons = []
    for i in range(len(arrays[0])):
        bfs = int(arrays[idx["kantonsnummer"]][i])
        geom = from_wkb(geometry[i])
        if geom.has_z:
            geom = shapely_force2d(geom)
        cantons.append(
            {
                "bfs": bfs,
                "code": BFS_TO_CODE[bfs],
                "name": str(arrays[idx["name"]][i]),
                "geom": geom,
                "region": REGION_OF[BFS_TO_CODE[bfs]],
                "label_xy": (geom.representative_point().x, geom.representative_point().y),
            }
        )
    cantons.sort(key=lambda c: c["bfs"])
    return cantons


def shapely_force2d(geom):
    from shapely.ops import transform as shp_transform

    return shp_transform(lambda x, y, z=None: (x, y), geom)


def load_country_parts():
    meta, geometry, arrays = unpack_read(
        raw.read(BOUND_VSI, layer="tlm_landesgebiet", read_geometry=True, force_2d=True)
    )
    names = list(meta["fields"])
    idx = {n: i for i, n in enumerate(names)}
    out = {}
    for i in range(len(arrays[0])):
        icc = str(arrays[idx["icc"]][i])
        geom = from_wkb(geometry[i])
        if geom.has_z:
            geom = shapely_force2d(geom)
        out[icc] = {"name": str(arrays[idx["name"]][i]), "geom": geom}
    return out


def load_roof_sample(n_points=250_000, seed=42):
    info = pyogrio.read_info(ROOF_VSI, layer="SOLKAT_CH_DACH")
    n = int(info["features"])
    rng = np.random.default_rng(seed)
    fids = np.sort(rng.choice(np.arange(1, n + 1), size=n_points, replace=False))
    print(f"sampling {n_points:,} of {n:,} roofs")
    chunks = []
    step = 20000
    for i in range(0, len(fids), step):
        batch = fids[i : i + step].tolist()
        meta, geometry, arrays = unpack_read(
            raw.read(
                ROOF_VSI,
                layer="SOLKAT_CH_DACH",
                fids=batch,
                read_geometry=True,
                columns=["KLASSE", "MSTRAHLUNG", "FLAECHE", "NEIGUNG", "AUSRICHTUNG"],
            )
        )
        names = list(meta["fields"])
        e = np.empty(len(geometry), dtype=np.float64)
        nn = np.empty(len(geometry), dtype=np.float64)
        for j, g in enumerate(geometry):
            e[j], nn[j] = parse_roof_xy(g)
        chunks.append(
            {
                "e": e,
                "n": nn,
                "klasse": np.asarray(arrays[names.index("KLASSE")]).astype(np.int16),
                "mstrahlung": np.asarray(arrays[names.index("MSTRAHLUNG")]).astype(np.int32),
                "flaeche": np.asarray(arrays[names.index("FLAECHE")], dtype=np.float64),
                "neigung": np.asarray(arrays[names.index("NEIGUNG")]).astype(np.int16),
            }
        )
        print(f"  {i+len(batch):,}/{n_points:,}")
    return {k: np.concatenate([c[k] for c in chunks]) for k in chunks[0]}


def assign_cantons(xy, cantons):
    """Vectorized point-in-polygon via matplotlib Path (exterior minus holes)."""
    n = len(xy)
    owner = np.full(n, -1, dtype=np.int16)
    for ci, c in enumerate(cantons):
        geom = c["geom"]
        polys = list(geom.geoms) if geom.geom_type == "MultiPolygon" else [geom]
        mask = np.zeros(n, dtype=bool)
        for poly in polys:
            mask |= MplPath(np.asarray(poly.exterior.coords)).contains_points(xy)
            for hole in poly.interiors:
                mask &= ~MplPath(np.asarray(hole.coords)).contains_points(xy)
        unclaimed = owner < 0
        owner[unclaimed & mask] = ci
        print(f"  {c['code']:3} {c['name']:28} {(unclaimed & mask).sum():,}")
    return owner


def aggregate(roofs, owner, cantons):
    stats = []
    for i, c in enumerate(cantons):
        m = owner == i
        k = roofs["klasse"][m]
        n = int(m.sum())
        counts = {cls: int((k == cls).sum()) for cls in range(1, 6)}
        rec = {
            **{k: c[k] for k in ("bfs", "code", "name", "region")},
            "n_roofs_sample": n,
            "counts": counts,
            "mean_mstrahlung": float(np.mean(roofs["mstrahlung"][m])) if n else None,
            "median_mstrahlung": float(np.median(roofs["mstrahlung"][m])) if n else None,
            "pct_class4plus": 100.0 * (counts[4] + counts[5]) / n if n else 0.0,
            "pct_class5": 100.0 * counts[5] / n if n else 0.0,
            "mean_slope": float(np.mean(roofs["neigung"][m])) if n else None,
            "median_area": float(np.median(roofs["flaeche"][m])) if n else None,
        }
        stats.append(rec)
    return stats


def irradiation_cmap():
    from matplotlib.colors import LinearSegmentedColormap

    return LinearSegmentedColormap.from_list("pv", IRRADIATION)


def color_for(values, vmin, vmax):
    cmap = irradiation_cmap()
    t = np.clip((np.asarray(values, dtype=float) - vmin) / (vmax - vmin), 0, 1)
    return [cmap(x) for x in t]


def add_geom(ax, geom, **kwargs):
    from matplotlib.patches import PathPatch
    from matplotlib.path import Path as P

    polys = list(geom.geoms) if geom.geom_type == "MultiPolygon" else [geom]
    for poly in polys:
        verts = []
        codes = []
        rings = [poly.exterior, *poly.interiors]
        for ring in rings:
            coords = np.asarray(ring.coords)
            verts.append(coords)
            codes.append([P.MOVETO] + [P.LINETO] * (len(coords) - 2) + [P.CLOSEPOLY])
        path = P(np.vstack(verts), np.concatenate(codes))
        ax.add_patch(PathPatch(path, **kwargs))


def draw_base(ax, countries, cantons, colors, highlight=None, dim_others=False):
    ax.set_facecolor(PAPER)
    ax.set_aspect("equal")
    ax.axis("off")
    for icc, rec in countries.items():
        if icc == "CH":
            continue
        add_geom(ax, rec["geom"], facecolor="#15211c", edgecolor="#24332c", lw=0.3, zorder=0)
    for i, c in enumerate(cantons):
        is_hi = highlight is not None and i == highlight
        fc = colors[i]
        if dim_others and highlight is not None and not is_hi:
            fc = tuple(list(fc[:3]) + [0.35]) if not isinstance(fc, str) else fc
        add_geom(
            ax,
            c["geom"],
            facecolor=fc,
            edgecolor=HIGHLIGHT if is_hi else "#5a6e62",
            lw=1.8 if is_hi else 0.35,
            zorder=3 if is_hi else 1,
        )
    # country outline
    add_geom(
        ax,
        countries["CH"]["geom"],
        facecolor="none",
        edgecolor=INK,
        lw=0.9,
        zorder=4,
    )


def add_city_labels(ax, tf):
    for name, lon, lat in CITIES:
        x, y = tf.transform(lon, lat)
        ax.plot(x, y, "o", ms=2.4, color=INK, zorder=6)
        ax.text(
            x + 3500,
            y + 2500,
            name,
            fontsize=6.5,
            color=INK,
            zorder=6,
            fontweight="medium",
        )


def render_choropleth(cantons, countries, stats, values, vmin, vmax, title, subtitle, cbar_label, path, tf):
    import matplotlib.pyplot as plt
    from matplotlib.cm import ScalarMappable
    from matplotlib.colors import Normalize

    fig, ax = plt.subplots(figsize=(13.2, 9.4), dpi=170)
    fig.patch.set_facecolor(PAPER)
    colors = color_for(values, vmin, vmax)
    draw_base(ax, countries, cantons, colors)
    add_city_labels(ax, tf)
    for i, c in enumerate(cantons):
        if c["code"] in {"BS", "BL", "AI", "AR", "NW", "OW", "ZG", "GL", "SH"}:
            continue  # too small / crowded; codes in legend table instead
        ax.text(
            c["label_xy"][0],
            c["label_xy"][1],
            c["code"],
            ha="center",
            va="center",
            fontsize=6,
            color=INK,
            alpha=0.85,
            zorder=5,
        )
    sm = ScalarMappable(norm=Normalize(vmin, vmax), cmap=irradiation_cmap())
    sm.set_array([])
    cbar = fig.colorbar(sm, ax=ax, fraction=0.035, pad=0.02, shrink=0.72)
    cbar.set_label(cbar_label, color=MUTED, fontsize=8)
    cbar.ax.tick_params(labelsize=7, colors=MUTED)
    fig.text(0.03, 0.96, "SOLAR RESOURCE MAP", fontsize=8, color=COPPER, fontweight="medium")
    fig.text(0.03, 0.925, title, fontsize=18, color=INK, fontweight="medium")
    fig.text(0.03, 0.895, subtitle, fontsize=9, color=MUTED)
    fig.text(
        0.03,
        0.03,
        "Source: BFE Sonnendach.ch roofs spatially joined to swisstopo swissBOUNDARIES3D 2026  ·  sample of 250,000 roofs, seed=42  ·  EPSG:2056",
        fontsize=7,
        color=MUTED,
    )
    ax.set_xlim(2_480_000, 2_845_000)
    ax.set_ylim(1_070_000, 1_305_000)
    fig.tight_layout(rect=(0, 0.04, 1, 0.88))
    fig.savefig(path, dpi=170, facecolor=fig.get_facecolor())
    plt.close(fig)
    print("wrote", path)


def _fig_to_rgb(fig):
    fig.canvas.draw()
    return np.asarray(fig.canvas.buffer_rgba())[:, :, :3].copy()


def render_tour(cantons, countries, stats, roofs, owner, tf, gif_path, mp4_path):
    import matplotlib.pyplot as plt
    import imageio.v2 as imageio
    from matplotlib.gridspec import GridSpec

    values = [s["mean_mstrahlung"] for s in stats]
    vmin, vmax = float(np.min(values)), float(np.max(values))
    colors = color_for(values, vmin, vmax)
    order = list(np.argsort([-s["mean_mstrahlung"] for s in stats]))  # sunniest first

    frames = []

    def panel(fig, highlight):
        gs = GridSpec(1, 2, width_ratios=[1.55, 1.0], wspace=0.08, figure=fig)
        ax = fig.add_subplot(gs[0, 0])
        axp = fig.add_subplot(gs[0, 1])
        axp.set_facecolor(PAPER)
        for sp in axp.spines.values():
            sp.set_visible(False)
        axp.set_xticks([])
        axp.set_yticks([])
        draw_base(ax, countries, cantons, colors, highlight=highlight, dim_others=highlight is not None)
        add_city_labels(ax, tf)
        ax.set_xlim(2_480_000, 2_845_000)
        ax.set_ylim(1_070_000, 1_305_000)
        return ax, axp

    # intro
    for _ in range(3):
        fig = plt.figure(figsize=(16, 9), dpi=110)
        fig.patch.set_facecolor(PAPER)
        ax, axp = panel(fig, None)
        fig.text(0.03, 0.95, "SOLAR RESOURCE MAP  ·  SWITZERLAND", color=COPPER, fontsize=9)
        fig.text(0.03, 0.905, "Rooftop irradiation by canton", color=INK, fontsize=18)
        fig.text(
            0.03,
            0.87,
            "Mean MSTRAHLUNG (kWh/m²/year) on real Sonnendach.ch roofs",
            color=MUTED,
            fontsize=9,
        )
        axp.text(0.06, 0.78, "26 cantons", fontsize=16, color=INK, transform=axp.transAxes)
        axp.text(
            0.06,
            0.58,
            "Each canton is coloured by the mean\nannual irradiation hitting its roofs.\nNext: one canton at a time, sunniest first.",
            fontsize=10,
            color=MUTED,
            transform=axp.transAxes,
            linespacing=1.45,
        )
        axp.text(
            0.06,
            0.12,
            "BFE / swisstopo / MeteoSwiss",
            fontsize=8,
            color=MUTED,
            transform=axp.transAxes,
        )
        fig.subplots_adjust(left=0.02, right=0.98, top=0.84, bottom=0.05)
        frames.append(_fig_to_rgb(fig))
        plt.close(fig)

    for ci in order:
        s = stats[ci]
        fig = plt.figure(figsize=(16, 9), dpi=110)
        fig.patch.set_facecolor(PAPER)
        ax, axp = panel(fig, ci)
        fig.text(0.03, 0.95, "CANTON TOUR  ·  sunniest roofs first", color=COPPER, fontsize=9)
        fig.text(0.03, 0.905, f"{s['name']}   ({s['code']})", color=INK, fontsize=20)
        fig.text(0.03, 0.87, s["region"], color=MUTED, fontsize=10)

        axp.text(0.06, 0.90, "This canton’s roofs", fontsize=11, color=MUTED, transform=axp.transAxes)
        axp.text(
            0.06,
            0.80,
            f"{s['mean_mstrahlung']:.0f}",
            fontsize=28,
            color=INK,
            transform=axp.transAxes,
            fontweight="medium",
        )
        axp.text(
            0.06,
            0.72,
            "kWh/m²/year  mean irradiation",
            fontsize=9,
            color=MUTED,
            transform=axp.transAxes,
        )

        rows = [
            (f"{s['n_roofs_sample']:,}", "roofs in sample"),
            (f"{s['pct_class4plus']:.1f}%", "class 4–5  sehr gut + hervorragend"),
            (f"{s['pct_class5']:.1f}%", "class 5  hervorragend"),
            (f"{s['mean_slope']:.0f}°", "mean roof slope"),
            (f"{s['median_area']:.0f} m²", "median roof area"),
        ]
        y = 0.62
        for val, lab in rows:
            axp.text(0.06, y, val, fontsize=13, color=INK, transform=axp.transAxes)
            axp.text(0.40, y, lab, fontsize=9, color=MUTED, transform=axp.transAxes)
            y -= 0.07

        # class mix bar
        counts = [count_k(s, k) for k in range(1, 6)]
        tot = sum(counts) or 1
        x0 = 0.06
        axp.text(0.06, 0.22, "Class mix", fontsize=9, color=MUTED, transform=axp.transAxes)
        for k, ctn in enumerate(counts, start=1):
            w = 0.88 * ctn / tot
            axp.add_patch(
                plt.Rectangle(
                    (x0, 0.14),
                    w,
                    0.055,
                    transform=axp.transAxes,
                    color=KLASSE_COLORS[k],
                    clip_on=False,
                    linewidth=0,
                )
            )
            x0 += w
        axp.text(
            0.06,
            0.05,
            "1 gering   2 mittel   3 gut   4 sehr gut   5 hervorragend",
            fontsize=7.5,
            color=MUTED,
            transform=axp.transAxes,
        )
        fig.subplots_adjust(left=0.02, right=0.98, top=0.84, bottom=0.05)
        frames.append(_fig_to_rgb(fig))
        frames.append(_fig_to_rgb(fig))  # hold
        plt.close(fig)
        print(f"  frame {s['code']}")

    print("writing tour gif/mp4…")
    imageio.mimsave(gif_path, frames, fps=2, loop=0)
    print("wrote", gif_path, gif_path.stat().st_size)
    imageio.mimsave(mp4_path, frames, fps=2, codec="libx264", quality=7)
    print("wrote", mp4_path, mp4_path.stat().st_size)


def render_region_tour(cantons, countries, stats, tf, gif_path, mp4_path):
    """Seven greater regions — shorter loop for a country tour."""
    import matplotlib.pyplot as plt
    import imageio.v2 as imageio
    from matplotlib.gridspec import GridSpec
    from collections import defaultdict

    regions = []
    grouped = defaultdict(list)
    for i, s in enumerate(stats):
        grouped[s["region"]].append(i)
    # geographic-ish order
    order_names = [
        "Lake Geneva",
        "Ticino",
        "Espace Mittelland",
        "Northwestern CH",
        "Zurich",
        "Central Switzerland",
        "Eastern Switzerland",
    ]
    values = [s["mean_mstrahlung"] for s in stats]
    vmin, vmax = float(np.min(values)), float(np.max(values))
    colors = color_for(values, vmin, vmax)
    frames = []

    for rname in order_names:
        idxs = grouped[rname]
        n = sum(stats[i]["n_roofs_sample"] for i in idxs)
        mean_m = np.average(
            [stats[i]["mean_mstrahlung"] for i in idxs],
            weights=[stats[i]["n_roofs_sample"] for i in idxs],
        )
        c4 = np.average(
            [stats[i]["pct_class4plus"] for i in idxs],
            weights=[stats[i]["n_roofs_sample"] for i in idxs],
        )
        c5 = np.average(
            [stats[i]["pct_class5"] for i in idxs],
            weights=[stats[i]["n_roofs_sample"] for i in idxs],
        )
        mix = {k: sum(count_k(stats[i], k) for i in idxs) for k in range(1, 6)}
        names = ", ".join(stats[i]["code"] for i in idxs)

        fig = plt.figure(figsize=(16, 9), dpi=110)
        fig.patch.set_facecolor(PAPER)
        gs = GridSpec(1, 2, width_ratios=[1.55, 1.0], wspace=0.08, figure=fig)
        ax = fig.add_subplot(gs[0, 0])
        axp = fig.add_subplot(gs[0, 1])
        axp.set_facecolor(PAPER)
        for sp in axp.spines.values():
            sp.set_visible(False)
        axp.set_xticks([])
        axp.set_yticks([])
        hi = set(idxs)
        ax.set_facecolor(PAPER)
        ax.set_aspect("equal")
        ax.axis("off")
        for icc, rec in countries.items():
            if icc != "CH":
                add_geom(ax, rec["geom"], facecolor="#15211c", edgecolor="#24332c", lw=0.3, zorder=0)
        for i, c in enumerate(cantons):
            fc = colors[i]
            on = i in hi
            add_geom(
                ax,
                c["geom"],
                facecolor=fc if on else (*tuple(fc[:3]), 0.22),
                edgecolor=HIGHLIGHT if on else "#5a6e62",
                lw=1.4 if on else 0.3,
                zorder=3 if on else 1,
            )
        add_geom(ax, countries["CH"]["geom"], facecolor="none", edgecolor=INK, lw=0.9, zorder=4)
        add_city_labels(ax, tf)
        ax.set_xlim(2_480_000, 2_845_000)
        ax.set_ylim(1_070_000, 1_305_000)

        fig.text(0.03, 0.95, "GREATER REGIONS  ·  BFS / NUTS-2", color=COPPER, fontsize=9)
        fig.text(0.03, 0.905, rname, color=INK, fontsize=20)
        fig.text(0.03, 0.87, names, color=MUTED, fontsize=10)

        axp.text(0.06, 0.82, f"{mean_m:.0f}", fontsize=32, color=INK, transform=axp.transAxes)
        axp.text(0.06, 0.73, "kWh/m²/year  mean roof irradiation", fontsize=9, color=MUTED, transform=axp.transAxes)
        axp.text(0.06, 0.58, f"{n:,}", fontsize=18, color=INK, transform=axp.transAxes)
        axp.text(0.40, 0.58, "roofs in sample", fontsize=9, color=MUTED, transform=axp.transAxes)
        axp.text(0.06, 0.48, f"{c4:.1f}%", fontsize=18, color=INK, transform=axp.transAxes)
        axp.text(0.40, 0.48, "class 4–5", fontsize=9, color=MUTED, transform=axp.transAxes)
        axp.text(0.06, 0.38, f"{c5:.1f}%", fontsize=18, color=INK, transform=axp.transAxes)
        axp.text(0.40, 0.38, "class 5 hervorragend", fontsize=9, color=MUTED, transform=axp.transAxes)

        tot = sum(mix.values()) or 1
        x0 = 0.06
        axp.text(0.06, 0.24, "Class mix", fontsize=9, color=MUTED, transform=axp.transAxes)
        for k in range(1, 6):
            w = 0.88 * mix[k] / tot
            axp.add_patch(
                plt.Rectangle((x0, 0.16), w, 0.055, transform=axp.transAxes, color=KLASSE_COLORS[k], linewidth=0)
            )
            x0 += w
        fig.subplots_adjust(left=0.02, right=0.98, top=0.84, bottom=0.05)
        rgb = _fig_to_rgb(fig)
        frames.append(rgb)
        frames.append(rgb)
        frames.append(rgb)
        plt.close(fig)
        print("  region", rname)

    imageio.mimsave(gif_path, frames, fps=2, loop=0)
    print("wrote", gif_path, gif_path.stat().st_size)
    imageio.mimsave(mp4_path, frames, fps=2, codec="libx264", quality=7)
    print("wrote", mp4_path, mp4_path.stat().st_size)


def main():
    tf = Transformer.from_crs(4326, 2056, always_xy=True)
    print("Loading cantons…")
    cantons = load_cantons()
    countries = load_country_parts()
    cache = OUT / "canton_stats.json"
    if "--from-cache" in sys.argv and cache.exists():
        payload = json.loads(cache.read_text())
        stats = payload["cantons"]
        roofs = None
        owner = None
        print("using cached canton_stats.json")
    else:
        roofs = load_roof_sample(250_000, seed=42)
        xy = np.column_stack([roofs["e"], roofs["n"]])
        print("Point-in-polygon…")
        owner = assign_cantons(xy, cantons)
        n_miss = int((owner < 0).sum())
        print(f"unassigned {n_miss:,} / {len(owner):,}")
        stats = aggregate(roofs, owner, cantons)
        payload = {
            "n_sample": int(len(owner)),
            "n_unassigned": n_miss,
            "seed": 42,
            "boundary": "swissBOUNDARIES3D 2026 tlm_kantonsgebiet",
            "cantons": [{k: v for k, v in s.items()} for s in stats],
        }
        cache.write_text(json.dumps(payload, indent=2))
        print(json.dumps(payload, indent=2)[:2500])

    mvals = [s["mean_mstrahlung"] for s in stats]
    pvals = [s["pct_class4plus"] for s in stats]
    render_choropleth(
        cantons,
        countries,
        stats,
        mvals,
        min(mvals),
        max(mvals),
        "PHOTOVOLTAIC POTENTIAL ON ROOFS",
        "SWITZERLAND  ·  mean annual irradiation on Sonnendach.ch roof surfaces",
        "kWh/m²/year  (MSTRAHLUNG)",
        OUT / "canton_irradiation.png",
        tf,
    )
    render_choropleth(
        cantons,
        countries,
        stats,
        pvals,
        min(pvals),
        max(pvals),
        "SHARE OF HIGH-SUITABILITY ROOFS",
        "SWITZERLAND  ·  % of roofs in official class 4 (sehr gut) or 5 (hervorragend)",
        "% class 4 + 5",
        OUT / "canton_class4plus.png",
        tf,
    )
    render_tour(
        cantons,
        countries,
        stats,
        roofs,
        owner,
        tf,
        OUT / "canton_tour.gif",
        OUT / "canton_tour.mp4",
    )
    render_region_tour(
        cantons,
        countries,
        stats,
        tf,
        OUT / "region_tour.gif",
        OUT / "region_tour.mp4",
    )


if __name__ == "__main__":
    main()
