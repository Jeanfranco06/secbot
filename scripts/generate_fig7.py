import json
import matplotlib.pyplot as plt
import numpy as np

# Estilo científico formal Q1
plt.rcParams['figure.facecolor'] = 'white'
plt.rcParams['axes.facecolor'] = 'white'
plt.rcParams['font.sans-serif'] = 'Arial'
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 9.5
plt.rcParams['axes.edgecolor'] = '#333333'
plt.rcParams['axes.linewidth'] = 0.8
plt.rcParams['grid.color'] = '#E5E7EB'
plt.rcParams['grid.linestyle'] = '--'
plt.rcParams['grid.alpha'] = 0.7

with open("docs/research/benchmark/public_benchmark_results.json", "r", encoding="utf-8") as f:
    data = json.load(f)

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.5), dpi=300)

# PANEL 1: Dispersión y Regresión (Tiempo vs Tamaño de Data)
timing = data["timing_records"]
chars = [t["chars"] for t in timing]
latencies = [t["latency_ms"] for t in timing]

# Distinguir entre ejecuciones por reglas (sub-milisegundo) y LLM
colors = ['#10B981' if l < 10 else '#3B82F6' for l in latencies]

ax1.scatter(chars, latencies, c=colors, alpha=0.85, edgecolors='black', linewidth=0.5, s=45, zorder=3)

# Regresión sobre inferencias LLM
llm_chars = [c for c, l in zip(chars, latencies) if l >= 10]
llm_lats = [l for l in latencies if l >= 10]
if llm_chars:
    z = np.polyfit(llm_chars, llm_lats, 1)
    p = np.poly1d(z)
    x_line = np.linspace(min(chars), max(chars), 100)
    ax1.plot(x_line, p(x_line), color='#EF4444', linestyle='-', linewidth=1.8, label=f'Tendencia LLM: {z[0]:.2f} ms/char', zorder=4)

ax1.set_title("(a) Validación Empírica: Latencia vs. Longitud del Payload\n\"El tiempo es relativo y en función de la Data\"", fontsize=10, fontweight='bold', pad=10)
ax1.set_xlabel("Longitud del Mensaje de Ciberseguridad (Caracteres)", fontsize=9.5, fontweight='bold')
ax1.set_ylabel("Tiempo de Inferencia / Triaje (ms)", fontsize=9.5, fontweight='bold')
ax1.grid(True)
ax1.legend(loc="upper left", framealpha=0.9)

# Anotaciones
ax1.annotate('Filtro de Reglas\n(< 1 ms)', xy=(110, 0.1), xytext=(150, 1500),
             arrowprops=dict(facecolor='#10B981', edgecolor='#10B981', arrowstyle='->', lw=1.2),
             fontsize=8.5, fontweight='bold', color='#065F46')

# PANEL 2: Rendimiento por Clase en la Fase 2 de Pruebas
categories = ["Phishing", "Compromiso", "Consulta"]
precisions = [data["metrics_by_class"]["phishing"]["precision"], 
              data["metrics_by_class"]["compromiso"]["precision"], 
              data["metrics_by_class"]["consulta"]["precision"]]
recalls = [data["metrics_by_class"]["phishing"]["recall"], 
           data["metrics_by_class"]["compromiso"]["recall"], 
           data["metrics_by_class"]["consulta"]["recall"]]
f1_scores = [data["metrics_by_class"]["phishing"]["f1_score"], 
             data["metrics_by_class"]["compromiso"]["f1_score"], 
             data["metrics_by_class"]["consulta"]["f1_score"]]

x = np.arange(len(categories))
width = 0.25

rects1 = ax2.bar(x - width, precisions, width, label='Precisión', color='#1E40AF', edgecolor='black', linewidth=0.5)
rects2 = ax2.bar(x, recalls, width, label='Recall', color='#047857', edgecolor='black', linewidth=0.5)
rects3 = ax2.bar(x + width, f1_scores, width, label='F1-Score', color='#B45309', edgecolor='black', linewidth=0.5)

ax2.set_title("(b) Rendimiento Científico en Fase 2 (15% Test Set)\nDataset Público Nazario / CEAS / Enron / NIST / CISA", fontsize=10, fontweight='bold', pad=10)
ax2.set_xticks(x)
ax2.set_xticklabels(categories, fontweight='bold')
ax2.set_ylabel("Puntuación (0.0 - 1.0)", fontsize=9.5, fontweight='bold')
ax2.set_ylim(0, 1.15)
ax2.grid(True, axis='y')
ax2.legend(loc="upper right", framealpha=0.9)

for rects in [rects1, rects2, rects3]:
    for rect in rects:
        h = rect.get_height()
        ax2.annotate(f'{h:.2f}',
                     xy=(rect.get_x() + rect.get_width() / 2, h),
                     xytext=(0, 2), textcoords="offset points",
                     ha='center', va='bottom', fontsize=7.5, fontweight='bold')

plt.tight_layout()
out_fig = "docs/research/figures/fig7_time_vs_data_public_benchmark.png"
plt.savefig(out_fig, dpi=300, bbox_inches='tight')
print(f"Gráfica científica generada en {out_fig}")
