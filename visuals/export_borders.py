#!/usr/bin/env python3
"""Write simplified WGS84 canton + country outlines for the explorer."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pyogrio.raw as raw
from pyproj import Transformer
from shapely import from_wkb
from shapely.geometry import mapping
from shapely.ops import transform as shp_transform

ROOT = Path(__file__).resolve().parents[1]
BOUND_VSI = (
    "/vsizip/"
    + str(ROOT / "data/raw/swissboundaries3d_2026-01_2056_5728.gpkg.zip")
    + "/swissBOUNDARIES3D_1_5_LV95_LN02.gpkg"
)
OUT = ROOT / "frontend/data/borders.json"

TO_WGS = Transformer.from_crs(2056, 4326, always_xy=True).transform
SIMPLIFY_M = 180


def unpack_read(out):
    if len(out) == 4:
        return out[0], out[2], out[3]
    return out[0], out[1], out[2]


def force2d(geom):
    return shp_transform(lambda x, y, z=None: (x, y), geom)


def to_ll(geom):
    if geom.has_z:
        geom = force2d(geom)
    geom = geom.simplify(SIMPLIFY_M, preserve_topology=True)
    return shp_transform(TO_WGS, geom)


def layer_features(layer, kind, name_field, extra=None):
    meta, geometry, arrays = unpack_read(
        raw.read(BOUND_VSI, layer=layer, read_geometry=True, force_2d=True)
    )
    names = list(meta["fields"])
    idx = {n: i for i, n in enumerate(names)}
    feats = []
    for i in range(len(arrays[0])):
        props = {"kind": kind, "name": str(arrays[idx[name_field]][i])}
        if extra:
            extra(props, arrays, idx, i)
        geom = to_ll(from_wkb(geometry[i]))
        if geom.is_empty:
            continue
        feats.append(
            {
                "type": "Feature",
                "properties": props,
                "geometry": mapping(geom),
            }
        )
    return feats


def main():
    feats = layer_features("tlm_kantonsgebiet", "canton", "name")
    country = layer_features(
        "tlm_landesgebiet",
        "country",
        "name",
        extra=lambda props, arrays, idx, i: props.update(icc=str(arrays[idx["icc"]][i])),
    )
    feats.extend([f for f in country if f["properties"].get("icc") == "CH"])
    payload = {"type": "FeatureCollection", "features": feats}
    OUT.write_text(json.dumps(payload, separators=(",", ":")))
    print(f"wrote {OUT} ({OUT.stat().st_size:,} bytes, {len(feats)} features)")


if __name__ == "__main__":
    sys.exit(main())
