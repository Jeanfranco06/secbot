import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ticketsApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { Button, Card, Input, Modal, Select, SeverityBadge, Spinner, StatusBadge, Textarea } from "@/ui";
import "./ticket-detail.css";

const STATUS = ["nuevo", "en_progreso", "resuelto", "cerrado", "cancelado"];

export default function TicketDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { has } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({ status: "", resolution: "" });
  const [labelOpen, setLabelOpen] = useState(false);
  const [label, setLabel] = useState({ true_is_incident: true, true_category: "", true_severity: "P3", notes: "" });

  const load = async () => {
    try {
      const t = await ticketsApi.get(id);
      setTicket(t);
      setForm({ status: t.status, resolution: t.resolution || "" });
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
      toast.success("Etiquetado para reentrenamiento guardado");
      setLabelOpen(false);
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!ticket) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container">
      <Button variant="ghost" size="sm" onClick={() => nav(-1)}>
        ← Volver a Tickets
      </Button>

      <div className="ticket-header">
        <div className="ticket-title-row">
          <span className="ticket-number-badge">{ticket.ticket_number}</span>
          <h1 style={{ margin: 0, fontSize: 22 }}>{ticket.title}</h1>
          <SeverityBadge severity={ticket.severity} />
          <StatusBadge status={ticket.status} />
        </div>

        <div className="row">
          {has("ticket.manage") && (
            <>
              <Button size="sm" variant="primary" onClick={() => setEdit(true)}>
                Actualizar Estado
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setLabelOpen(true)}>
                Etiquetar para IA
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-2">
        <Card title="Metadatos del Incidente">
          <dl className="def-list">
            <dt>Categoría</dt>
            <dd><b>{ticket.category || "General"}</b></dd>
            <dt>Reportado por</dt>
            <dd>{ticket.reported_by || "SecBot Assistant"}</dd>
            <dt>Asignado a</dt>
            <dd>{ticket.assigned_to || "Sin asignar"}</dd>
            <dt>Fecha de creación</dt>
            <dd>{new Date(ticket.created_at).toLocaleString()}</dd>
            <dt>Fecha de vencimiento (SLA)</dt>
            <dd>{ticket.due_at ? new Date(ticket.due_at).toLocaleString() : "—"}</dd>
            <dt>Fecha de resolución</dt>
            <dd>{ticket.resolved_at ? new Date(ticket.resolved_at).toLocaleString() : "—"}</dd>
          </dl>
        </Card>

        <Card title="Descripción & Diagnóstico">
          <div className="ticket-desc-box">{ticket.description || "Sin descripción proporcionada"}</div>
          {ticket.resolution && (
            <div className="ticket-resolution-box">
              <h4 style={{ margin: "0 0 6px", color: "var(--c-success)" }}>✅ Resolución documentada</h4>
              <div>{ticket.resolution}</div>
            </div>
          )}
        </Card>
      </div>

      <Modal
        open={edit}
        title="Actualizar estado del incidente"
        onClose={() => setEdit(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEdit(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={save}>
              Guardar Cambios
            </Button>
          </>
        }
      >
        <Select
          label="Estado del Ticket"
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          {STATUS.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ").toUpperCase()}
            </option>
          ))}
        </Select>

        <Textarea
          label="Notas de resolución"
          rows={4}
          placeholder="Describe los pasos de mitigación o remediación ejecutados..."
          value={form.resolution}
          onChange={(e) => setForm({ ...form, resolution: e.target.value })}
        />
      </Modal>

      <Modal
        open={labelOpen}
        title="Etiquetado para reentrenamiento del clasificador"
        onClose={() => setLabelOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setLabelOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={submitLabel}>
              Guardar Etiqueta
            </Button>
          </>
        }
      >
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={label.true_is_incident}
              onChange={(e) => setLabel({ ...label, true_is_incident: e.target.checked })}
            />
            Confirmar que es un incidente de seguridad real
          </label>
        </div>

        <Input
          label="Categoría confirmada"
          placeholder="phishing, malware, data_leak, credential_theft, etc."
          value={label.true_category}
          onChange={(e) => setLabel({ ...label, true_category: e.target.value })}
        />

        <Select
          label="Severidad confirmada"
          value={label.true_severity}
          onChange={(e) => setLabel({ ...label, true_severity: e.target.value })}
        >
          {["P1", "P2", "P3", "P4"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>

        <Textarea
          label="Notas del analista"
          placeholder="Detalles sobre por qué este caso debe entrenar el clasificador..."
          value={label.notes}
          onChange={(e) => setLabel({ ...label, notes: e.target.value })}
        />
      </Modal>
    </div>
  );
}