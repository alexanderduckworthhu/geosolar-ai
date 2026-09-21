# GeoSolar AI — Swiss Rooftop Solar Potential Predictor

Student project for **DIT323 Artificial Intelligence as a Service**.  
Predicts the official Sonnendach.ch roof suitability class (`KLASSE` 1–5) from location and roof geometry. The FastAPI process **never retrains**; it only loads `model/model_pipeline.joblib`.

Dataset: *Eignung von Hausdächern für die Nutzung von Sonnenenergie*, Swiss Federal Office of Energy (BFE / SFOE). Full inspection is in [`DATASET_REPORT.md`](DATASET_REPORT.md).

## Why these features (and not radiation)

Official `KLASSE` is assigned from `MSTRAHLUNG`. On all 10,071,755 roofs:

- `GSTRAHLUNG = round(MSTRAHLUNG × FLAECHE)`
- `STROMERTRAG = round(0.16 × GSTRAHLUNG)`

So radiation / kWh yield as an input would leak the target. Inputs are only what a visitor can click or type: latitude, longitude, roof area, slope, aspect.

## Setup (macOS / Linux)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Setup (Windows)

```bat
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

## Data (once)

The generalized annual FileGDB is not in git (~823 MB). SHA-256 must match STAC `d5cabc1e55ac7b470e8a5905df866c915e464bdcb7d05f395aac3df11100afec`.

```bash
mkdir -p data/raw
curl -L -o data/raw/solarenergie-eignung-daecher_2056_generalized.gdb.zip \
  https://data.geo.admin.ch/ch.bfe.solarenergie-eignung-daecher/solarenergie-eignung-daecher/solarenergie-eignung-daecher_2056_generalized.gdb.zip
```

## Train (do not run this in the API process)

```bash
python -m training.prepare_data
python -m training.train_model
```

`prepare_data.py` draws **100,000** roofs stratified by `KLASSE` with `random_state=42`, converts EPSG:2056 MultiPoint coordinates with `pyproj` (`always_xy=True`) to WGS84, and writes `data/processed/roofs_sample.csv`.

`train_model.py` fits one `sklearn.pipeline.Pipeline` (aspect sin/cos → median imputer → `RandomForestClassifier`) and writes:

- `model/model_pipeline.joblib` (compressed)
- `model/metrics.json` (the only source of reported scores)

## Run the API + web app

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

| URL | What |
| --- | --- |
| http://127.0.0.1:8000/app/ | Leaflet form |
| http://127.0.0.1:8000/docs | Swagger |
| http://127.0.0.1:8000/health | Liveness |
| `POST /predict` | Class + probabilities |

Example (replace numbers from `model/metrics.json` → `example_input` after training):

```bash
curl -s http://127.0.0.1:8000/health
curl -s -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d @- <<'EOF'
{"latitude": 46.8, "longitude": 8.2, "roof_area_m2": 40, "slope_deg": 30, "aspect_deg": 0}
EOF
```

## Metrics

Filled from `model/metrics.json` after a real training run. Do not type scores by hand.

<!-- METRICS_START -->
Training has not been recorded in this README yet.
<!-- METRICS_END -->

## Honest limit

Official irradiation includes **shading** from the digital surface model. That is not in the attribute table, so this model learns climate + typical roof geometry, not the neighbour’s tree.

## Visuals

See [`visuals/README.md`](visuals/README.md) for country, city, and canton maps built from the same official roofs.
