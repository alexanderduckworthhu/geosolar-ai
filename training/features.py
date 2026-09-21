"""Deterministic feature transforms used at train time and unpickled at API time.

Must live in a real module (not __main__) so joblib can reload the pipeline.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

FEATURE_COLUMNS = [
    "latitude",
    "longitude",
    "roof_area_m2",
    "slope_deg",
    "aspect_deg",
]


class AspectTrig(BaseEstimator, TransformerMixin):
    """Add sin/cos of aspect_deg so 180° and -180° are close. Not leakage."""

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        if isinstance(X, pd.DataFrame):
            df = X.copy()
        else:
            df = pd.DataFrame(np.asarray(X), columns=FEATURE_COLUMNS)
        rad = np.deg2rad(df["aspect_deg"].astype(float))
        df["aspect_sin"] = np.sin(rad)
        df["aspect_cos"] = np.cos(rad)
        return df

    def get_feature_names_out(self, input_features=None):
        cols = list(input_features) if input_features is not None else FEATURE_COLUMNS
        return np.array(list(cols) + ["aspect_sin", "aspect_cos"])
