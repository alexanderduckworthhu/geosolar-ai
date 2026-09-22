# GeoSolar AI — Swiss Rooftop Solar Potential Predictor

Student project for **DIT323 Artificial Intelligence as a Service** (ML model as REST API).

Pipeline: official Sonnendach.ch roofs → stratified sample → sklearn `Pipeline` artifact → FastAPI loads that file only (never retrains) → Leaflet web form.

**Dataset to submit:**  
https://opendata.swiss/de/dataset/eignung-von-hausdachern-fur-die-nutzung-von-sonnenenergie

**Repo:** https://github.com/alexanderduckworthhu/geosolar-ai

---

## Overview

The API predicts the official roof suitability class `KLASSE` ∈ {1,2,3,4,5} (gering → hervorragend) from five values a visitor can type or click: latitude, longitude, roof area, slope, and aspect.

It does **not** predict kWh. Official yield is a physics formula on irradiation; irradiation is also how `KLASSE` is assigned, so using it as an input would leak the target.

Full file inspection: [`DATASET_REPORT.md`](DATASET_REPORT.md).  
Maps for class / LinkedIn / slides: [`visuals/README.md`](visuals/README.md).

---

## Dataset

| | |
| --- | --- |
| Official name | *Eignung von Hausdächern für die Nutzung von Sonnenenergie* (Sonnendach.ch) |
| Publisher | Swiss Federal Office of Energy (BFE / SFOE), swisstopo, MeteoSwiss |
| File used | Annual **generalized** FileGDB zip, EPSG:2056, layer `SOLKAT_CH_DACH` |
| Direct download | https://data.geo.admin.ch/ch.bfe.solarenergie-eignung-daecher/solarenergie-eignung-daecher/solarenergie-eignung-daecher_2056_generalized.gdb.zip |
| Size / checksum | 822,569,229 bytes; SHA-256 `d5cabc1e55ac7b470e8a5905df866c915e464bdcb7d05f395aac3df11100afec` |
| Population | **10,071,755** roofs (full-file count) |
| Sample | **100,000** roofs, stratified by `KLASSE`, `random_state=42` |

Geometry in this generalized file is **MultiPoint** in LV95. Coordinates are parsed in EPSG:2056, then converted with `pyproj` (`always_xy=True`) to WGS84. Centroids are never computed in a geographic CRS.

---

## ML problem

**Task:** multiclass classification of official `KLASSE`.

| Code | Official label |
| ---: | --- |
| 1 | gering / low |
| 2 | mittel / medium |
| 3 | gut / good |
| 4 | sehr gut / very good |
| 5 | hervorragend / excellent |

BFE assigns class from `MSTRAHLUNG`. On all 10,071,755 rows: `GSTRAHLUNG = round(MSTRAHLUNG × FLAECHE)` and `STROMERTRAG = round(0.16 × GSTRAHLUNG)`. Radiation and kWh columns are therefore **not features**.

### Features (no leakage)

| API field | Source | Why it is valid |
| --- | --- | --- |
| `latitude`, `longitude` | `SHAPE` (EPSG:2056 → 4326) | Location causes climate; user clicks a map |
| `roof_area_m2` | `FLAECHE` | Physical area; class is per-m² irradiation |
| `slope_deg` | `NEIGUNG` | Roof pitch; a cause of irradiation |
| `aspect_deg` | `AUSRICHTUNG` | Orientation (0 = south). Pipeline also adds `sin`/`cos` |

Rejected: `MSTRAHLUNG`, `GSTRAHLUNG`, `STROMERTRAG` and thermal-yield columns.

### Model

One `sklearn.pipeline.Pipeline`: `AspectTrig` → median `SimpleImputer` inside a `ColumnTransformer` → `RandomForestClassifier(n_estimators=100, max_depth=16, min_samples_leaf=5, random_state=42)`.

Split: 80,000 train / 20,000 test, stratified, `random_state=42`.  
Baseline: `DummyClassifier(strategy="most_frequent")` (always class 3).

Artifact: `model/model_pipeline.joblib` (20.437 MB, `joblib` compress=3). sklearn **1.9.1**, trained **2026-09-21**.

---

## Evaluation (from `model/metrics.json` only)

