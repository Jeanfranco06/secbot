"""Generación de reportes PDF/Word/Excel con límite de tamaño y expiración."""
import logging
import os
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable

from docx import Document as DocxDocument
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

from app.config import settings
from app.services import metrics

log = logging.getLogger(__name__)

EXPORT_DIR = Path(settings.export_dir)
EXPORT_DIR.mkdir(parents=True, exist_ok=True)


def _filename(prefix: str, ext: str) -> Path:
    stamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    return EXPORT_DIR / f"{prefix}_{stamp}_{uuid.uuid4().hex[:6]}.{ext}"


def _enforce_size_limit(path: Path) -> None:
    size_mb = path.stat().st_size / (1024 * 1024)
    if size_mb > settings.export_max_size_mb:
        path.unlink(missing_ok=True)
        raise RuntimeError(f"Reporte excede {settings.export_max_size_mb} MB")


def _rows_from_summary(s: dict):
    yield ["Métrica", "Valor"]
    yield ["Consultas totales", s.get("total_queries", 0)]
    yield ["Resueltas sin escalar", s.get("resolved_without_escalation", 0)]
    yield ["Incidentes reportados", s.get("incidents_reported", 0)]
    yield ["Tasa de escalamiento (%)", f"{s.get('escalation_rate', 0):.2f}%" if isinstance(s.get("escalation_rate"), (int, float)) else s.get("escalation_rate", "0%")]
    yield ["Latencia promedio (ms)", f"{s.get('avg_latency_ms', 0):.1f} ms" if isinstance(s.get("avg_latency_ms"), (int, float)) else s.get("avg_latency_ms", "0 ms")]
    yield ["Latencia p95 (ms)", f"{s.get('p95_latency_ms', 0):.1f} ms" if isinstance(s.get("p95_latency_ms"), (int, float)) else s.get("p95_latency_ms", "0 ms")]
    yield ["Cobertura de citas (%)", f"{s.get('citation_coverage', 0):.1f}%" if isinstance(s.get("citation_coverage"), (int, float)) else s.get("citation_coverage", "0%")]
    yield ["Horas ahorradas", f"{s.get('hours_saved', 0):.1f} h" if isinstance(s.get("hours_saved"), (int, float)) else s.get("hours_saved", "0 h")]


def _topics_table(s: dict):
    yield ["Tema", "Consultas"]
    for t in s.get("top_topics", []):
        yield [t.get("topic", "-"), t.get("n", 0)]


def _tickets_status(s: dict):
    yield ["Estado", "Cantidad"]
    for k, v in s.get("tickets_by_status", {}).items():
        yield [str(k).replace("_", " ").title(), v]


def _tickets_severity(s: dict):
    yield ["Severidad", "Cantidad"]
    for k, v in s.get("tickets_by_severity", {}).items():
        yield [str(k).upper(), v]


def _queries_by_day(s: dict):
    yield ["Día", "Consultas"]
    for d in s.get("queries_by_day", []):
        yield [d.get("day", "-"), d.get("count", 0)]


def _pdf_table(data, col_widths=None):
    t = Table(data, colWidths=col_widths, hAlign="LEFT")
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E293B")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 10),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 6),
        ("TOPPADDING", (0, 0), (-1, 0), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 1), (-1, -1), 9),
        ("TOPPADDING", (0, 1), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 1), (-1, -1), 5),
        ("LINEBELOW", (0, -1), (-1, -1), 1, colors.HexColor("#CBD5E1")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F8FAFC")]),
    ]))
    return t


def export_pdf(report_type: str, s: dict) -> Path:
    path = _filename(f"report_{report_type}", "pdf")
    styles = getSampleStyleSheet()

    # Custom typography styles
    title_style = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#0F172A"),
        alignment=0,
    )
    subtitle_style = ParagraphStyle(
        "CustomSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748B"),
    )
    heading_style = ParagraphStyle(
        "CustomH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=17,
        textColor=colors.HexColor("#1E293B"),
        spaceBefore=14,
        spaceAfter=6,
    )

    tipo_nombre = "Operativo" if report_type == "operational" else "Gerencial de Ciberseguridad"
    story = [
        Paragraph(f"SecBot — Informe {tipo_nombre}", title_style),
        Paragraph(f"Generado automáticamente el {datetime.utcnow():%Y-%m-%d %H:%M UTC} | Sistema de Auditoría y Métricas", subtitle_style),
        Spacer(1, 8),
        HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#4F46E5"), spaceAfter=14),
    ]

    sections = [
        ("Resumen Ejecutivo y Métricas de Rendimiento", _rows_from_summary, [260, 240]),
        ("Temas Frecuentes y Categorías Consultadas", _topics_table, [300, 200]),
        ("Distribución de Tickets por Estado Operativo", _tickets_status, [250, 250]),
        ("Incidentes de Seguridad por Nivel de Severidad", _tickets_severity, [250, 250]),
        ("Volumen Diario de Consultas Atendidas", _queries_by_day, [250, 250]),
    ]

    for title, gen, widths in sections:
        data = list(gen(s))
        story.append(Paragraph(title, heading_style))
        story.append(_pdf_table(data, widths))
        story.append(Spacer(1, 10))

    SimpleDocTemplate(
        str(path),
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36,
    ).build(story)

    _enforce_size_limit(path)
    return path


