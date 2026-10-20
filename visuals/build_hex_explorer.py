#!/usr/bin/env python3
"""Bin Sonnendach roofs into projected hexagons for the static explorer.

Hex neighbourhoods are counted from the full 10,071,755-roof cadastre when
the official FileGDB zip is present. Each-roof JSON stays the 100k sample.
Hex polygons are clipped to swissBOUNDARIES3D (ICC=CH) so cells do not
draw across Austria, Liechtenstein, Germany, or France.
"""

from __future__ import annotations

import json
import math
import struct
import sys
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
import pyogrio
import pyogrio.raw as raw
from pyproj import Transformer
from shapely import from_wkb
from shapely.geometry import Polygon, mapping
from shapely.ops import transform as shp_transform
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "processed" / "roofs_sample.csv"
ZIP_PATH = ROOT / "data" / "raw" / "solarenergie-eignung-daecher_2056_generalized.gdb.zip"
VSI = f"/vsizip/{ZIP_PATH}/SOLKAT_DACH_generalisiert.gdb"
LAYER = "SOLKAT_CH_DACH"
BOUND_VSI = (
    "/vsizip/"
    + str(ROOT / "data/raw/swissboundaries3d_2026-01_2056_5728.gpkg.zip")
    + "/swissBOUNDARIES3D_1_5_LV95_LN02.gpkg"
)
OUT = ROOT / "frontend" / "data" / "hexes.json"
ROOFS_OUT = ROOT / "frontend" / "data" / "roofs.json"

SIZE_M = 2400.0
MIN_ROOFS = 3
CHUNK = 250_000

CITIES = [
    {"id": "ch", "name": "Switzerland", "lon": 8.23, "lat": 46.80, "radius_km": 175},
    {"id": "zh", "name": "Zürich", "lon": 8.5417, "lat": 47.3769, "bfs": 261},
    {"id": "ge", "name": "Genève", "lon": 6.1432, "lat": 46.2044, "bfs": 6621},
    {"id": "bs", "name": "Basel", "lon": 7.5886, "lat": 47.5596, "bfs": 2701},
    {"id": "ls", "name": "Lausanne", "lon": 6.6323, "lat": 46.5197, "bfs": 5586},
    {"id": "be", "name": "Bern", "lon": 7.4474, "lat": 46.9480, "bfs": 351},
    {"id": "wi", "name": "Winterthur", "lon": 8.7376, "lat": 47.4988, "bfs": 230},
    {"id": "lu", "name": "Luzern", "lon": 8.3093, "lat": 47.0502, "bfs": 1061},
    {"id": "sg", "name": "St. Gallen", "lon": 9.3762, "lat": 47.4245, "bfs": 3203},
    {"id": "ti", "name": "Lugano", "lon": 8.9511, "lat": 46.0101, "bfs": 5192},
    {"id": "bi", "name": "Biel/Bienne", "lon": 7.2467, "lat": 47.1368, "bfs": 371},
    {"id": "th", "name": "Thun", "lon": 7.6280, "lat": 46.7580, "bfs": 942},
    {"id": "fr", "name": "Fribourg", "lon": 7.1608, "lat": 46.8064, "bfs": 2196},
    {"id": "sh", "name": "Schaffhausen", "lon": 8.6349, "lat": 47.6960, "bfs": 2939},
    {"id": "gr", "name": "Chur", "lon": 9.5329, "lat": 46.8499, "bfs": 3901},
    {"id": "ne", "name": "Neuchâtel", "lon": 6.9310, "lat": 46.9929, "bfs": 6458},
    {"id": "vs", "name": "Sion", "lon": 7.3606, "lat": 46.2331, "bfs": 6266},
]


def axial_round(q: float, r: float) -> tuple[int, int]:
    s = -q - r
    q_i, r_i, s_i = round(q), round(r), round(s)
    dq, dr, ds = abs(q_i - q), abs(r_i - r), abs(s_i - s)
    if dq > dr and dq > ds:
        q_i = -r_i - s_i
    elif dr > ds:
        r_i = -q_i - s_i
    return int(q_i), int(r_i)


