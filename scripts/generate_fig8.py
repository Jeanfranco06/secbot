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

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11.5, 4.8), dpi=300)

# Datos de Escalamiento Real (JMeter)
users = [10, 30, 60, 100, 150]
throughput = [77.6, 201.0, 245.5, 276.7, 93.1]
lat_avg = [13.8, 24.7, 109.8, 322.4, 2373.5]
lat_p95 = [20.0, 39.0, 290.0, 511.0, 10011.0]
error_pct = [0.0, 0.0, 0.0, 0.0, 21.74]

# PANEL 1: Throughput y Tasa de Error
color1 = '#1E40AF'
ax1.plot(users, throughput, marker='o', linewidth=2.0, color=color1, label='Throughput (Req/s)', zorder=4)
ax1.set_xlabel('Usuarios Virtuales Concurrentes (Threads)', fontweight='bold')
ax1.set_ylabel('Throughput (Transacciones/segundo)', color=color1, fontweight='bold')
ax1.tick_params(axis='y', labelcolor=color1)
ax1.set_ylim(0, 330)
ax1.grid(True)

# Eje secundario para Error %
ax1_err = ax1.twinx()
color_err = '#DC2626'
ax1_err.plot(users, error_pct, marker='s', linestyle='--', linewidth=1.8, color=color_err, label='Tasa de Error (%)', zorder=5)
ax1_err.set_ylabel('Tasa de Error (%)', color=color_err, fontweight='bold')
ax1_err.tick_params(axis='y', labelcolor=color_err)
ax1_err.set_ylim(-2, 30)

ax1.set_title('(a) Curva de Capacidad y Punto de Quiebre\nMódulo de Detección y Análisis de Phishing', fontweight='bold', pad=10)

# Punto de saturación anotado
ax1.annotate('Punto de Quiebre\n(150 usuarios, 21.7% timeout)', xy=(150, 93.1), xytext=(85, 120),
             arrowprops=dict(facecolor='#DC2626', edgecolor='#DC2626', arrowstyle='->', lw=1.5),
             fontsize=8.5, fontweight='bold', color='#991B1B')

# PANEL 2: Latencia (Avg vs P95) en escala logarítmica
ax2.plot(users, lat_avg, marker='^', linewidth=1.8, color='#047857', label='Latencia Promedio (ms)')
ax2.plot(users, lat_p95, marker='d', linewidth=1.8, color='#D97706', label='Percentil 95 - P95 (ms)')
ax2.set_xlabel('Usuarios Virtuales Concurrentes (Threads)', fontweight='bold')
ax2.set_ylabel('Tiempo de Respuesta (ms) [Escala Logarítmica]', fontweight='bold')
ax2.set_yscale('log')
ax2.set_title('(b) Perfil de Latencia y Degradación en Cola\n(Tiempos Promedio vs. P95)', fontweight='bold', pad=10)
ax2.grid(True, which="both")
ax2.legend(loc='upper left', framealpha=0.9)

# Anotación SLA 500ms
ax2.axhline(500, color='#6B7280', linestyle=':', linewidth=1.2, label='Umbral SLA (500 ms)')
ax2.text(12, 550, 'Límite SLA Recomendado (500 ms)', fontsize=8.0, color='#4B5563', style='italic')

plt.tight_layout()
out_path = "docs/research/figures/fig8_jmeter_phishing_performance.png"
plt.savefig(out_path, dpi=300, bbox_inches='tight')
print(f"Figura científica guardada en {out_path}")
