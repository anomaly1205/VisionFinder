"""Offline evaluation: retrieval accuracy, latency, and threshold sweep.

Positives: each catalog product's query_images (other angles, not indexed) must retrieve that product.
Negatives: every image of the holdout products (not in the catalog) should be rejected by the threshold.
Usage: python evaluate.py   -> prints markdown tables, writes eval_results.json
"""
import json
import os
import time
from collections import defaultdict

import numpy as np

from config import BACKEND, HOLDOUT_JSON, MODEL, PRETRAINED, PRODUCTS_JSON, THRESHOLD_HIGH, THRESHOLD_LOW, image_path
from embedder import load_image
from search_engine import SearchEngine

LATENCY_RUNS = 50


def load(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def main():
    products, holdout = load(PRODUCTS_JSON), load(HOLDOUT_JSON)
    eng = SearchEngine()
    assert eng.index.ntotal == len(products), "index is partial; run build_index.py without --limit"

    pos = [(p["id"], p["category"], q) for p in products for q in p["query_images"]]
    neg = sorted({img for p in holdout for img in [p["image"], *p["gallery"]]})
    print(f"{len(pos)} positive queries, {len(neg)} negative queries")

    t0 = time.perf_counter()
    D, I = eng.index.search(eng.emb.embed_images([image_path(q) for _, _, q in pos]), 5)
    Dn, _ = eng.index.search(eng.emb.embed_images([image_path(q) for q in neg]), 1)
    print(f"embedded in {time.perf_counter() - t0:.0f}s")

    truth = np.array([eng.pos[pid] for pid, _, _ in pos])
    top1 = I[:, 0] == truth
    top5 = (I == truth[:, None]).any(1)
    per_cat = defaultdict(list)
    for (_, cat, _), ok in zip(pos, top1):
        per_cat[cat].append(ok)

    # Latency: one full request path (decode + preprocess + embed + search) per query image.
    paths = [image_path(q) for _, _, q in pos[:LATENCY_RUNS]]
    eng.search_image(load_image(paths[0]))  # warm-up
    lat = []
    for p in paths:
        t = time.perf_counter()
        eng.search_image(load_image(p))
        lat.append((time.perf_counter() - t) * 1000)

    # Threshold sweep. A positive is a correct accept only if top-1 is right AND clears the bar;
    # a negative clearing the bar is a false accept. Precision counts wrong-product accepts too.
    s_pos, s_neg = D[:, 0], Dn[:, 0]
    sweep = []
    for t in np.round(np.arange(0.50, 0.95 + 1e-9, 0.025), 3):
        correct = top1 & (s_pos >= t)
        accepted = (s_pos >= t).sum() + (s_neg >= t).sum()
        sweep.append({
            "threshold": float(t),
            "correct_accept": float(correct.mean()),
            "false_accept": float((s_neg >= t).mean()),
            "precision": float(correct.sum() / accepted) if accepted else 1.0,
        })
    best = max(sweep, key=lambda r: r["correct_accept"] - r["false_accept"])
    low = min((r for r in sweep if r["precision"] >= 0.6), key=lambda r: r["threshold"], default=best)

    # Confidence levels at the configured thresholds: share of queries per level, and top-1 within it.
    def level(s):
        return np.where(s >= THRESHOLD_HIGH, "high", np.where(s >= THRESHOLD_LOW, "medium", "low"))
    lp, ln = level(s_pos), level(s_neg)
    levels = {lv: {"positive_share": float((lp == lv).mean()),
                   "positive_top1": float(top1[lp == lv].mean()) if (lp == lv).any() else None,
                   "negative_share": float((ln == lv).mean())} for lv in ("high", "medium", "low")}

    res = {
        "model": f"{MODEL}/{PRETRAINED}",
        "catalog": len(products), "positive_queries": len(pos), "negative_queries": len(neg),
        "top1": float(top1.mean()), "top5": float(top5.mean()),
        "top1_by_category": {c: {"n": len(v), "top1": float(np.mean(v))} for c, v in sorted(per_cat.items())},
        "latency_ms": {"mean": float(np.mean(lat)), "p95": float(np.percentile(lat, 95)), "runs": len(lat)},
        "threshold_sweep": sweep,
        "recommended_threshold": best["threshold"],
        "recommended_threshold_low": low["threshold"],
        "confidence_levels": {"threshold_high": THRESHOLD_HIGH, "threshold_low": THRESHOLD_LOW, **levels},
    }
    with open(os.path.join(BACKEND, "eval_results.json"), "w", encoding="utf-8") as f:
        json.dump(res, f, indent=2)

    pct = lambda x: f"{x * 100:.1f}%"
    print(f"\n| Metric | Value |\n|---|---|")
    print(f"| Top-1 accuracy | {pct(res['top1'])} |\n| Top-5 accuracy | {pct(res['top5'])} |")
    print(f"| Latency per query (CPU, mean / p95) | {res['latency_ms']['mean']:.0f} ms / {res['latency_ms']['p95']:.0f} ms |")
    print(f"| Recommended threshold | {best['threshold']} (correct accept {pct(best['correct_accept'])}, "
          f"false accept {pct(best['false_accept'])}) |")
    print(f"| Recommended low threshold (precision >= 60%) | {low['threshold']} |")
    print(f"\n| Confidence (high >= {THRESHOLD_HIGH}, medium >= {THRESHOLD_LOW}) | Catalog queries | "
          f"Top-1 correct within level | Holdout queries |\n|---|---|---|---|")
    for lv, v in levels.items():
        t1 = pct(v["positive_top1"]) if v["positive_top1"] is not None else "-"
        print(f"| {lv} | {pct(v['positive_share'])} | {t1} | {pct(v['negative_share'])} |")
    print("\n| Category | Queries | Top-1 |\n|---|---|---|")
    for c, v in res["top1_by_category"].items():
        print(f"| {c} | {v['n']} | {pct(v['top1'])} |")
    print("\n| Threshold | Correct accept | False accept | Precision |\n|---|---|---|---|")
    for r in sweep:
        mark = " **(recommended)**" if r is best else ""
        print(f"| {r['threshold']}{mark} | {pct(r['correct_accept'])} | {pct(r['false_accept'])} | {pct(r['precision'])} |")


if __name__ == "__main__":
    main()
