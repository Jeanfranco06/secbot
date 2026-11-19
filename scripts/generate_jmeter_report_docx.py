# scripts/generate_jmeter_report_docx.py
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

OUT_DOCX = "docs/informe_practica_jmeter_secbot.docx"

doc = docx.Document()

# Márgenes
for section in doc.sections:
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.0)
    section.right_margin = Inches(1.0)

# Estilo Base
normal_style = doc.styles['Normal']
normal_style.font.name = 'Arial'
normal_style.font.size = Pt(10.5)
normal_style.font.color.rgb = RGBColor(0x22, 0x22, 0x22)
normal_style.paragraph_format.line_spacing = 1.15
normal_style.paragraph_format.space_after = Pt(4)

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=120, right=120):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def add_header(text, level=1):
    p = doc.add_paragraph()
    run = p.add_run(text)
    run.bold = True
    p.paragraph_format.keep_with_next = True
    if level == 1:
        run.font.size = Pt(16)
        run.font.color.rgb = RGBColor(0x0F, 0x4C, 0x81) # Classic Blue
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
    elif level == 2:
        run.font.size = Pt(13)
        run.font.color.rgb = RGBColor(0x1B, 0x36, 0x5D)
        p.paragraph_format.space_before = Pt(12)
        p.paragraph_format.space_after = Pt(4)
    elif level == 3:
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0x33, 0x33, 0x33)
        p.paragraph_format.space_before = Pt(8)
        p.paragraph_format.space_after = Pt(2)
    return p

# --- PORTADA / ENCABEZADO ---
title_p = doc.add_paragraph()
title_p.paragraph_format.space_before = Pt(20)
title_p.paragraph_format.space_after = Pt(4)
title_run = title_p.add_run("INFORME DE INGENIERÍA: PRUEBAS DE CARGA, ESTRÉS, POTENCIA Y RENDIMIENTO CON APACHE JMETER")
title_run.bold = True
title_run.font.size = Pt(20)
title_run.font.color.rgb = RGBColor(0x0F, 0x4C, 0x81)

sub_p = doc.add_paragraph()
sub_p.paragraph_format.space_after = Pt(14)
sub_run = sub_p.add_run("Determinación Experimental por Ensayo y Error del Número Máximo de Usuarios Concurrentes en SecBot")
sub_run.font.size = Pt(12)
sub_run.italic = True
sub_run.font.color.rgb = RGBColor(0x55, 0x55, 0x55)

# Tabla de Metadatos
meta_table = doc.add_table(rows=4, cols=2)
meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
meta_data = [
    ("Software Evaluado:", "SecBot - Asistente de Respuesta a Incidentes de Ciberseguridad"),
    ("Métrica Principal Requerida:", "Número Máximo de Usuarios Conectados Simultáneamente (Ensayo y Error)"),
    ("Herramienta de Carga:", "Apache JMeter 5.6.3 (Non-GUI / CLI Engine)"),
    ("Fecha de Experimentación:", "Noviembre 2026")
]
for i, (k, v) in enumerate(meta_data):
    row = meta_table.rows[i]
    row.cells[0].paragraphs[0].add_run(k).bold = True
    row.cells[1].paragraphs[0].add_run(v)
    set_cell_background(row.cells[0], "F0F4F8")
    set_cell_margins(row.cells[0])
    set_cell_margins(row.cells[1])

doc.add_paragraph().paragraph_format.space_after = Pt(8)

# --- 1. RESUMEN EJECUTIVO ---
add_header("1. Resumen Ejecutivo y Hallazgo Principal", level=1)
doc.add_paragraph(
    "El objetivo central de la práctica fue aplicar de manera sistemática las cuatro pruebas de desempeño "
    "(Rendimiento, Carga, Estrés y Potencia) al software SecBot, utilizando Apache JMeter para determinar por "
    "ensayo y error el dato más importante: el número máximo de usuarios conectados simultáneamente a la vez "
    "antes de alcanzar el punto de quiebre (breaking point)."
)

