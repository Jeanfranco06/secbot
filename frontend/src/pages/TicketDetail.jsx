import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ticketsApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button, Card, Modal, Select, SeverityBadge, Spinner, StatusBadge, Textarea } from "@/ui";
import { Icon } from "@/components/Icon";
import "./ticket-detail.css";

const STATUS = ["nuevo", "en_progreso", "resuelto", "cerrado", "cancelado"];

export default function TicketDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { has } = useAuth();
  const { t } = useLanguage();
  const [ticket, setTicket] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ status: "", resolution: "" });
  const [labelOpen, setLabelOpen] = useState(false);
  const [label, setLabel] = useState({ true_is_incident: true, true_category: "", true_severity: "P3", notes: "" });
  const [remediationOpen, setRemediationOpen] = useState(false);
  const [remediationLoading, setRemediationLoading] = useState(false);
  const [remediationPlan, setRemediationPlan] = useState(null);
  const [iocs, setIocs] = useState([]);
  const [iocsLoading, setIocsLoading] = useState(false);

  const load = async () => {
    try {
      const ticketData = await ticketsApi.get(id);
      setTicket(ticketData);
      setForm({ status: ticketData.status, resolution: ticketData.resolution || "" });
      setLabel((prev) => ({
        ...prev,
        true_category: ticketData.category || "phishing",
        true_severity: ticketData.severity || "P2",
      }));

      // Cargar IoCs forenses del ticket
      setIocsLoading(true);
      try {
        const iocRes = await ticketsApi.iocs(id);
        setIocs(iocRes.iocs || []);
      } catch (err) {
        console.error("Error al cargar IoCs:", err);
      } finally {
        setIocsLoading(false);
      }
    } catch (e) {
      toast.error(e.message);
      nav("/tickets");
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async () => {
    try {
      await ticketsApi.update(id, { status: form.status, resolution: form.resolution });
      toast.success("Incidente actualizado correctamente");
      setEdit(false);
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const submitLabel = async () => {
    try {
      await ticketsApi.label(id, label);
      toast.success("Etiquetado guardado para reentrenamiento del clasificador");
      setLabelOpen(false);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const generatePlan = async (applyDirectly = false) => {
    setRemediationLoading(true);
    try {
      const data = await ticketsApi.remediationPlan(id, applyDirectly);
      setRemediationPlan(data.plan);
      setRemediationOpen(true);
      if (applyDirectly) {
        toast.success("Plan generado y anexado a las notas de resolución");
        load();
      } else {
        toast.success("Plan de remediación generado exitosamente por SecBot");
      }
    } catch (e) {
      toast.error(e.message || "Error al generar plan con IA");
    } finally {
      setRemediationLoading(false);
    }
  };

  const applyPlanToResolution = async () => {
    if (!remediationPlan?.formatted_report) return;
    try {
      await ticketsApi.update(id, {
        resolution: remediationPlan.formatted_report,
        status: ticket.status === "nuevo" ? "en_progreso" : ticket.status,
      });
      toast.success("Plan de remediación anexado a la resolución del ticket");
      setRemediationOpen(false);
      load();
    } catch (e) {
      toast.error(e.message || "Error al aplicar resolución");
    }
  };

  if (!ticket) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container">
      <Button variant="ghost" size="sm" onClick={() => nav("/tickets")} style={{ marginBottom: 16 }}>
        ← {t("common.back")} a Tickets
      </Button>

      {/* Ticket Header Banner */}
      <div className="ticket-header glass-panel" style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px 24px",
        borderRadius: "var(--r-lg)",
        marginBottom: 24,
        gap: 16,
        flexWrap: "wrap"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{
            fontFamily: "var(--f-mono)",
            fontWeight: 800,
            fontSize: 16,
            background: "var(--c-primary-subtle)",
            color: "var(--c-primary)",
            padding: "4px 10px",
            borderRadius: "var(--r-sm)",
            border: "1px solid var(--c-primary-border)"
          }}>
            {ticket.ticket_number}
          </span>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{ticket.title}</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <SeverityBadge severity={ticket.severity} />
            <StatusBadge status={ticket.status} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {has("ticket.manage") && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => generatePlan(false)}
                loading={remediationLoading}
                style={{
                  background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)",
                  color: "#ffffff",
                  boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
                }}
              >
                <Icon name="sparkles" size={14} />
                <span>Plan de Remediación IA</span>
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setEdit(true)}>
                <Icon name="check" size={14} />
                <span>{t("tickets.updateStatus")}</span>
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setLabelOpen(true)}>
                <Icon name="bot" size={14} />
                <span>Etiquetar IA</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Incident Details Card */}
        <Card title="Metadatos del Incidente">
          <dl className="def-list">
            <dt>{t("tickets.category")}</dt>
            <dd><b>{ticket.category || "General"}</b></dd>
            <dt>{t("tickets.severity")}</dt>
            <dd><SeverityBadge severity={ticket.severity} /></dd>
            <dt>{t("common.status")}</dt>
            <dd><StatusBadge status={ticket.status} /></dd>
            <dt>{t("common.date")}</dt>
            <dd>{new Date(ticket.created_at).toLocaleString()}</dd>
            <dt>{t("tickets.dueAt")}</dt>
            <dd style={{ color: ticket.due_at ? "var(--c-warning)" : "var(--c-text-muted)", fontWeight: ticket.due_at ? 700 : 400 }}>
              {ticket.due_at ? new Date(ticket.due_at).toLocaleString() : `SLA Estándar (Severidad ${ticket.severity || "P3"})`}
            </dd>
            <dt>Asignado a</dt>
            <dd>{ticket.assignee_email || (ticket.assigned_to ? `Usuario #${String(ticket.assigned_to).slice(0, 8)}` : "Equipo de Respuesta SOC (Pendiente)")}</dd>
            <dt>Fuente</dt>
            <dd><code>{ticket.source || "Chat Asistente"}</code></dd>
          </dl>
        </Card>

        {/* Resolution Notes Card */}
        <Card title={t("tickets.resolution")}>
          {ticket.resolution ? (
            <div style={{
              background: "var(--c-bg-subtle)",
              padding: 16,
              borderRadius: "var(--r-sm)",
              border: "1px solid var(--c-border)",
              lineHeight: 1.6,
              whiteSpace: "pre-wrap"
            }}>
              {ticket.resolution}
            </div>
          ) : (
            <p style={{ color: "var(--c-text-muted)", fontStyle: "italic" }}>
              Sin notas de resolución registradas todavía. Pulsa en "Actualizar Estado" para añadir resolución.
            </p>
          )}

          {ticket.description && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", marginBottom: 6 }}>
                Descripción inicial reportada
              </div>
              <div style={{
                background: "var(--c-bg-subtle)",
                padding: 12,
                borderRadius: "var(--r-sm)",
                border: "1px solid var(--c-border)",
                fontSize: 13
              }}>
                {ticket.description}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Forensic IoCs Card */}
      <div style={{ marginTop: 20 }}>
        <Card
          title={
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="search" size={16} style={{ color: "var(--c-cyan)" }} />
              <span>Indicadores de Compromiso (IoCs Forenses Detectados)</span>
              {iocs.length > 0 && (
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: "var(--r-full)",
                  background: "var(--c-danger-subtle)",
                  color: "var(--c-danger)",
                  border: "1px solid var(--c-danger)"
                }}>
                  {iocs.length} {iocs.length === 1 ? "artefacto" : "artefactos"}
                </span>
              )}
            </div>
          }
        >
          {iocsLoading ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
              <Spinner />
            </div>
          ) : iocs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <p style={{ fontSize: 13, color: "var(--c-text-secondary)", margin: 0 }}>
                Artefactos de amenaza extraídos automáticamente del reporte para triaje forense e investigación de seguridad:
              </p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5, textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--c-border)", color: "var(--c-text-muted)", fontSize: 11, textTransform: "uppercase" }}>
                      <th style={{ padding: "8px 10px" }}>Tipo</th>
                      <th style={{ padding: "8px 10px" }}>Artefacto / Valor</th>
                      <th style={{ padding: "8px 10px" }}>Riesgo</th>
                      <th style={{ padding: "8px 10px" }}>Acción Recomendada SOC</th>
                      <th style={{ padding: "8px 10px", textAlign: "right" }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iocs.map((ioc, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid var(--c-border-subtle)" }}>
                        <td style={{ padding: "10px" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "var(--r-xs)",
                            background: "var(--c-bg-subtle)",
                            color: "var(--c-text)",
                            textTransform: "uppercase"
                          }}>
                            {ioc.type === "ip" ? "🌐 IP" : ioc.type === "url" ? "🔗 URL" : ioc.type === "domain" ? "🏷️ Dominio" : "🔑 Hash"}
                          </span>
                        </td>
                        <td style={{ padding: "10px", fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 600 }}>
                          {ioc.value}
                        </td>
                        <td style={{ padding: "10px" }}>
                          <span style={{
                            fontSize: 11,
                            fontWeight: 800,
                            padding: "2px 8px",
                            borderRadius: "var(--r-full)",
                            background: ioc.risk === "CRÍTICO" ? "rgba(239, 68, 68, 0.15)" : ioc.risk === "ALTO" ? "rgba(245, 158, 11, 0.15)" : "rgba(59, 130, 246, 0.15)",
                            color: ioc.risk === "CRÍTICO" ? "var(--c-danger)" : ioc.risk === "ALTO" ? "var(--c-warning)" : "var(--c-primary)"
                          }}>
                            {ioc.risk}
                          </span>
                        </td>
                        <td style={{ padding: "10px", color: "var(--c-text-secondary)", fontSize: 12 }}>
                          {ioc.action}
                        </td>
                        <td style={{ padding: "10px", textAlign: "right" }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(ioc.value);
                              toast.success("Artefacto copiado al portapapeles");
                            }}
                            title="Copiar artefacto"
                          >
                            <Icon name="copy" size={13} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--c-bg-subtle)", borderRadius: "var(--r-sm)" }}>
              <Icon name="shield-check" size={18} style={{ color: "var(--c-mint)" }} />
              <span style={{ fontSize: 13, color: "var(--c-text-muted)" }}>
                No se detectaron artefactos forenses directos (IPs, URLs maliciosas o Hashes) en la descripción del incidente.
              </span>
            </div>
          )}
        </Card>
      </div>

      {/* Modal: Update Status */}
      <Modal open={edit} title="Actualizar Estado del Incidente" onClose={() => setEdit(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Select
            label="Nuevo Estado"
            value={form.status}
            onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>

          <Textarea
            label="Resolución / Acciones de mitigación"
            placeholder="Describe las acciones tomadas para resolver o mitigar el incidente..."
            rows={4}
            value={form.resolution}
            onChange={(e) => setForm((prev) => ({ ...prev, resolution: e.target.value }))}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <Button variant="secondary" onClick={() => setEdit(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={save}>
              {t("common.save")}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Labeling for IA */}
      <Modal open={labelOpen} title="Etiquetar Incidente para Aprendizaje IA" onClose={() => setLabelOpen(false)}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13, color: "var(--c-text-secondary)" }}>
            Ayuda a perfeccionar el clasificador supervisado del SecBot verificando los datos reales del incidente.
          </p>

          <Select
            label="¿Es realmente un incidente de seguridad?"
            value={label.true_is_incident ? "yes" : "no"}
            onChange={(e) => setLabel((prev) => ({ ...prev, true_is_incident: e.target.value === "yes" }))}
          >
            <option value="yes">Sí, es un incidente legítimo</option>
            <option value="no">No, fue un falso positivo</option>
          </Select>

          <Select
            label="Categoría Verificada"
            value={label.true_category}
            onChange={(e) => setLabel((prev) => ({ ...prev, true_category: e.target.value }))}
          >
            <option value="phishing">Phishing / Ingeniería Social</option>
            <option value="malware">Malware / Ransomware</option>
            <option value="acceso">Acceso No Autorizado</option>
            <option value="credenciales">Credenciales Comprometidas</option>
            <option value="dispositivo">Pérdida / Robo de Dispositivo</option>
            <option value="otro">Otro</option>
          </Select>

          <Select
            label="Severidad Real"
            value={label.true_severity}
            onChange={(e) => setLabel((prev) => ({ ...prev, true_severity: e.target.value }))}
          >
            <option value="P1">P1 - Crítico</option>
            <option value="P2">P2 - Alto</option>
            <option value="P3">P3 - Medio</option>
            <option value="P4">P4 - Bajo / Consulta</option>
          </Select>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <Button variant="secondary" onClick={() => setLabelOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={submitLabel}>
              Guardar Etiquetado
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal: Remediation & Post-Mortem Plan */}
      <Modal open={remediationOpen} title={`Plan de Respuesta & Remediación IA (${ticket.ticket_number})`} onClose={() => setRemediationOpen(false)}>
        {remediationPlan ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "72vh", overflowY: "auto", paddingRight: 4 }}>
            {/* Resumen */}
            <div style={{
              background: "var(--c-primary-subtle)",
              border: "1px solid var(--c-primary-border)",
              borderRadius: "var(--r-md)",
              padding: "12px 16px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontWeight: 700, color: "var(--c-primary)", fontSize: 13 }}>
                <Icon name="shield-alert" size={16} />
                <span>Resumen Ejecutivo del Incidente</span>
              </div>
              <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--c-text)" }}>
                {remediationPlan.summary}
              </p>
            </div>

            {/* Fase 1: Contención Inmediata */}
            <div style={{ background: "var(--c-bg-subtle)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--c-danger)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  1. Fase de Contención Inmediata (SLA &lt; 1h)
                </span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: "var(--r-full)", background: "rgba(239, 68, 68, 0.12)", color: "var(--c-danger)", fontWeight: 700 }}>
                  Crítico
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 6 }}>
                {remediationPlan.immediate_containment?.map((act, i) => (
                  <li key={i} style={{ lineHeight: 1.4 }}>{act}</li>
                ))}
              </ul>
            </div>

            {/* Fase 2: Erradicación */}
            <div style={{ background: "var(--c-bg-subtle)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--c-warning)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  2. Fase de Erradicación & Limpieza
                </span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: "var(--r-full)", background: "rgba(245, 158, 11, 0.12)", color: "var(--c-warning)", fontWeight: 700 }}>
                  Prioridad Alta
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 6 }}>
                {remediationPlan.eradication?.map((act, i) => (
                  <li key={i} style={{ lineHeight: 1.4 }}>{act}</li>
                ))}
              </ul>
            </div>

            {/* Fase 3: Remediación a Largo Plazo */}
            <div style={{ background: "var(--c-bg-subtle)", border: "1px solid var(--c-border)", borderRadius: "var(--r-md)", padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: "var(--c-mint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  3. Remediación & Medidas Preventivas
                </span>
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: "var(--r-full)", background: "rgba(16, 185, 129, 0.12)", color: "var(--c-mint)", fontWeight: 700 }}>
                  Gobernanza
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5, display: "flex", flexDirection: "column", gap: 6 }}>
                {remediationPlan.long_term_remediation?.map((act, i) => (
                  <li key={i} style={{ lineHeight: 1.4 }}>{act}</li>
                ))}
              </ul>
            </div>

            {/* Controles afectados */}
            {remediationPlan.affected_controls?.length > 0 && (
              <div style={{ padding: "8px 12px", background: "var(--c-surface)", borderRadius: "var(--r-sm)", border: "1px solid var(--c-border)" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--c-text-muted)", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                  Controles de Seguridad Afectados (NIST / ISO 27001)
                </span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {remediationPlan.affected_controls.map((ctrl, i) => (
                    <span key={i} style={{ fontSize: 11.5, fontWeight: 600, color: "var(--c-primary)", background: "var(--c-primary-subtle)", padding: "2px 8px", borderRadius: "var(--r-full)" }}>
                      {ctrl}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Botones de acción */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginTop: 8, paddingTop: 10, borderTop: "1px solid var(--c-border)" }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(remediationPlan.formatted_report);
                  toast.success("Plan copiado al portapapeles en formato Markdown");
                }}
              >
                <Icon name="copy" size={13} />
                <span>Copiar Markdown</span>
              </Button>

              <div style={{ display: "flex", gap: 8 }}>
                <Button variant="ghost" size="sm" onClick={() => setRemediationOpen(false)}>
                  Cerrar
                </Button>
                <Button variant="primary" size="sm" onClick={applyPlanToResolution}>
                  <Icon name="check" size={13} />
                  <span>Aplicar como Resolución del Ticket</span>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ padding: "40px 0", display: "flex", justifyContent: "center" }}>
            <Spinner />
          </div>
        )}
      </Modal>
    </div>
  );
}
