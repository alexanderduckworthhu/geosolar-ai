#!/usr/bin/env python3
"""Sample CSV → sklearn Pipeline artifact + model/metrics.json.

Never retrains at API time. Reloads the artifact in-process after dump,
then a second check runs from a fresh Python process.
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

import joblib
import pandas as pd
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_recall_fscore_support,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from training.features import FEATURE_COLUMNS, AspectTrig

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "data" / "processed" / "roofs_sample.csv"
MODEL_DIR = ROOT / "model"
ARTIFACT = MODEL_DIR / "model_pipeline.joblib"
METRICS = MODEL_DIR / "metrics.json"

TARGET = "klasse"
SEED = 42
RF_PARAMS = {
    "n_estimators": 100,
    "max_depth": 16,
    "min_samples_leaf": 5,
    "n_jobs": -1,
    "random_state": SEED,
}

CLASS_LABELS = {
    1: "gering / low",
    2: "mittel / medium",
    3: "gut / good",
    4: "sehr gut / very good",
    5: "hervorragend / excellent",
}

PIPELINE_NUMERIC = FEATURE_COLUMNS + ["aspect_sin", "aspect_cos"]


def build_pipeline() -> Pipeline:
    return Pipeline(
        steps=[
            ("aspect_trig", AspectTrig()),
            (
                "impute",
                ColumnTransformer(
                    transformers=[
                        (
                            "num",
                            SimpleImputer(strategy="median"),
                            PIPELINE_NUMERIC,
                        )
                    ],
                    remainder="drop",
                ),
            ),
            ("rf", RandomForestClassifier(**RF_PARAMS)),
        ]
    )


def main() -> None:
    if not CSV_PATH.exists():
        raise SystemExit(f"Missing {CSV_PATH}. Run: python -m training.prepare_data")
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    df = pd.read_csv(CSV_PATH)
    X = df[FEATURE_COLUMNS]
    y = df[TARGET].astype(int)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, stratify=y, random_state=SEED
    )

    dummy = DummyClassifier(strategy="most_frequent", random_state=SEED)
    dummy.fit(X_train, y_train)
    y_dummy = dummy.predict(X_test)
    baseline_accuracy = float(accuracy_score(y_test, y_dummy))
    baseline_macro_f1 = float(f1_score(y_test, y_dummy, average="macro", zero_division=0))
    majority_class = int(y_train.mode().iloc[0])

    pipe = build_pipeline()
    pipe.fit(X_train, y_train)
    y_pred = pipe.predict(X_test)
    classes = [int(c) for c in pipe.named_steps["rf"].classes_]

    acc = float(accuracy_score(y_test, y_pred))
    macro_f1 = float(f1_score(y_test, y_pred, average="macro"))
    prec, rec, f1, support = precision_recall_fscore_support(
        y_test, y_pred, labels=classes, zero_division=0
    )
    cm = confusion_matrix(y_test, y_pred, labels=classes).tolist()
    importances = pipe.named_steps["rf"].feature_importances_
    per_class = {}
    for i, c in enumerate(classes):
        per_class[str(c)] = {
            "label": CLASS_LABELS[c],
            "precision": float(prec[i]),
            "recall": float(rec[i]),
            "f1": float(f1[i]),
            "support": int(support[i]),
        }

    train_ranges = {
        col: {"min": float(X_train[col].min()), "max": float(X_train[col].max())}
        for col in FEATURE_COLUMNS
    }

    example_idx = int(X_test.index[0])
    example_input = {col: float(X_test.loc[example_idx, col]) for col in FEATURE_COLUMNS}
    example_true = int(y_test.loc[example_idx])

    print(
        classification_report(
            y_test,
            y_pred,
            labels=classes,
            target_names=[CLASS_LABELS[c] for c in classes],
        )
    )
    print(
        f"baseline_accuracy={baseline_accuracy:.4f}  "
        f"test_accuracy={acc:.4f}  macro_f1={macro_f1:.4f}"
    )

    joblib.dump(pipe, ARTIFACT, compress=3)
    size_mb = ARTIFACT.stat().st_size / (1024 * 1024)
    print(f"wrote {ARTIFACT}  ({size_mb:.2f} MB)")

    reloaded = joblib.load(ARTIFACT)
    check = reloaded.predict(pd.DataFrame([example_input], columns=FEATURE_COLUMNS))
    print("in-process reload prediction", int(check[0]), "true", example_true)

    metrics = {
        "dataset_size": int(len(df)),
        "train_size": int(len(X_train)),
        "test_size": int(len(X_test)),
        "split": {"test_size": 0.2, "stratify": True, "random_state": SEED},
        "feature_list": FEATURE_COLUMNS,
        "pipeline_numeric_after_aspect_trig": PIPELINE_NUMERIC,
        "class_labels": {str(k): v for k, v in CLASS_LABELS.items()},
        "classes_in_model_order": classes,
        "baseline": {
            "strategy": "most_frequent",
            "accuracy": baseline_accuracy,
            "macro_f1": baseline_macro_f1,
            "predicted_class": majority_class,
        },
        "test_metrics": {
            "accuracy": acc,
            "macro_f1": macro_f1,
            "per_class": per_class,
            "confusion_matrix_labels": classes,
            "confusion_matrix": cm,
        },
        "feature_importances": {
            name: float(val) for name, val in zip(PIPELINE_NUMERIC, importances)
        },
        "feature_ranges_train": train_ranges,
        "example_input": example_input,
        "example_true_klasse": example_true,
        "sklearn_version": sklearn.__version__,
        "training_date_utc": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "artifact": "model/model_pipeline.joblib",
        "artifact_size_mb": round(size_mb, 3),
        "model": {
            "type": "RandomForestClassifier",
            "n_estimators": RF_PARAMS["n_estimators"],
            "max_depth": RF_PARAMS["max_depth"],
            "min_samples_leaf": RF_PARAMS["min_samples_leaf"],
            "random_state": SEED,
        },
    }
    METRICS.write_text(json.dumps(metrics, indent=2))
    print("wrote", METRICS)

    snippet = (
        "import sys; sys.path.insert(0, %r); "
        "import training.features, joblib, pandas as pd, json; "
        "m=joblib.load(%r); "
        "x=pd.DataFrame([%r], columns=%r); "
        "pred=int(m.predict(x)[0]); proba=m.predict_proba(x)[0].tolist(); "
        "print(json.dumps({'pred': pred, 'proba': proba}))"
        % (str(ROOT), str(ARTIFACT), example_input, FEATURE_COLUMNS)
    )
    env = os.environ.copy()
    env["PYTHONPATH"] = str(ROOT)
    proc = subprocess.run(
        [sys.executable, "-c", snippet],
        check=True,
        capture_output=True,
        text=True,
        cwd=str(ROOT),
        env=env,
    )
    print("fresh-process prediction", proc.stdout.strip())
    if proc.stderr.strip():
        print("fresh-process stderr", proc.stderr.strip())


if __name__ == "__main__":
    main()
