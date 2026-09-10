import json
from decimal import Decimal
from sklearn.ensemble import RandomForestClassifier
import numpy as np

MODEL_VERSION = "baseline-rf-1"


def _train_baseline():
    # A small synthetic baseline model. In production, replace with governed,
    # consented real historical data and model monitoring.
    X = np.array([
        [0.95, 0.02, 0.95], [0.90, 0.04, 0.90], [0.80, 0.10, 0.85],
        [0.65, 0.20, 0.70], [0.55, 0.30, 0.55], [0.35, 0.50, 0.40],
        [0.20, 0.65, 0.20], [0.10, 0.80, 0.10],
    ])
    y = np.array([0, 0, 0, 0, 1, 1, 1, 1])
    model = RandomForestClassifier(n_estimators=80, random_state=42)
    model.fit(X, y)
    return model


MODEL = _train_baseline()


def score_member(total_due: int, on_time: int, missed: int, avg_delay_days: float):
    total = max(total_due, 1)
    punctuality = min(max(on_time / total, 0), 1)
    miss_rate = min(max(missed / total, 0), 1)
    delay_quality = 1 - min(max(avg_delay_days / 30, 0), 1)
    X = np.array([[punctuality, miss_rate, delay_quality]])
    p = float(MODEL.predict_proba(X)[0, 1])
    score = round(p * 100, 2)
    level = "low" if score < 35 else "medium" if score < 65 else "high"
    factors = []
    if miss_rate >= 0.25:
        factors.append("Frequent missed contributions")
    if avg_delay_days >= 7:
        factors.append("Long average payment delay")
    if punctuality >= 0.85:
        factors.append("Strong on-time payment history")
    if not factors:
        factors.append("Mixed contribution behavior")
    return Decimal(str(score)), level, factors


def serialize_factors(factors):
    return json.dumps(factors)