def to_axial(x: float, y: float) -> tuple[int, int]:
    q = (math.sqrt(3) / 3 * x - 1.0 / 3 * y) / SIZE_M
    r = (2.0 / 3 * y) / SIZE_M
    return axial_round(q, r)


def hex_center(q: int, r: int) -> tuple[float, float]:
    x = SIZE_M * (math.sqrt(3) * q + math.sqrt(3) / 2 * r)
    y = SIZE_M * (1.5 * r)
    return x, y


TO_LL = Transformer.from_crs(2056, 4326, always_xy=True)
TO_LV = Transformer.from_crs(4326, 2056, always_xy=True)


def unpack_read(out):
    if len(out) == 4:
        return out[0], out[2], out[3]
    return out[0], out[1], out[2]


def parse_wkb_xy(wkb: bytes) -> tuple[float, float]:
    endian = wkb[0]
    fmt_d = "<d" if endian == 1 else ">d"
    gtype = int.from_bytes(wkb[1:5], "little" if endian == 1 else "big")
    base = gtype & 0xFF
    if base == 4:
        return struct.unpack_from(fmt_d, wkb, 14)[0], struct.unpack_from(fmt_d, wkb, 22)[0]
    if base == 1:
        return struct.unpack_from(fmt_d, wkb, 5)[0], struct.unpack_from(fmt_d, wkb, 13)[0]
    raise ValueError(f"unsupported WKB type {gtype}")


def hex_poly_lv(q: int, r: int) -> Polygon:
    cx, cy = hex_center(q, r)
    ring = []
    for i in range(6):
        angle = math.radians(60 * i - 30)
        ring.append((cx + SIZE_M * math.cos(angle), cy + SIZE_M * math.sin(angle)))
    ring.append(ring[0])
    return Polygon(ring)


def ring_wgs(geom) -> list[list[float]] | None:
    if geom.is_empty:
        return None
    if geom.geom_type == "MultiPolygon":
        geom = max(geom.geoms, key=lambda g: g.area)
    if geom.geom_type != "Polygon" or geom.is_empty:
        return None
    geom = geom.simplify(40.0, preserve_topology=True)
    ll = shp_transform(TO_LL.transform, geom)
    coords = [[round(x, 5), round(y, 5)] for x, y in ll.exterior.coords]
    if len(coords) < 4:
        return None
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords


def _ll_ring(ring) -> list[list[float]]:
    coords = [[round(lon, 5), round(lat, 5)] for lon, lat in (TO_LL.transform(x, y) for x, y in ring.coords)]
    if coords[0] != coords[-1]:
        coords.append(coords[0])
    return coords


def city_records() -> list[dict]:
    """City buttons use the municipality outline, not a circle around downtown."""
    meta, geometry, arrays = unpack_read(
        raw.read(
            BOUND_VSI,
            layer="tlm_hoheitsgebiet",
            columns=["bfs_nummer", "icc"],
            read_geometry=True,
        )
    )
    names = list(meta["fields"])
    bfs = arrays[names.index("bfs_nummer")]
    icc = arrays[names.index("icc")]
    by_bfs = {}
    for i, num in enumerate(bfs):
        if str(icc[i]) != "CH":
            continue
        by_bfs[int(num)] = from_wkb(geometry[i])
    records = []
    for city in CITIES:
        if "bfs" not in city:
            records.append(city)
            continue
        geom = by_bfs[city["bfs"]]
        if geom.has_z:
            geom = shp_transform(lambda x, y, z=None: (x, y), geom)
        geom = geom.simplify(50.0, preserve_topology=True)
        parts_src = list(geom.geoms) if geom.geom_type == "MultiPolygon" else [geom]
        parts = []
        west, south, east, north = 180.0, 90.0, -180.0, -90.0
        for part in parts_src:
            if part.is_empty or part.area < 1e5:
                continue
            outer = _ll_ring(part.exterior)
            holes = [_ll_ring(hole) for hole in part.interiors]
            item = {"o": outer}
            if holes:
                item["h"] = holes
            parts.append(item)
            for lon, lat in outer:
                west, south = min(west, lon), min(south, lat)
                east, north = max(east, lon), max(north, lat)
        records.append(
            {
                "id": city["id"],
                "name": city["name"],
                "lon": city["lon"],
                "lat": city["lat"],
                "south": round(south, 5),
                "west": round(west, 5),
                "north": round(north, 5),
                "east": round(east, 5),
                "parts": parts,
            }
        )
    return records


