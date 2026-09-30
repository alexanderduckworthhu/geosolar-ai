"""One-off FileGDB inspection. Not part of the training pipeline."""

from __future__ import annotations

import json
import struct
import time
from collections import Counter

import numpy as np
import pyogrio
import pyogrio.raw as raw
from pyproj import Transformer

VSI = (
    "/vsizip/data/raw/solarenergie-eignung-daecher_2056_generalized.gdb.zip"
    "/SOLKAT_DACH_generalisiert.gdb"
)
LAYER = "SOLKAT_CH_DACH"
CHUNK = 250_000


def unpack_read(out):
    if len(out) == 3:
        meta, geometry, arrays = out
        return meta, None, geometry, arrays
    if len(out) == 4:
        meta, fids, geometry, arrays = out
        return meta, fids, geometry, arrays
    raise RuntimeError(f"unexpected raw.read tuple length {len(out)}")


def parse_wkb_xy(wkb: bytes):
    endian = wkb[0]
    fmt_d = "<d" if endian == 1 else ">d"
    gtype = int.from_bytes(wkb[1:5], "little" if endian == 1 else "big")
    base = gtype & 0xFF
    if base == 4:  # MultiPoint
        x = struct.unpack_from(fmt_d, wkb, 14)[0]
        y = struct.unpack_from(fmt_d, wkb, 22)[0]
        return x, y
    if base == 1:  # Point
        x = struct.unpack_from(fmt_d, wkb, 5)[0]
        y = struct.unpack_from(fmt_d, wkb, 13)[0]
        return x, y
    raise ValueError(f"unsupported WKB type {gtype}")


def to_numpy(arr, dtype):
    if np.ma.isMaskedArray(arr):
        if np.issubdtype(np.dtype(dtype), np.datetime64):
            return np.array(arr.filled(np.datetime64("NaT")), dtype="datetime64[ms]")
        return np.array(arr.filled(np.nan), dtype="float64")
    a = np.asarray(arr)
    if dtype == "float64" or a.dtype.kind == "f":
        return np.asarray(arr, dtype="float64")
    if np.issubdtype(np.dtype(dtype), np.datetime64):
        return np.asarray(arr, dtype="datetime64[ms]")
    return np.asarray(arr)


def missing_count(arr: np.ndarray) -> int:
    if np.issubdtype(arr.dtype, np.datetime64):
        return int(np.isnat(arr).sum())
    if arr.dtype == object:
        n = 0
        for x in arr:
            if x is None or x == "" or (isinstance(x, float) and np.isnan(x)):
                n += 1
        return n
    if np.issubdtype(arr.dtype, np.floating):
        return int(np.isnan(arr).sum())
    return 0


