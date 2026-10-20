import { useEffect, useState } from "react";
import { kbApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Button, Card, Input, Modal, Select, Spinner, Table, Badge } from "@/ui";

export default function KB() {
  const toast = useToast();
  const [docs, setDocs] = useState(null);
  const [stats, setStats] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    doc_type: "policy",
    version: "1.0",
    owner: "",
    section_split: true,
    file: null,
  });
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      const [d, s] = await Promise.all([kbApi.documents(), kbApi.stats()]);
      setDocs(d);
      setStats(s);
    } catch (e) {
      toast.error(e.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const upload = async () => {
    if (!form.file || !form.title) {
      toast.error("Por favor completa el título y selecciona un documento");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", form.file);
      fd.append("title", form.title);
      fd.append("doc_type", form.doc_type);
      fd.append("version", form.version);
      if (form.owner) fd.append("owner", form.owner);
      fd.append("section_split", String(form.section_split));
      const res = await kbApi.upload(fd);
      toast.success(`Documento indexado: ${res.chunks} fragmentos vectorizados`);
      setOpen(false);
      setForm({ ...form, title: "", file: null });
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const obsolete = async (id) => {
    if (!confirm("¿Deseas marcar este documento como obsoleto? Dejará de ser consultado por el RAG.")) return;
    try {
      await kbApi.obsolete(id);
      toast.success("Documento marcado como obsoleto");
      load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  if (!docs) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container">
      <div className="row-between mb-5">
        <div>
          <h1>Base de Conocimiento de Seguridad</h1>
          <p className="text-muted text-sm mt-1">
            Políticas, runbooks y documentación indexada vectorialmente para consultas RAG con citas
          </p>
        </div>

        <div className="row">
          {stats && (
            <div
              style={{
                background: "var(--c-bg-subtle)",
                border: "1px solid var(--c-border)",
                padding: "6px 14px",
                borderRadius: "var(--r-full)",
                fontSize: 12,
                fontWeight: 600,
                color: "var(--c-text-secondary)",
              }}
            >
              📄 <b>{stats.documents?.active ?? 0}</b> activos · 🧩 <b>{stats.chunks ?? 0}</b> chunks vectorizados
            </div>
          )}

          <Button variant="primary" size="sm" onClick={() => setOpen(true)}>
            + Indexar Documento
          </Button>
        </div>
      </div>

      <Card padding="md">
        <Table
          rowKey={(r) => r.id}
          columns={[
            {
              key: "title",
              title: "Documento",
              render: (r) => (
                <div>
                  <div style={{ fontWeight: 600 }}>{r.title}</div>
                  <div className="text-muted text-xs">v{r.version} · {r.owner || "Sin propietario"}</div>
                </div>
              ),
            },
            {
              key: "doc_type",
              title: "Tipo",
              render: (r) => <Badge tone="info">{r.doc_type}</Badge>,
            },
            {
              key: "classification",
              title: "Clasificación",
              render: (r) => (
                <Badge tone={r.classification === "confidential" ? "danger" : "default"}>
                  {r.classification}
                </Badge>
              ),
            },
            {
              key: "status",
              title: "Estado",
              render: (r) => (
                <Badge tone={r.status === "active" ? "success" : "muted"}>
                  {r.status === "active" ? "Activo" : "Obsoleto"}
                </Badge>
              ),
            },
            {
              key: "updated_at",
              title: "Actualizado",
              render: (r) =>
                new Date(r.updated_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                }),
            },
            {
              key: "actions",
              title: "Acciones",
              align: "right",
              render: (r) =>
                r.status === "active" ? (
                  <Button size="xs" variant="ghost" onClick={() => obsolete(r.id)}>
                    Archivar
                  </Button>
                ) : (
                  <span className="text-muted text-xs">Archivado</span>
                ),
            },
          ]}
          rows={docs}
          empty="No hay documentos indexados. Sube una política en PDF, DOCX o Markdown para comenzar."
        />
      </Card>

      <Modal
        open={open}
        title="Indexar nuevo documento de seguridad"
        onClose={() => setOpen(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={upload} loading={busy}>
              Subir e Indexar Chunks
            </Button>
          </>
        }
      >
        <Input
          label="Título oficial del documento"
          placeholder="Ej: Política de Control de Accesos y Contraseñas"
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />

        <div className="row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Select
            label="Tipo de Documento"
            value={form.doc_type}
            onChange={(e) => setForm({ ...form, doc_type: e.target.value })}
          >
            <option value="policy">Política (Policy)</option>
            <option value="runbook">Runbook Operativo</option>
            <option value="faq">Preguntas Frecuentes (FAQ)</option>
            <option value="other">Otro / Estándar</option>
          </Select>

          <Input
            label="Versión"
            placeholder="1.0"
            value={form.version}
            onChange={(e) => setForm({ ...form, version: e.target.value })}
          />
        </div>

        <Input
          label="Responsable / Propietario (CISO, TI, etc.)"
          placeholder="Ej: Equipo de Ciberseguridad"
          value={form.owner}
          onChange={(e) => setForm({ ...form, owner: e.target.value })}
        />

        <div className="field">
          <label className="field-label">Archivo (PDF, DOCX, TXT, MD)</label>
          <input
            type="file"
            className="input"
            accept=".pdf,.docx,.txt,.md"
            onChange={(e) => setForm({ ...form, file: e.target.files[0] })}
          />
          <span className="field-hint">
            El archivo será particionado en chunks semánticos y vectorizado con HuggingFace E5 / PgVector.
          </span>
        </div>
      </Modal>
    </div>
  );
}