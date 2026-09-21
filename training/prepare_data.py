#!/usr/bin/env python3
"""Raw Sonnendach FileGDB → stratified 100k-row CSV for training.

Documented sampling rule (DATASET_REPORT.md §10):
  n = 100_000, random_state=42, stratified by KLASSE.
  n_k = round(100_000 * N_k / N); adjust ±1 on the largest class so the
  counts sum to 100_000. Sample without replacement inside each class
  with pandas.Series.sample(..., random_state=42).

Coordinates: MultiPoint already in EPSG:2056 → lon/lat with pyproj
(always_xy=True). Centroids are never computed in a geographic CRS.

Does not use radiation/yield columns (leakage).
"""

from __future__ import annotations

import hashlib
import json
import struct
import time
from collections import defaultdict
from pathlib import Path

import numpy as np
import pandas as pd
import pyogrio
import pyogrio.raw as raw
from pyproj import Transformer

ROOT = Path(__file__).resolve().parents[1]
ZIP_NAME = "solarenergie-eignung-daecher_2056_generalized.gdb.zip"
ZIP_PATH = ROOT / "data" / "raw" / ZIP_NAME
VSI = f"/vsizip/{ZIP_PATH}/SOLKAT_DACH_generalisiert.gdb"
LAYER = "SOLKAT_CH_DACH"
SOURCE_URL = (
    "https://data.geo.admin.ch/ch.bfe.solarenergie-eignung-daecher/"
    "solarenergie-eignung-daecher/solarenergie-eignung-daecher_2056_generalized.gdb.zip"
)
OUT_CSV = ROOT / "data" / "processed" / "roofs_sample.csv"
OUT_MANIFEST = ROOT / "data" / "processed" / "sample_manifest.json"
N_SAMPLE = 100_000
SEED = 42
CHUNK = 250_000
FEATURE_COLUMNS = [
    "latitude",
    "longitude",
    "roof_area_m2",
    "slope_deg",
    "aspect_deg",
    "klasse",
]


def unpack_read(out):
    if len(out) == 4:
        meta, fids, geometry, arrays = out
        return meta, fids, geometry, arrays
    meta, geometry, arrays = out
    return meta, None, geometry, arrays


def parse_wkb_xy(wkb: bytes) -> tuple[float, float]:
    endian = wkb[0]
    fmt_d = "<d" if endian == 1 else ">d"
    gtype = int.from_bytes(wkb[1:5], "little" if endian == 1 else "big")
    base = gtype & 0xFF
    if base == 4:  # MultiPoint
        return struct.unpack_from(fmt_d, wkb, 14)[0], struct.unpack_from(fmt_d, wkb, 22)[0]
    if base == 1:
        return struct.unpack_from(fmt_d, wkb, 5)[0], struct.unpack_from(fmt_d, wkb, 13)[0]
    raise ValueError(f"unsupported WKB type {gtype}")


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def collect_fids_by_class(n_features: int) -> dict[int, np.ndarray]:
    """Pass 1: KLASSE + FID only, no geometry."""
    buckets: dict[int, list[np.ndarray]] = defaultdict(list)
    offset = 0
    t0 = time.time()
    while offset < n_features:
        take = min(CHUNK, n_features - offset)
        meta, fids, _geom, arrays = unpack_read(
            raw.read(
                VSI,
                layer=LAYER,
                skip_features=offset,
                max_features=take,
                read_geometry=False,
                columns=["KLASSE"],
                return_fids=True,
            )
        )
        names = list(meta["fields"])
        klasse = np.asarray(arrays[names.index("KLASSE")])
        if fids is None:
            raise RuntimeError("OpenFileGDB did not return FIDs")
        for k in (1, 2, 3, 4, 5):
            buckets[k].append(fids[klasse == k])
        offset += take
        print(f"  pass1 {offset:,}/{n_features:,}  {time.time() - t0:.1f}s", flush=True)
    return {k: np.concatenate(chunks) if chunks else np.array([], dtype=np.int64) for k, chunks in buckets.items()}


def target_counts(pop: dict[int, int], n_sample: int) -> dict[int, int]:
    n = sum(pop.values())
    raw_counts = {k: int(round(n_sample * pop[k] / n)) for k in sorted(pop)}
    delta = n_sample - sum(raw_counts.values())
    largest = max(pop, key=pop.get)
    raw_counts[largest] += delta
    if sum(raw_counts.values()) != n_sample:
        raise RuntimeError(f"sample sizes {raw_counts} do not sum to {n_sample}")
    return raw_counts


