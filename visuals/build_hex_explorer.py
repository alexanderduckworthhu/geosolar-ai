#!/usr/bin/env python3
"""Bin roofs_sample.csv into projected hexagons for the static explorer."""

from __future__ import annotations

import json
import math
from collections import defaultdict
from pathlib import Path

import pandas as pd
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
CSV = ROOT / "data" / "processed" / "roofs_sample.csv"
OUT = ROOT / "frontend" / "data" / "hexes.json"
ROOFS_OUT = ROOT / "frontend" / "data" / "roofs.json"

SIZE_M = 2400.0  # hex radius in LV95 metres
MIN_ROOFS = 3

CITIES = [
    {"id": "ch", "name": "Switzerland", "lon": 8.23, "lat": 46.80, "radius_km": 175},
    {"id": "zh", "name": "Zürich", "lon": 8.5417, "lat": 47.3769, "radius_km": 14},
    {"id": "ge", "name": "Genève", "lon": 6.1432, "lat": 46.2044, "radius_km": 12},
    {"id": "be", "name": "Bern", "lon": 7.4474, "lat": 46.9480, "radius_km": 12},
    {"id": "bs", "name": "Basel", "lon": 7.5886, "lat": 47.5596, "radius_km": 11},
    {"id": "ls", "name": "Lausanne", "lon": 6.6323, "lat": 46.5197, "radius_km": 11},
    {"id": "ti", "name": "Lugano", "lon": 8.9511, "lat": 46.0101, "radius_km": 12},
    {"id": "vs", "name": "Sion", "lon": 7.3606, "lat": 46.2331, "radius_km": 14},
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


def hex_ring(q: int, r: int) -> list[list[float]]:
    cx, cy = hex_center(q, r)
    ring = []
    for i in range(6):
        angle = math.radians(60 * i - 30)
        e = cx + SIZE_M * math.cos(angle)
        n = cy + SIZE_M * math.sin(angle)
        lon, lat = TO_LL.transform(e, n)
        ring.append([round(lon, 5), round(lat, 5)])
    ring.append(ring[0])
    return ring


def main() -> None:
    df = pd.read_csv(CSV)
    east, north = TO_LV.transform(df["longitude"].to_numpy(), df["latitude"].to_numpy())
    buckets: dict[tuple[int, int], list[int]] = defaultdict(list)
    for i, (e, n) in enumerate(zip(east, north)):
        buckets[to_axial(float(e), float(n))].append(i)

    hexes = []
    for (q, r), idxs in buckets.items():
        if len(idxs) < MIN_ROOFS:
            continue
        part = df.iloc[idxs]
        k = part["klasse"].to_numpy()
        counts = [int((k == c).sum()) for c in range(1, 6)]
        cx, cy = hex_center(q, r)
        lon, lat = TO_LL.transform(cx, cy)
        n = int(len(part))
        hexes.append(
            {
                "q": q,
                "r": r,
                "lon": round(float(lon), 5),
                "lat": round(float(lat), 5),
                "ring": hex_ring(q, r),
                "n": n,
                "mean_klasse": round(float(part["klasse"].mean()), 3),
                "pct4": round(100.0 * float((k >= 4).mean()), 2),
                "pct5": round(100.0 * float((k == 5).mean()), 2),
                "counts": counts,
                "mean_slope": round(float(part["slope_deg"].mean()), 1),
                "mean_aspect": round(float(part["aspect_deg"].mean()), 1),
                "mean_area": round(float(part["roof_area_m2"].mean()), 1),
            }
        )

    k_all = df["klasse"].to_numpy()
    payload = {
        "size_m": SIZE_M,
        "n_roofs": int(len(df)),
        "n_hexes": len(hexes),
        "national": {
            "n": int(len(df)),
            "mean_klasse": round(float(df["klasse"].mean()), 3),
            "pct4": round(100.0 * float((k_all >= 4).mean()), 2),
            "pct5": round(100.0 * float((k_all == 5).mean()), 2),
            "counts": [int((k_all == c).sum()) for c in range(1, 6)],
            "mean_slope": round(float(df["slope_deg"].mean()), 1),
        },
        "cities": CITIES,
        "hexes": hexes,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, separators=(",", ":")))
    print("wrote", OUT, "hexes", len(hexes), "bytes", OUT.stat().st_size)

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


if __name__ == "__main__":
    main()