callout = doc.add_table(rows=1, cols=1)
callout.alignment = WD_TABLE_ALIGNMENT.CENTER
c_cell = callout.rows[0].cells[0]
set_cell_background(c_cell, "EBF5FB")
set_cell_margins(c_cell, top=140, bottom=140, left=180, right=180)
cp = c_cell.paragraphs[0]
crun_b = cp.add_run("DATO CLAVE PARA EL ARTÍCULO CIENTÍFICO:\n")
crun_b.bold = True
crun_b.font.size = Pt(11)
crun_b.font.color.rgb = RGBColor(0x1B, 0x4F, 0x72)

cp.add_run("• Número Máximo de Usuarios Simultáneos en Autenticación (CPU-Bound): ").bold = True
cp.add_run("20 Usuarios Concurrentes (0.00% tasa de error, 3.48 transacciones/s).\n")
cp.add_run("• Punto de Quiebre en Login: ").bold = True
cp.add_run("A partir de 22 usuarios la tasa de fallo sube a 22.35% y colapsa al 92.36% en 50 usuarios debido al costo computacional de hashing (bcrypt/argon2).\n")
cp.add_run("• Número Máximo de Usuarios Simultáneos en Operación Normal (/chat/history): ").bold = True
cp.add_run("100 Usuarios Concurrentes (0.00% tasa de error, 54.50 transacciones/s, 196,000 req/h).\n")
cp.add_run("• Capacidad Máxima de Red / Event Loop (GET /health): ").bold = True
cp.add_run("180 Usuarios Concurrentes (148.15 transacciones/s sostenidas).")

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# --- 2. CUMPLIMIENTO DE LAS 4 PRUEBAS REQUERIDAS ---
add_header("2. Clasificación y Resultados de las 4 Pruebas Solicitadas", level=1)

# 2.1 Rendimiento
add_header("2.1 Prueba de Rendimiento (Performance Testing / Baseline)", level=2)
doc.add_paragraph(
    "Evalúa el comportamiento del software en condiciones óptimas o de baja concurrencia, estableciendo la línea "
    "base de latencia mínima, consumo de memoria y respuesta de la red:"
)
p_table = doc.add_table(rows=4, cols=6)
p_table.alignment = WD_TABLE_ALIGNMENT.CENTER
headers = ["Endpoint", "Usuarios", "Throughput", "Media (ms)", "P95 (ms)", "Tasa Error"]
for j, h in enumerate(headers):
    cell = p_table.rows[0].cells[j]
    cell.paragraphs[0].add_run(h).bold = True
    set_cell_background(cell, "0F4C81")
    cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    set_cell_margins(cell)

perf_data = [
    ("GET /health", "50", "111.45 req/s", "391.8 ms", "862 ms", "0.00%"),
    ("GET /api/v1/chat/history", "20", "46.20 req/s", "382.1 ms", "775 ms", "0.00%"),
    ("POST /api/v1/auth/login", "10", "3.68 req/s", "2,597.2 ms", "3,055 ms", "0.00%")
]
for i, row in enumerate(perf_data):
    for j, val in enumerate(row):
        c = p_table.rows[i+1].cells[j]
        c.paragraphs[0].add_run(val)
        if i % 2 == 1:
            set_cell_background(c, "F9FBFD")
        set_cell_margins(c)

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# 2.2 Carga
add_header("2.2 Prueba de Carga (Load Testing)", level=2)
doc.add_paragraph(
    "Evalúa la estabilidad del sistema bajo la carga esperada regular sostenida (60% al 70% de la capacidad máxima):"
)
c_table = doc.add_table(rows=3, cols=6)
c_table.alignment = WD_TABLE_ALIGNMENT.CENTER
for j, h in enumerate(headers):
    cell = c_table.rows[0].cells[j]
    cell.paragraphs[0].add_run(h).bold = True
    set_cell_background(cell, "0F4C81")
    cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    set_cell_margins(cell)

