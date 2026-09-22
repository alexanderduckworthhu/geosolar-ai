"""Pydantic v2 request/response models. Feature bounds come from metrics.json."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field, create_model, field_validator


class PredictResponse(BaseModel):
    klasse: int = Field(..., ge=1, le=5, description="Official Sonnendach KLASSE 1–5")
    label: str = Field(..., description="Official German label plus English")
    probabilities: dict[str, float] = Field(
        ..., description="predict_proba for classes 1–5, keys are class codes as strings"
    )
    model_note: str = (
        "Predicted from roof geometry and location only. "
        "Does not include local shading (trees, neighbouring buildings)."
    )


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    sklearn_version: str | None = None
    n_features: int | None = None


class ApiInfo(BaseModel):
    name: str
    version: str
    target: str
    features: list[str]
    endpoints: dict[str, str]
    never_retrains: bool = True


def roof_features_model(metrics: dict[str, Any]) -> type[BaseModel]:
    """Build the request model from training-fold min/max (never invented)."""
    ranges = metrics["feature_ranges_train"]
    example = metrics["example_input"]
    field_defs: dict[str, Any] = {}
    for name in metrics["feature_list"]:
        lo = float(ranges[name]["min"])
        hi = float(ranges[name]["max"])
        field_defs[name] = (
            float,
            Field(
                ...,
                ge=lo,
                le=hi,
                description=f"Training-fold range [{lo}, {hi}]",
                examples=[float(example[name])],
            ),
        )

    class _RoofFeatures(BaseModel):
        model_config = ConfigDict(extra="forbid", json_schema_extra={"example": example})

        @field_validator("roof_area_m2", check_fields=False)
        @classmethod
        def area_positive(cls, v: float) -> float:
            if v <= 0:
                raise ValueError("roof_area_m2 must be positive")
            return v

    return create_model("RoofFeatures", __base__=_RoofFeatures, **field_defs)