def stratified_fids(by_class: dict[int, np.ndarray], n_k: dict[int, int]) -> np.ndarray:
    sampled = []
    for k, n in n_k.items():
        series = pd.Series(by_class[k])
        if n > len(series):
            raise RuntimeError(f"class {k}: want {n}, have {len(series)}")
        sampled.append(
            pd.DataFrame({"fid": by_class[k]})
            .sample(n=n, random_state=SEED)["fid"]
            .to_numpy()
        )
        print(f"  class {k}: population={len(series):,}  sample={n:,}")
    fids = np.concatenate(sampled)
    fids.sort()
    return fids


def load_sampled_rows(fids: np.ndarray) -> pd.DataFrame:
    tf = Transformer.from_crs(2056, 4326, always_xy=True)
    rows = []
    step = 8_000
    t0 = time.time()
    for i in range(0, len(fids), step):
        batch = [int(x) for x in fids[i : i + step]]
        meta, _fids, geometry, arrays = unpack_read(
            raw.read(
                VSI,
                layer=LAYER,
                fids=batch,
                read_geometry=True,
                columns=["KLASSE", "FLAECHE", "NEIGUNG", "AUSRICHTUNG"],
                return_fids=True,
            )
        )
        names = list(meta["fields"])
        klasse = np.asarray(arrays[names.index("KLASSE")])
        area = np.asarray(arrays[names.index("FLAECHE")], dtype=np.float64)
        slope = np.asarray(arrays[names.index("NEIGUNG")])
        aspect = np.asarray(arrays[names.index("AUSRICHTUNG")])
        east = np.empty(len(geometry), dtype=np.float64)
        north = np.empty(len(geometry), dtype=np.float64)
        for j, g in enumerate(geometry):
            east[j], north[j] = parse_wkb_xy(g)
        lon, lat = tf.transform(east, north)
        part = pd.DataFrame(
            {
                "latitude": lat,
                "longitude": lon,
                "roof_area_m2": area,
                "slope_deg": slope.astype(np.int16),
                "aspect_deg": aspect.astype(np.int16),
                "klasse": klasse.astype(np.int16),
            }
        )
        rows.append(part)
        print(f"  pass2 {min(i + len(batch), len(fids)):,}/{len(fids):,}  {time.time() - t0:.1f}s", flush=True)
    df = pd.concat(rows, ignore_index=True)
    return df[FEATURE_COLUMNS]


def main() -> None:
    if not ZIP_PATH.exists():
        raise SystemExit(
            f"Missing {ZIP_PATH}\n"
            f"Download first:\n  mkdir -p data/raw && curl -L -o {ZIP_PATH} {SOURCE_URL}"
        )
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    info = pyogrio.read_info(VSI, layer=LAYER)
    n_features = int(info["features"])
    print("layer", LAYER, "crs", info["crs"], "geom", info["geometry_type"], "n", n_features)
    print("Pass 1: collect FIDs by KLASSE")
    by_class = collect_fids_by_class(n_features)
    pop = {k: int(len(v)) for k, v in sorted(by_class.items())}
    print("population", pop, "sum", sum(pop.values()))
    n_k = target_counts(pop, N_SAMPLE)
    print("target n_k", n_k, "sum", sum(n_k.values()))
    print("Pass 1b: stratified sample of FIDs")
    fids = stratified_fids(by_class, n_k)
    print("Pass 2: read geometry + convert EPSG:2056 → WGS84")
    df = load_sampled_rows(fids)
    before = len(df)
    df = df[df["klasse"].isin([1, 2, 3, 4, 5])].dropna(subset=FEATURE_COLUMNS)
    print(f"dropped {before - len(df)} invalid rows")
    if len(df) != N_SAMPLE:
        raise RuntimeError(f"expected {N_SAMPLE} rows, got {len(df)}")
    df.to_csv(OUT_CSV, index=False)
    digest = sha256_file(ZIP_PATH)
    manifest = {
        "source_url": SOURCE_URL,
        "source_zip": str(ZIP_PATH.relative_to(ROOT)),
        "source_sha256": digest,
        "layer": LAYER,
        "crs_source": "EPSG:2056",
        "crs_output": "EPSG:4326",
        "coordinate_rule": "parse MultiPoint in EPSG:2056, then pyproj always_xy=True to EPSG:4326",
        "n_population": n_features,
        "population_by_klasse": pop,
        "n_sample": N_SAMPLE,
        "n_by_klasse": {str(k): int((df["klasse"] == k).sum()) for k in range(1, 6)},
        "target_n_k": {str(k): v for k, v in n_k.items()},
        "random_state": SEED,
        "columns": FEATURE_COLUMNS,
        "output_csv": str(OUT_CSV.relative_to(ROOT)),
    }
    OUT_MANIFEST.write_text(json.dumps(manifest, indent=2))
    print("wrote", OUT_CSV, "rows", len(df))
    print("wrote", OUT_MANIFEST)
    print(df.head(3).to_string(index=False))
    print(df["klasse"].value_counts().sort_index())


if __name__ == "__main__":
    main()
