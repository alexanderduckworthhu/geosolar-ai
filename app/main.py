"""GeoSolar AI API. Loads model/model_pipeline.joblib once. Never retrains."""

from __future__ import annotations

import json
from contextlib import asynccontextmanager
from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from app.schemas import ApiInfo, HealthResponse, PredictResponse, roof_features_model
from training.features import FEATURE_COLUMNS

ROOT = Path(__file__).resolve().parents[1]
ARTIFACT = ROOT / "model" / "model_pipeline.joblib"
METRICS_PATH = ROOT / "model" / "metrics.json"
FRONTEND = ROOT / "frontend"


def _load_metrics() -> dict:
    if not METRICS_PATH.exists():
        raise RuntimeError("Missing model/metrics.json. Run: python -m training.train_model")
    return json.loads(METRICS_PATH.read_text())


@asynccontextmanager
async def lifespan(app: FastAPI):
    if not ARTIFACT.exists():
        raise RuntimeError(
            "Missing model/model_pipeline.joblib. Run: python -m training.train_model"
        )
    app.state.metrics = _load_metrics()
    app.state.model = joblib.load(ARTIFACT)
    app.state.RoofFeatures = roof_features_model(app.state.metrics)
    yield
    app.state.model = None


app = FastAPI(
    title="GeoSolar AI",
    description=(
        "Swiss rooftop solar suitability (Sonnendach.ch KLASSE 1–5). "
        "The API only loads a saved sklearn Pipeline; it never trains. "
        "Request bounds are the training-fold min/max from model/metrics.json."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", response_model=ApiInfo)
def root():
    metrics = app.state.metrics
    return ApiInfo(
        name="GeoSolar AI",
        version="1.0.0",
        target="KLASSE 1–5 (gering → hervorragend)",
        features=list(metrics["feature_list"]),
        endpoints={
            "GET /": "API description",
            "GET /health": "liveness + model loaded",
            "GET /metrics": "training metrics.json",
            "POST /predict": "suitability class + probabilities",
            "GET /docs": "Swagger UI",
            "GET /app/": "web form + Leaflet map",
        },
    )


@app.get("/health", response_model=HealthResponse)
def health():
    metrics = app.state.metrics
    return HealthResponse(
        status="ok",
        model_loaded=app.state.model is not None,
        sklearn_version=metrics.get("sklearn_version"),
        n_features=len(metrics.get("feature_list", [])),
    )


@app.get("/metrics")
def metrics():
    return app.state.metrics


@app.post("/predict", response_model=PredictResponse)
def predict(payload: dict):
    RoofFeatures = app.state.RoofFeatures
    try:
        row = RoofFeatures.model_validate(payload)
    except ValidationError as exc:
        raise HTTPException(status_code=422, detail=exc.errors()) from exc

    data = row.model_dump()
    X = pd.DataFrame([data], columns=FEATURE_COLUMNS)
    model = app.state.model
    pred = int(model.predict(X)[0])
    proba = model.predict_proba(X)[0]
    labels = app.state.metrics["class_labels"]
    classes = [int(c) for c in model.classes_]
    return PredictResponse(
        klasse=pred,
        label=labels[str(pred)],
        probabilities={str(c): float(p) for c, p in zip(classes, proba)},
    )


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    roof = app.state.RoofFeatures.model_json_schema()
    schema.setdefault("components", {}).setdefault("schemas", {})["RoofFeatures"] = roof
    schema["paths"]["/predict"]["post"]["requestBody"] = {
        "required": True,
        "content": {
            "application/json": {
                "schema": {"$ref": "#/components/schemas/RoofFeatures"},
                "example": app.state.metrics["example_input"],
            }
        },
    }
    app.openapi_schema = schema
    return app.openapi_schema


app.openapi = custom_openapi
app.mount("/app", StaticFiles(directory=str(FRONTEND), html=True), name="frontend")