load_data = [
    ("POST /api/v1/auth/login", "15", "3.56 req/s", "3,980.5 ms", "6,981 ms", "0.00%"),
    ("GET /api/v1/chat/history", "60", "52.50 req/s", "1,020.6 ms", "1,458 ms", "0.00%")
]
for i, row in enumerate(load_data):
    for j, val in enumerate(row):
        c = c_table.rows[i+1].cells[j]
        c.paragraphs[0].add_run(val)
        set_cell_margins(c)

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# 2.3 Estrés
add_header("2.3 Prueba de Estrés (Stress Testing / Ensayo y Error)", level=2)
doc.add_paragraph(
    "Consistió en incrementar paso a paso los hilos concurrentes hasta forzar al sistema más allá de su capacidad "
    "para identificar exactamente en qué punto falla y cómo se degrada. Se aplicó al módulo crítico de login:"
)
stress_table = doc.add_table(rows=9, cols=7)
stress_table.alignment = WD_TABLE_ALIGNMENT.CENTER
s_headers = ["Usuarios", "Muestras", "Throughput", "Media (ms)", "P95 (ms)", "% Error", "Estado"]
for j, h in enumerate(s_headers):
    cell = stress_table.rows[0].cells[j]
    cell.paragraphs[0].add_run(h).bold = True
    set_cell_background(cell, "0F4C81")
    cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    set_cell_margins(cell)

stress_rows = [
    ("10", "92", "3.68 req/s", "2,597.2 ms", "3,055 ms", "0.00%", "Estable"),
    ("12", "97", "3.88 req/s", "3,139.5 ms", "3,753 ms", "0.00%", "Estable"),
    ("15", "89", "3.56 req/s", "3,980.5 ms", "6,981 ms", "0.00%", "Sostenido"),
    ("18", "95", "3.80 req/s", "4,854.1 ms", "7,501 ms", "0.00%", "Zona Límite"),
    ("20", "87", "3.48 req/s", "5,231.4 ms", "8,047 ms", "0.00%", "MÁXIMO ADMISIBLE"),
    ("22", "85", "3.40 req/s", "6,781.9 ms", "10,013 ms", "22.35%", "QUIEBRE"),
    ("25", "94", "3.76 req/s", "6,807.2 ms", "10,011 ms", "5.32%", "Degradado"),
    ("50", "157", "6.28 req/s", "9,652.7 ms", "10,020 ms", "92.36%", "COLAPSO TOTAL")
]
for i, row in enumerate(stress_rows):
    for j, val in enumerate(row):
        c = stress_table.rows[i+1].cells[j]
        r = c.paragraphs[0].add_run(val)
        if "MÁXIMO" in val:
            set_cell_background(c, "D4EFDF")
            r.bold = True
        elif "QUIEBRE" in val or "COLAPSO" in val:
            set_cell_background(c, "FADBD8")
            r.bold = True
        elif i % 2 == 1:
            set_cell_background(c, "F9FBFD")
        set_cell_margins(c)

doc.add_paragraph().paragraph_format.space_after = Pt(6)

# 2.4 Potencia
add_header("2.4 Prueba de Potencia (Spike Testing / Capacidad de Absorción)", level=2)
doc.add_paragraph(
    "La prueba de potencia evalúa la resiliencia del software sometiéndolo a una ráfaga súbita de usuarios instantánea "
    "(escalando de 0 a 40 usuarios en solo 1 segundo, el doble de su capacidad nominal sostenida):"
)
doc.add_paragraph(
    "• Carga súbita inyectada: 40 usuarios concurrentes en 1 segundo de ráfaga.\n"
    "• Peticiones totales procesadas en 20 s: 101 solicitudes.\n"
    "• Throughput absorbido: 5.05 req/s.\n"
    "• Solicitudes exitosas absorbidas: 27 solicitudes (26.73%).\n"
    "• Tasa de fallo por desborde de cola: 73.27% (solicitudes expiradas por socket timeout de 10 s).\n"
    "• Conclusión de Potencia: El servidor protege la integridad de su proceso mediante encolamiento y rechazo por "
    "timeout sin causar caída ni reinicio del contenedor (crash-resilient)."
)