| Metric | Value |
| --- | ---: |
| Test accuracy | **0.67395** |
| Test macro-F1 | **0.67446** |
| Majority baseline accuracy | **0.29005** |
| Baseline macro-F1 | **0.08993** |

Per-class test scores:

| Class | Precision | Recall | F1 | Support |
| ---: | ---: | ---: | ---: | ---: |
| 1 gering | 0.913 | 0.570 | 0.702 | 3059 |
| 2 mittel | 0.741 | 0.588 | 0.656 | 4234 |
| 3 gut | 0.616 | 0.721 | 0.664 | 5801 |
| 4 sehr gut | 0.630 | 0.757 | 0.688 | 5213 |
| 5 hervorragend | 0.666 | 0.660 | 0.663 | 1693 |

Feature importances (after aspect sin/cos): `aspect_cos` 0.253, `slope_deg` 0.232, `aspect_deg` 0.157, `latitude` 0.111, `longitude` 0.087, `aspect_sin` 0.083, `roof_area_m2` 0.077.

Accuracy is well above 29%. Class 5 is not ignored (F1 0.66). Class 1 recall is lower because north-facing / steep roofs overlap with class 2–3 once shading is missing.

---

## Setup

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

**Windows**

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

### Data (once, ~823 MB)

Skip this if `data/processed/roofs_sample.csv` is already present.

```bash
mkdir -p data/raw
curl -L -o data/raw/solarenergie-eignung-daecher_2056_generalized.gdb.zip \
  https://data.geo.admin.ch/ch.bfe.solarenergie-eignung-daecher/solarenergie-eignung-daecher/solarenergie-eignung-daecher_2056_generalized.gdb.zip
python -m training.prepare_data
python -m training.train_model
```

`prepare_data.py` and `train_model.py` are **offline jobs**. The API process must never run them.

---

## Run the API + web app

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

| URL | What |
| --- | --- |
| http://127.0.0.1:8000/ | JSON description |
| http://127.0.0.1:8000/health | Liveness |
| http://127.0.0.1:8000/docs | Swagger (screenshot #1) |
| http://127.0.0.1:8000/app/ | Web app (screenshot #2) |

### Example request (real test-fold roof from `metrics.json`)

```bash
curl -s http://127.0.0.1:8000/health
curl -s -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"latitude":46.2082020655381,"longitude":6.999643828338436,"roof_area_m2":54.5705322466076,"slope_deg":15,"aspect_deg":-3}'
```

True class of that roof was **4**. The saved pipeline predicted **5** (south-facing, 15° slope — neighbouring classes).

Invalid input (outside training range) must return **422**:

```bash
curl -s -o /dev/stderr -w "%{http_code}\n" -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"latitude":0,"longitude":0,"roof_area_m2":40,"slope_deg":30,"aspect_deg":0}'
```

---

## Screenshots for submission

**#1 `/docs`:** open http://127.0.0.1:8000/docs → expand `POST /predict` → Try it out → Execute. Capture the endpoint, example body, and response together.

**#2 Web app:** open http://127.0.0.1:8000/app/ → “Load a real test roof” (or click the map and fill area/slope/aspect) → PREDICT SOLAR POTENTIAL. Capture the filled form, map marker, predicted class, and probability bars.

---

## Limitations

- Official `MSTRAHLUNG` includes **shading** from the digital surface model. That surface is not in the attribute table, so the model cannot reconstruct a neighbour’s tree.
- This product is the **generalized** MultiPoint layer, not the 1.4 GB polygon FileGDB.
- Training uses 100,000 of 10,071,755 roofs (0.993%), stratified by class, seed 42.
- Adjacent classes mix (especially 1↔2 and 4↔5). That is expected without shading.
- Pydantic min/max are the **training fold** ranges. A click slightly outside that box returns 422.

---

## Folder map

| Path | Role |
| --- | --- |
| `training/prepare_data.py` | FileGDB → 100k CSV + manifest |
| `training/train_model.py` | CSV → `model_pipeline.joblib` + `metrics.json` |
| `training/features.py` | `AspectTrig` (must be importable when the joblib loads) |
| `app/main.py` | FastAPI; loads artifact once |
| `app/schemas.py` | Pydantic v2; bounds from `metrics.json` |
| `frontend/` | HTML/CSS/JS + Leaflet |
| `model/` | Artifact + metrics (API never writes these) |
| `visuals/` | Country / city / canton maps |