def export_docx(report_type: str, s: dict) -> Path:
    path = _filename(f"report_{report_type}", "docx")
    doc = DocxDocument()

    tipo_nombre = "Operativo" if report_type == "operational" else "Gerencial de Ciberseguridad"

    title_p = doc.add_paragraph()
    title_run = title_p.add_run(f"SecBot — Informe {tipo_nombre}")
    title_run.font.name = "Arial"
    title_run.font.size = Pt(20)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(15, 23, 42)

    sub_p = doc.add_paragraph(f"Generado el {datetime.utcnow():%Y-%m-%d %H:%M UTC} | Sistema de Métricas y Cumplimiento")
    sub_p.runs[0].font.size = Pt(10)
    sub_p.runs[0].font.color.rgb = RGBColor(100, 116, 139)

    def add_table(title, rows):
        h = doc.add_heading(title, level=1)
        for r in h.runs:
            r.font.name = "Arial"
            r.font.size = Pt(13)
            r.font.color.rgb = RGBColor(30, 41, 59)

        rows = list(rows)
        if not rows:
            return
        table = doc.add_table(rows=0, cols=len(rows[0]))
        table.style = "Table Grid"

        for i, row in enumerate(rows):
            cells = table.add_row().cells
            for j, val in enumerate(row):
                cells[j].text = str(val)
                p = cells[j].paragraphs[0]
                for r in p.runs:
                    r.font.name = "Arial"
                    if i == 0:
                        r.bold = True
                        r.font.size = Pt(10)
                        r.font.color.rgb = RGBColor(15, 23, 42)
                    else:
                        r.font.size = Pt(9.5)
                        r.font.color.rgb = RGBColor(51, 65, 85)

    add_table("Resumen Ejecutivo", _rows_from_summary(s))
    add_table("Temas Frecuentes", _topics_table(s))
    add_table("Tickets por Estado", _tickets_status(s))
    add_table("Tickets por Severidad", _tickets_severity(s))
    add_table("Consultas por Día", _queries_by_day(s))

    doc.save(str(path))
    _enforce_size_limit(path)
    return path


def export_xlsx(report_type: str, s: dict) -> Path:
    path = _filename(f"report_{report_type}", "xlsx")
    wb = Workbook()

    header_font = Font(name="Arial", size=10, bold=True, color="FFFFFF")
    header_fill = PatternFill("solid", fgColor="1E293B")
    data_font = Font(name="Arial", size=10, color="0F172A")
    alt_fill = PatternFill("solid", fgColor="F8FAFC")
    thin_border = Border(
        left=Side(style="thin", color="E2E8F0"),
        right=Side(style="thin", color="E2E8F0"),
        top=Side(style="thin", color="E2E8F0"),
        bottom=Side(style="thin", color="E2E8F0"),
    )

    def add_sheet(name, rows):
        ws = wb.create_sheet(title=name[:31])
        rows = list(rows)
        for row_idx, row in enumerate(rows, start=1):
            ws.append(row)
            is_header = row_idx == 1
            for col_idx in range(1, len(row) + 1):
                cell = ws.cell(row=row_idx, column=col_idx)
                cell.border = thin_border
                if is_header:
                    cell.font = header_font
                    cell.fill = header_fill
                    cell.alignment = Alignment(horizontal="left", vertical="center")
                else:
                    cell.font = data_font
                    if row_idx % 2 == 0:
                        cell.fill = alt_fill

        for col in range(1, len(rows[0]) + 1):
            col_letter = chr(64 + col)
            ws.column_dimensions[col_letter].width = 30

    wb.remove(wb.active)
    add_sheet("Resumen Ejecutivo", _rows_from_summary(s))
    add_sheet("Temas Frecuentes", _topics_table(s))
    add_sheet("Estado de Tickets", _tickets_status(s))
    add_sheet("Severidad de Tickets", _tickets_severity(s))
    add_sheet("Consultas por Dia", _queries_by_day(s))

    wb.save(str(path))
    _enforce_size_limit(path)
    return path


def cleanup_expired() -> int:
    """Elimina archivos expirados del directorio de exportación."""
    cutoff = datetime.utcnow() - timedelta(days=settings.export_max_age_days)
    removed = 0
    for f in EXPORT_DIR.iterdir():
        try:
            if f.is_file() and datetime.utcfromtimestamp(f.stat().st_mtime) < cutoff:
                f.unlink()
                removed += 1
        except Exception as e:
            log.warning("cleanup_failed", extra={"file": str(f), "err": str(e)})
    return removed


EXPORTERS = {"pdf": export_pdf, "docx": export_docx, "xlsx": export_xlsx}