def load_switzerland():
    meta, geometry, arrays = unpack_read(
        raw.read(BOUND_VSI, layer="tlm_landesgebiet", read_geometry=True, force_2d=True)
    )
    names = list(meta["fields"])
    icc_i = names.index("icc")
    parts = []
    for i, g in enumerate(geometry):
        if str(arrays[icc_i][i]) != "CH":
            continue
        parts.append(from_wkb(g))
    ch = unary_union(parts)
    if ch.has_z:
        ch = shp_transform(lambda x, y, z=None: (x, y), ch)
    return ch.simplify(180.0, preserve_topology=True)


def empty_bucket():
    return {
        "n": 0,
        "sum_k": 0.0,
        "counts": [0, 0, 0, 0, 0],
        "sum_slope": 0.0,
        "sum_aspect": 0.0,
        "sum_area": 0.0,
    }


def add_row(bucket, k, slope, aspect, area):
    if k < 1 or k > 5:
        return
    bucket["n"] += 1
    bucket["sum_k"] += k
    bucket["counts"][k - 1] += 1
    bucket["sum_slope"] += slope
    bucket["sum_aspect"] += aspect
    bucket["sum_area"] += area


def bin_from_gdb() -> tuple[dict, dict]:
    info = pyogrio.read_info(VSI, layer=LAYER)
    n_features = int(info["features"])
    print(f"full cadastre n={n_features:,}", flush=True)
    buckets: dict[tuple[int, int], dict] = defaultdict(empty_bucket)
    national = empty_bucket()
    offset = 0
    t0 = time.time()
    while offset < n_features:
        take = min(CHUNK, n_features - offset)
        meta, geometry, arrays = unpack_read(
            raw.read(
                VSI,
                layer=LAYER,
                skip_features=offset,
                max_features=take,
                read_geometry=True,
                columns=["KLASSE", "FLAECHE", "NEIGUNG", "AUSRICHTUNG"],
            )
        )
        names = list(meta["fields"])
        klasse = np.asarray(arrays[names.index("KLASSE")])
        area = np.asarray(arrays[names.index("FLAECHE")], dtype=np.float64)
        slope = np.asarray(arrays[names.index("NEIGUNG")], dtype=np.float64)
        aspect = np.asarray(arrays[names.index("AUSRICHTUNG")], dtype=np.float64)
        for j, g in enumerate(geometry):
            e, n = parse_wkb_xy(g)
            k = int(klasse[j])
            add_row(buckets[to_axial(float(e), float(n))], k, float(slope[j]), float(aspect[j]), float(area[j]))
            add_row(national, k, float(slope[j]), float(aspect[j]), float(area[j]))
        offset += take
        print(f"  hex pass {offset:,}/{n_features:,}  {time.time() - t0:.1f}s  cells={len(buckets):,}", flush=True)
    return buckets, national


