import csv
import glob
import os
from pathlib import Path
import numpy as np

RESULTS_DIR = Path("ops/jmeter/phishing_analysis/results")

def analyze_jtl(filepath):
    elapsed_list = []
    error_count = 0
    total_count = 0
    timestamps = []
    
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            total_count += 1
            if row["success"].lower() != "true":
                error_count += 1
            elapsed = float(row["elapsed"])
            elapsed_list.append(elapsed)
            timestamps.append(int(row["timeStamp"]))
            
    if not elapsed_list:
        return None
        
    duration_sec = (max(timestamps) - min(timestamps)) / 1000.0 if len(timestamps) > 1 else 1.0
    throughput = total_count / duration_sec if duration_sec > 0 else 0.0
    
    arr = np.array(elapsed_list)
    return {
        "file": filepath.name,
        "total": total_count,
        "success": total_count - error_count,
        "errors": error_count,
        "error_pct": (error_count / total_count) * 100.0,
        "avg": np.mean(arr),
        "median_p50": np.median(arr),
        "p90": np.percentile(arr, 90),
        "p95": np.percentile(arr, 95),
        "p99": np.percentile(arr, 99),
        "min": np.min(arr),
        "max": np.max(arr),
        "throughput": throughput,
        "duration_sec": duration_sec
    }

def main():
    files = sorted(RESULTS_DIR.glob("*.jtl"))
    results = []
    for f in files:
        data = analyze_jtl(f)
        if data:
            results.append(data)
            
    print(f"{'Archivo / Escenario':<28} | {'U':<3} | {'Total':<6} | {'Err%':<6} | {'Avg(ms)':<7} | {'P50':<6} | {'P90':<6} | {'P95':<6} | {'P99':<6} | {'Throughput':<10}")
    print("-" * 105)
    for r in results:
        # Extraer usuarios aproximados del nombre
        name = r["file"]
        u = "1"
        if "10u" in name: u = "10"
        elif "25u" in name: u = "25"
        elif "30u" in name: u = "30"
        elif "40u" in name: u = "40"
        elif "50u" in name: u = "50"
        elif "60u" in name: u = "60"
        elif "100u" in name: u = "100"
        elif "150u" in name: u = "150"
        
        print(f"{name:<28} | {u:<3} | {r['total']:<6} | {r['error_pct']:<5.2f}% | {r['avg']:<7.1f} | {r['median_p50']:<6.1f} | {r['p90']:<6.1f} | {r['p95']:<6.1f} | {r['p99']:<6.1f} | {r['throughput']:<7.1f} req/s")

if __name__ == "__main__":
    main()