# --- 3. COMPARATIVA MULTI-ENDPOINT ---
add_header("3. Comparativa Global entre Endpoints (Análisis de Causa Raíz)", level=1)
doc.add_paragraph(
    "El contraste entre los tres endpoints evaluados explica con rigor científico cómo el tipo de carga condiciona la concurrencia:"
)
comp_table = doc.add_table(rows=4, cols=5)
comp_table.alignment = WD_TABLE_ALIGNMENT.CENTER
c_head = ["Endpoint", "Carga Principal", "Límite Usuarios", "Throughput Máx", "Factor de Cuello de Botella"]
for j, h in enumerate(c_head):
    cell = comp_table.rows[0].cells[j]
    cell.paragraphs[0].add_run(h).bold = True
    set_cell_background(cell, "0F4C81")
    cell.paragraphs[0].runs[0].font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
    set_cell_margins(cell)

comp_data = [
    ("POST /api/v1/auth/login", "Criptografía CPU (Bcrypt + RSA)", "20 usuarios", "3.8 req/s", "Costo deliberado de seguridad (NIST/OWASP)"),
    ("GET /api/v1/chat/history", "Persistencia SQL + JWT", "100 usuarios", "54.5 req/s", "Tamaño del Pool de Conexiones PostgreSQL (30)"),
    ("GET /health", "I/O Puro de Red", "180 usuarios", "148.2 req/s", "Capacidad monohilo de Uvicorn Event Loop")
]
for i, row in enumerate(comp_data):
    for j, val in enumerate(row):
        c = comp_table.rows[i+1].cells[j]
        c.paragraphs[0].add_run(val)
        if i % 2 == 1:
            set_cell_background(c, "F9FBFD")
        set_cell_margins(c)

doc.add_paragraph().paragraph_format.space_after = Pt(8)

# --- 4. REPOSITORIO DE EVIDENCIAS ---
add_header("4. Índice y Rutas de Evidencias en el Repositorio", level=1)
doc.add_paragraph(
    "Todas las evidencias cuantitativas, planes de ejecución y reportes interactivos se encuentran archivados localmente:"
)
doc.add_paragraph(
    "1. Planes de Prueba de JMeter (.jmx):\n"
    "   • ops/jmeter/secbot_login_stress.jmx (Plan de Autenticación y Estrés)\n"
    "   • ops/jmeter/secbot_health_stress.jmx (Plan de Red y Línea Base)\n"
    "   • ops/jmeter/secbot_history_stress.jmx (Plan de Historial y Base de Datos)\n\n"
    "2. Datos Brutos y Métricas Consolidadas (.csv y .json):\n"
    "   • ops/jmeter/runs/fine_tuning_summary.csv (Afinamiento de 12 a 22 usuarios)\n"
    "   • ops/jmeter/runs/history_summary.csv (Escalamiento de historial 20 a 150 usuarios)\n"
    "   • ops/jmeter/runs/health_summary.csv (Escalamiento de red 50 a 500 usuarios)\n"
    "   • ops/jmeter/runs/spike_summary.csv (Prueba de Potencia 40 usuarios)\n\n"
    "3. Dashboards Web HTML Interactivos de JMeter:\n"
    "   • ops/jmeter/runs/report_10u/, report_20u/, report_50u/\n"
    "   • ops/jmeter/runs/history_report_100u/, history_report_150u/\n"
    "   • ops/jmeter/runs/health_report_100u/, health_report_500u/\n"
    "   • ops/jmeter/runs/spike_report_40u/"
)

# Guardar
doc.save(OUT_DOCX)
print(f"Documento generado exitosamente en: {OUT_DOCX}")