def bin_from_sample() -> tuple[dict, dict]:
    df = pd.read_csv(CSV)
    east, north = TO_LV.transform(df["longitude"].to_numpy(), df["latitude"].to_numpy())
    buckets: dict[tuple[int, int], dict] = defaultdict(empty_bucket)
    national = empty_bucket()
    k = df["klasse"].to_numpy()
    slope = df["slope_deg"].to_numpy()
    aspect = df["aspect_deg"].to_numpy()
    area = df["roof_area_m2"].to_numpy()
    for i, (e, n) in enumerate(zip(east, north)):
        add_row(buckets[to_axial(float(e), float(n))], int(k[i]), float(slope[i]), float(aspect[i]), float(area[i]))
        add_row(national, int(k[i]), float(slope[i]), float(aspect[i]), float(area[i]))
    return buckets, national


def pack_national(national: dict) -> dict:
    n = national["n"]
    return {
        "n": int(n),
        "mean_klasse": round(national["sum_k"] / n, 3),
        "pct4": round(100.0 * (national["counts"][3] + national["counts"][4]) / n, 2),
        "pct5": round(100.0 * national["counts"][4] / n, 2),
        "counts": [int(c) for c in national["counts"]],
        "mean_slope": round(national["sum_slope"] / n, 1),
    }


def write_roofs_sample() -> int:
    df = pd.read_csv(CSV)
    roofs = {
        "n": int(len(df)),
        "rows": list(
            zip(
                df["latitude"].round(6).tolist(),
                df["longitude"].round(6).tolist(),
                df["klasse"].astype(int).tolist(),
                df["slope_deg"].astype(int).tolist(),
                df["aspect_deg"].astype(int).tolist(),
                df["roof_area_m2"].round(1).tolist(),
            )
        ),
    }
    ROOFS_OUT.write_text(json.dumps(roofs, separators=(",", ":")))
    print("wrote", ROOFS_OUT, "roofs", roofs["n"], "bytes", ROOFS_OUT.stat().st_size)
    return int(len(df))


def main() -> None:
    from_full = ZIP_PATH.exists() and "--from-sample" not in sys.argv
    if from_full:
        buckets, national = bin_from_gdb()
        source = "full"
    else:
        print("FileGDB missing; binning the 100k sample")
        buckets, national = bin_from_sample()
        source = "sample"

    print("clipping hexes to CH…", flush=True)
    ch = load_switzerland()
    hexes = []
    for (q, r), b in buckets.items():
        if b["n"] < MIN_ROOFS:
            continue
        clipped = hex_poly_lv(q, r).intersection(ch)
        ring = ring_wgs(clipped)
        if not ring:
            continue
        cx, cy = hex_center(q, r)
        lon, lat = TO_LL.transform(cx, cy)
        n = int(b["n"])
        hexes.append(
            {
                "q": q,
                "r": r,
                "lon": round(float(lon), 5),
                "lat": round(float(lat), 5),
                "ring": ring,
                "n": n,
                "mean_klasse": round(b["sum_k"] / n, 3),
                "pct4": round(100.0 * (b["counts"][3] + b["counts"][4]) / n, 2),
                "pct5": round(100.0 * b["counts"][4] / n, 2),
                "counts": [int(c) for c in b["counts"]],
                "mean_slope": round(b["sum_slope"] / n, 1),
                "mean_aspect": round(b["sum_aspect"] / n, 1),
                "mean_area": round(b["sum_area"] / n, 1),
            }
        )

    n_sample = write_roofs_sample()
    payload = {
        "size_m": SIZE_M,
        "source": source,
        "n_roofs": int(national["n"]),
        "n_sample": n_sample,
        "n_hexes": len(hexes),
        "national": pack_national(national),
        "cities": city_records(),
        "hexes": hexes,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":")))
    print("wrote", OUT, "hexes", len(hexes), "source", source, "bytes", OUT.stat().st_size)


def patch_cities() -> None:
    payload = json.loads(OUT.read_text())
    payload["cities"] = city_records()
    OUT.write_text(json.dumps(payload, separators=(",", ":")))
    print("patched cities in", OUT, "bytes", OUT.stat().st_size)


if __name__ == "__main__":
    if "--cities-only" in sys.argv:
        patch_cities()
    else:
        main()
