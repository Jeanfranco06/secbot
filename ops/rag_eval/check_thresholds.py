import json, sys
from pathlib import Path

THRESHOLDS = {
    "faithfulness": 0.85,
    "answer_relevancy": 0.80,
    "context_precision": 0.75,
    "context_recall": 0.80,
}

def main():
    data = json.loads(Path("ops/rag_eval/last_result.json").read_text())
    fails = []
    for metric, minv in THRESHOLDS.items():
        avg = sum(r[metric] for r in data) / len(data)
        status = "OK" if avg >= minv else "FAIL"
        print(f"{metric}: {avg:.3f} (min {minv}) {status}")
        if avg < minv:
            fails.append(metric)
    if fails:
        sys.exit(f"Métricas bajo umbral: {fails}")

if __name__ == "__main__":
    main()