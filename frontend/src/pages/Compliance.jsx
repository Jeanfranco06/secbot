import { useEffect, useState } from "react";
import { complianceApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { Card, Spinner, Badge } from "@/ui";
import { Icon } from "@/components/Icon";
import "./compliance.css";

export default function Compliance() {
  const toast = useToast();
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [gapData, setGapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("matrix");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    let mounted = true;
    Promise.all([
      complianceApi.evidence().catch((e) => {
        console.error("Evidence err:", e);
        return null;
      }),
      complianceApi.gapAnalysis().catch((e) => {
        console.error("GapAnalysis err:", e);
        return null;
      }),
    ])
      .then(([evRes, gapRes]) => {
        if (!mounted) return;
        if (evRes) setData(evRes);
        if (gapRes) setGapData(gapRes);
      })
      .catch((e) => toast.error(e.message || "Error al cargar cumplimiento"))
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [toast]);

  if (loading && !data && !gapData) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <Spinner />
      </div>
    );
  }

  const rawBlocks = [
    {
      title: "ISO/IEC 27001:2022",
      subtitle: "Sistema de Gestión de Seguridad de la Información (SGSI)",
      badge: "Estándar Global",
      icon: "shield-check",
      tone: "primary",
      items: data?.iso_27001_2022 || {},
    },
    {
      title: "NIST CSF 2.0",
      subtitle: "Cybersecurity Framework (National Institute of Standards & Technology)",
      badge: "Marco de Referencia",
      icon: "shield",
      tone: "info",
      items: data?.nist_csf_2_0 || {},
    },
  ];

  return (
    <div className="container compliance-page animate-fade-in">
      {/* Header */}
      <div className="compliance-header-wrap">
        <div className="compliance-title-group">
          <div className="compliance-icon-badge">
            <Icon name="shield-check" size={24} />
          </div>
          <div>
            <h1 className="compliance-title">{t("compliance.title") || "Centro de Cumplimiento & Gap Analysis"}</h1>
            <p className="compliance-subtitle">
              Evaluación automatizada de cobertura y brechas de control frente a ISO/IEC 27001:2022 y NIST CSF 2.0
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Bar */}
      {gapData && (
        <div className="compliance-kpi-grid">
          <div className="compliance-kpi-card">
            <div className="compliance-kpi-icon kpi-score">
              <Icon name="award" size={24} />
            </div>
            <div className="compliance-kpi-info">
              <span className="compliance-kpi-val">{gapData.overall_score}%</span>
              <span className="compliance-kpi-lbl">Cumplimiento Global</span>
            </div>
          </div>

          <div className="compliance-kpi-card">
            <div className="compliance-kpi-icon kpi-compliant">
              <Icon name="check-circle" size={24} />
            </div>
            <div className="compliance-kpi-info">
              <span className="compliance-kpi-val">{gapData.compliant_count} / {gapData.total_controls}</span>
              <span className="compliance-kpi-lbl">Controles Cumplidos</span>
            </div>
          </div>

          <div className="compliance-kpi-card">
            <div className="compliance-kpi-icon kpi-partial">
              <Icon name="alert-triangle" size={24} />
            </div>
            <div className="compliance-kpi-info">
              <span className="compliance-kpi-val">{gapData.partial_count}</span>
              <span className="compliance-kpi-lbl">En Progreso / Parcial</span>
            </div>
          </div>

          <div className="compliance-kpi-card">
            <div className="compliance-kpi-icon kpi-gap">
              <Icon name="alert-circle" size={24} />
            </div>
            <div className="compliance-kpi-info">
              <span className="compliance-kpi-val">{gapData.gap_count}</span>
              <span className="compliance-kpi-lbl">Brechas Críticas (Gaps)</span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="compliance-tabs">
        <button
          type="button"
          className={`compliance-tab-btn ${activeTab === "matrix" ? "active" : ""}`}
          onClick={() => setActiveTab("matrix")}
        >
          <Icon name="grid" size={15} />
          <span>Matriz de Controles ISO 27001:2022</span>
        </button>

        <button
          type="button"
          className={`compliance-tab-btn ${activeTab === "nist" ? "active" : ""}`}
          onClick={() => setActiveTab("nist")}
        >
          <Icon name="shield" size={15} />
          <span>Marco NIST CSF 2.0</span>
        </button>

        <button
          type="button"
          className={`compliance-tab-btn ${activeTab === "gaps" ? "active" : ""}`}
          onClick={() => setActiveTab("gaps")}
        >
          <Icon name="list" size={15} />
          <span>Plan de Remediación de Brechas ({gapData?.top_actionable_gaps?.length || 0})</span>
        </button>

        <button
          type="button"
          className={`compliance-tab-btn ${activeTab === "evidence" ? "active" : ""}`}
          onClick={() => setActiveTab("evidence")}
        >
          <Icon name="database" size={15} />
          <span>Evidencias en Base de Datos</span>
        </button>
      </div>

      {/* TAB 1: Matriz ISO 27001 */}
      {activeTab === "matrix" && gapData && (
        <div className="matrix-tab-content animate-fade-in">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <span style={{ fontSize: 13, color: "var(--c-text-muted)" }}>
              Mostrando controles evaluados frente a las políticas y configuraciones de SecBot:
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              {["all", "cumplido", "parcial", "brecha"].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 6,
                    border: "1px solid",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    background: statusFilter === st ? "rgba(56, 189, 248, 0.2)" : "rgba(255,255,255,0.03)",
                    borderColor: statusFilter === st ? "#38bdf8" : "rgba(255,255,255,0.1)",
                    color: statusFilter === st ? "#38bdf8" : "var(--c-text-muted)",
                  }}
                >
                  {st === "all" ? "Todos" : st}
                </button>
              ))}
            </div>
          </div>

          {gapData.domains.map((dom, idx) => {
            const filteredControls = dom.controls.filter((c) => {
              if (statusFilter === "all") return true;
              return c.status.toLowerCase() === statusFilter;
            });

            if (filteredControls.length === 0) return null;

            return (
              <div key={idx} className="domain-card">
                <div className="domain-header">
                  <div className="domain-title-wrap">
                    <h3 className="domain-name">{dom.name}</h3>
                    <span style={{ fontSize: 12, color: "var(--c-text-muted)" }}>
                      ({filteredControls.length} controles)
                    </span>
                  </div>
                  <div className="domain-score-pill">
                    Cobertura: {dom.score}%
                  </div>
                </div>

                <div className="controls-list">
                  {filteredControls.map((ctrl) => (
                    <div
                      key={ctrl.id}
                      className={`control-item status-${ctrl.status.toLowerCase()}`}
                    >
                      <div className="control-top">
                        <div className="control-meta">
                          <span className="control-id-badge">{ctrl.id}</span>
                          <span className="control-title-text">{ctrl.title}</span>
                        </div>
                        <span className="control-status-tag">{ctrl.status}</span>
                      </div>

                      <div className="control-evidence">
                        <span className="evidence-tag">Evidencia:</span>
                        <span>{ctrl.evidence}</span>
                      </div>

                      {ctrl.recommendation && (
                        <div className="control-recom">
                          <span className="recom-tag">Acción Correctiva:</span>
                          <span>{ctrl.recommendation}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: NIST CSF 2.0 */}
      {activeTab === "nist" && gapData && (
        <div className="nist-tab-content animate-fade-in">
          <div className="nist-grid">
            {gapData.nist_csf.map((fn) => (
              <div key={fn.code} className="nist-card">
                <div className="nist-card-head">
                  <span className="nist-code-badge">{fn.code}</span>
                  <span className="nist-score-val">{fn.score}%</span>
                </div>
                <div className="nist-name">{fn.name}</div>
                <p className="nist-desc">{fn.desc}</p>
                <div className="nist-progress-bg">
                  <div className="nist-progress-bar" style={{ width: `${fn.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: Plan de Remediación de Brechas */}
      {activeTab === "gaps" && gapData && (
        <div className="gaps-tab-content animate-fade-in">
          <div className="top-gaps-grid">
            {gapData.top_actionable_gaps.map((gap, i) => (
              <div key={i} className="action-gap-card">
                <div className="action-gap-header">
                  <span className="control-id-badge">{gap.id}</span>
                  <span className="control-status-tag">{gap.status}</span>
                </div>
                <div className="action-gap-title">{gap.title}</div>
                <div className="action-gap-body">
                  <strong>Diagnóstico:</strong> {gap.evidence}
                </div>
                <div className="action-gap-recom">
                  <strong>Recomendación SGSI:</strong> {gap.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Evidencias en Base de Datos */}
      {activeTab === "evidence" && data && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }} className="animate-fade-in">
          {rawBlocks.map((b) => (
            <Card key={b.title} padding="lg">
              <div className="card-head" style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "var(--r-sm)",
                      background: `var(--c-${b.tone}-subtle)`,
                      color: `var(--c-${b.tone})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon name={b.icon} size={18} />
                  </div>
                  <div>
                    <h3 className="card-title" style={{ fontSize: 16 }}>{b.title}</h3>
                    <div style={{ fontSize: 12, color: "var(--c-text-muted)", marginTop: 2 }}>{b.subtitle}</div>
                  </div>
                </div>
                <Badge tone="info">{b.badge}</Badge>
              </div>

              <dl className="def-list" style={{ marginTop: 16 }}>
                {Object.entries(b.items).map(([k, v]) => (
                  <div key={k} style={{ display: "contents" }}>
                    <dt style={{ textTransform: "uppercase", fontSize: 11, fontWeight: 700, letterSpacing: "0.04em" }}>
                      {k.replace(/_/g, " ")}
                    </dt>
                    <dd>
                      <span
                        style={{
                          background: "var(--c-bg-subtle)",
                          padding: "4px 10px",
                          borderRadius: "var(--r-xs)",
                          fontWeight: 700,
                          fontSize: 13,
                          color: "var(--c-text)",
                          border: "1px solid var(--c-border)",
                          fontFamily: "var(--f-mono)",
                        }}
                      >
                        {v}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