def main():
    info = pyogrio.read_info(VSI, layer=LAYER)
    n = int(info["features"])
    fields = list(info["fields"])
    dtypes = list(info["dtypes"])
    print("n_features", n)
    print("fields", fields)
    print("total_bounds", info["total_bounds"])
    print("crs", info["crs"], "geom", info["geometry_type"])

    meta, _fids, geometry, arrays = unpack_read(
        raw.read(VSI, layer=LAYER, max_features=8, read_geometry=True)
    )
    tf = Transformer.from_crs(2056, 4326, always_xy=True)
    name_idx = {name: i for i, name in enumerate(meta["fields"])}
    samples = []
    print("\nSample points LV95 -> WGS84:")
    for i in range(len(geometry)):
        xy = parse_wkb_xy(geometry[i])
        lon, lat = tf.transform(*xy)
        rec = {
            "lv95_e": xy[0],
            "lv95_n": xy[1],
            "lon": lon,
            "lat": lat,
            "KLASSE": int(arrays[name_idx["KLASSE"]][i]),
            "MSTRAHLUNG": int(arrays[name_idx["MSTRAHLUNG"]][i]),
            "FLAECHE": float(arrays[name_idx["FLAECHE"]][i]),
            "NEIGUNG": int(arrays[name_idx["NEIGUNG"]][i]),
            "AUSRICHTUNG": int(arrays[name_idx["AUSRICHTUNG"]][i]),
        }
        samples.append(rec)
        print(
            f"  i={i} LV95=({xy[0]:.3f},{xy[1]:.3f}) "
            f"lon={lon:.6f} lat={lat:.6f} KLASSE={rec['KLASSE']} "
            f"MSTRAHLUNG={rec['MSTRAHLUNG']} FLAECHE={rec['FLAECHE']:.3f} "
            f"NEIGUNG={rec['NEIGUNG']} AUSRICHTUNG={rec['AUSRICHTUNG']}"
        )

    full = {}
    for name, dt in zip(fields, dtypes):
        if name == "SB_UUID":
            continue
        if name == "GWR_EGID" or str(dt) in ("float64", "float32"):
            full[name] = np.empty(n, dtype="float64")
        elif str(dt).startswith("datetime"):
            full[name] = np.empty(n, dtype="datetime64[ms]")
        else:
            full[name] = np.empty(n, dtype=dt)

    uuid_missing = 0
    uuid_n = 0
    klasse_counts: Counter = Counter()
    objektart_counts: Counter = Counter()

    t0 = time.time()
    offset = 0
    while offset < n:
        take = min(CHUNK, n - offset)
        meta, _fids, _geom, arrays = unpack_read(
            raw.read(
                VSI,
                layer=LAYER,
                skip_features=offset,
                max_features=take,
                read_geometry=False,
            )
        )
        got = len(arrays[0])
        sl = slice(offset, offset + got)
        for name, arr in zip(meta["fields"], arrays):
            if name == "SB_UUID":
                a = np.asarray(arr, dtype=object)
                miss = 0
                for x in a:
                    if x is None or x == "" or (isinstance(x, float) and np.isnan(x)):
                        miss += 1
                uuid_missing += miss
                uuid_n += got
                continue
            target_dtype = str(full[name].dtype)
            if name == "GWR_EGID" or target_dtype.startswith("float"):
                full[name][sl] = to_numpy(arr, "float64")[:got]
            elif target_dtype.startswith("datetime"):
                full[name][sl] = to_numpy(arr, "datetime64[ms]")[:got]
            else:
                full[name][sl] = np.asarray(arr)[:got]
            if name == "KLASSE":
                vals, cnts = np.unique(np.asarray(arr), return_counts=True)
                for v, c in zip(vals, cnts):
                    klasse_counts[int(v)] += int(c)
            if name == "SB_OBJEKTART":
                vals, cnts = np.unique(np.asarray(arr), return_counts=True)
                for v, c in zip(vals, cnts):
                    objektart_counts[int(v)] += int(c)
        offset += got
        print(f"  scanned {offset:,}/{n:,}  elapsed={time.time()-t0:.1f}s", flush=True)
        if got == 0:
            break

    print("scan done", offset, "in", time.time() - t0)

    stats = {
        "SB_UUID": {
            "dtype": "object/guid",
            "n": uuid_n,
            "n_missing": uuid_missing,
            "pct_missing": 100.0 * uuid_missing / uuid_n if uuid_n else None,
        }
    }
    for name, arr in full.items():
        miss = missing_count(arr)
        rec = {
            "dtype": str(arr.dtype),
            "n": int(len(arr)),
            "n_missing": miss,
            "pct_missing": 100.0 * miss / len(arr),
        }
        if np.issubdtype(arr.dtype, np.datetime64):
            valid = arr[~np.isnat(arr)]
            if len(valid):
                rec["min"] = str(valid.min())
                rec["max"] = str(valid.max())
                rec["median"] = str(np.sort(valid)[len(valid) // 2])
        elif np.issubdtype(arr.dtype, np.floating):
            valid = arr[~np.isnan(arr)]
            rec["min"] = float(np.min(valid)) if len(valid) else None
            rec["max"] = float(np.max(valid)) if len(valid) else None
            rec["median"] = float(np.median(valid)) if len(valid) else None
            rec["mean"] = float(np.mean(valid)) if len(valid) else None
        elif np.issubdtype(arr.dtype, np.integer):
            rec["min"] = int(arr.min())
            rec["max"] = int(arr.max())
            rec["median"] = float(np.median(arr))
            rec["mean"] = float(np.mean(arr))
            rec["nunique"] = int(len(np.unique(arr)))
        stats[name] = rec
        print(
            f"{name:28} miss={miss:,} ({rec['pct_missing']:.4f}%) "
            f"min={rec.get('min')} median={rec.get('median')} max={rec.get('max')}"
        )

    klasse = full["KLASSE"]
    mstr = full["MSTRAHLUNG"].astype(np.int32)
    exp = np.empty(mstr.shape, dtype=np.int16)
    exp[mstr < 800] = 1
    exp[(mstr >= 800) & (mstr < 1000)] = 2
    exp[(mstr >= 1000) & (mstr < 1200)] = 3
    exp[(mstr >= 1200) & (mstr < 1400)] = 4
    exp[mstr >= 1400] = 5
    n_mismatch = int(np.sum(exp != klasse))
    print(
        f"\nKLASSE vs MSTRAHLUNG rule mismatches: "
        f"{n_mismatch:,} / {n:,} ({100 * n_mismatch / n:.6f}%)"
    )

    gstr = full["GSTRAHLUNG"].astype(np.int64)
    fl = full["FLAECHE"]
    pred_g = np.rint(mstr * fl)
    g_abs = np.abs(gstr - pred_g)
    strom = full["STROMERTRAG"].astype(np.int64)
    pred_s = np.rint(0.2 * 0.8 * gstr)
    s_abs = np.abs(strom - pred_s)
    print(
        "GSTRAHLUNG vs round(MSTRAHLUNG*FLAECHE): median_abs_err",
        float(np.median(g_abs)),
        "p99",
        float(np.percentile(g_abs, 99)),
        "max",
        int(g_abs.max()),
        "exact_match_pct",
        float(np.mean(g_abs == 0) * 100),
    )
    print(
        "STROMERTRAG vs round(0.16*GSTRAHLUNG): median_abs_err",
        float(np.median(s_abs)),
        "p99",
        float(np.percentile(s_abs, 99)),
        "max",
        int(s_abs.max()),
        "exact_match_pct",
        float(np.mean(s_abs == 0) * 100),
    )

    # Spatial coverage from a systematic geometry subsample (every 200th row)
    step = 200
    meta, _fids, geom_sub, _arrs = unpack_read(
        raw.read(
            VSI,
            layer=LAYER,
            skip_features=0,
            max_features=n,
            read_geometry=True,
            # OpenFileGDB does not support SQL easily here; sample later if too slow
        )
        if False
        else raw.read(VSI, layer=LAYER, max_features=1, read_geometry=True)
    )
    del meta, geom_sub

    e_min, n_min, e_max, n_max = map(float, info["total_bounds"])
    # 20 km grid occupancy using a 50k random-index geometry read would be slow;
    # instead read geometries in a few chunks of 20k with skip jumps.
    grid = Counter()
    cell = 20000.0
    geom_samples = 0
    for skip in range(0, n, 500_000):
        meta, _fids, geoms, arrays = unpack_read(
            raw.read(
                VSI,
                layer=LAYER,
                skip_features=skip,
                max_features=20_000,
                read_geometry=True,
            )
        )
        for g in geoms:
            if g is None:
                continue
            x, y = parse_wkb_xy(g)
            ge = int((x - e_min) // cell)
            gn = int((y - n_min) // cell)
            grid[(ge, gn)] += 1
            geom_samples += 1
        print(f"  geom sample skip={skip:,} total_pts={geom_samples:,}")

    occupied_cells = len(grid)
    print("occupied 20km cells", occupied_cells, "from", geom_samples, "points")

    report = {
        "source_file": "data/raw/solarenergie-eignung-daecher_2056_generalized.gdb.zip",
        "download_url": (
            "https://data.geo.admin.ch/ch.bfe.solarenergie-eignung-daecher/"
            "solarenergie-eignung-daecher/solarenergie-eignung-daecher_2056_generalized.gdb.zip"
        ),
        "inner_gdb": "SOLKAT_DACH_generalisiert.gdb",
        "layer": LAYER,
        "crs": info["crs"],
        "geometry_type": info["geometry_type"],
        "n_features": n,
        "total_bounds_epsg2056": list(map(float, info["total_bounds"])),
        "sample_points": samples,
        "klasse_counts": {str(k): int(v) for k, v in sorted(klasse_counts.items())},
        "sb_objektart_counts": {
            str(k): int(v) for k, v in sorted(objektart_counts.items())
        },
        "column_stats": stats,
        "leakage": {
            "klasse_vs_mstrahlung_mismatches": n_mismatch,
            "klasse_vs_mstrahlung_mismatch_pct": 100.0 * n_mismatch / n,
            "gstrahlung_vs_mstrahlung_flaeche_median_abs_err": float(np.median(g_abs)),
            "gstrahlung_vs_mstrahlung_flaeche_p99_abs_err": float(np.percentile(g_abs, 99)),
            "gstrahlung_vs_mstrahlung_flaeche_max_abs_err": int(g_abs.max()),
            "gstrahlung_vs_mstrahlung_flaeche_exact_match_pct": float(np.mean(g_abs == 0) * 100),
            "stromertrag_vs_0_16_gstrahlung_median_abs_err": float(np.median(s_abs)),
            "stromertrag_vs_0_16_gstrahlung_p99_abs_err": float(np.percentile(s_abs, 99)),
            "stromertrag_vs_0_16_gstrahlung_max_abs_err": int(s_abs.max()),
            "stromertrag_vs_0_16_gstrahlung_exact_match_pct": float(np.mean(s_abs == 0) * 100),
        },
        "spatial_subsample": {
            "n_points": geom_samples,
            "cell_m": cell,
            "occupied_cells": occupied_cells,
            "sampling": "20k features every 500k skip_features",
        },
        "elapsed_s": time.time() - t0,
    }
    out_path = "data/docs/inspection_stats.json"
    with open(out_path, "w") as f:
        json.dump(report, f, indent=2)
    print("Wrote", out_path)
    print("elapsed total", time.time() - t0)


if __name__ == "__main__":
    main()
