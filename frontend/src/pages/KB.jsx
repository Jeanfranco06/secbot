import { useEffect, useState } from "react";
import { kbApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button, Card, Input, Modal, Select, Spinner, Table, Badge, Tabs } from "@/ui";
import { Icon } from "@/components/Icon";

export default function KB() {
  const { user } = useAuth();
  const isAdmin = Boolean(user?.role === "admin" || user?.roles?.includes("admin") || user?.permissions?.includes("users.manage") || user?.permissions?.includes("kb.manage"));
  const toast = useToast();
  const { t } = useLanguage();
  const [docs, setDocs] = useState(null);
  const [stats, setStats] = useState(null);
  const [open, setOpen] = useState(false);
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [selectedDocForUpdate, setSelectedDocForUpdate] = useState(null);
  const [updateFile, setUpdateFile] = useState(null);
  const [updateVersion, setUpdateVersion] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [form, setForm] = useState({
    title: "",
    doc_type: "policy",
    version: "1.0",
    owner: "",
    section_split: true,
    file: null,
  });
  const [busy, setBusy] = useState(false);

  // Estados para Preview y Download
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewTab, setPreviewTab] = useState("content");
  const [previewViewMode, setPreviewViewMode] = useState("pdf"); // 'pdf', 'word', 'raw'
  const [downloadingId, setDownloadingId] = useState(null);

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
      toast.success(`Documento indexado con éxito: ${res.chunks} fragmentos vectorizados`);
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

  const handlePreview = async (doc) => {
    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewTab("content");
    try {
      const detail = await kbApi.get(doc.id);
      setPreviewDoc(detail);
    } catch (e) {
      toast.error(`Error al cargar previsualización: ${e.message}`);
      setPreviewOpen(false);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (docId, fallbackTitle = "documento", format = null) => {
    setDownloadingId(`${docId}-${format || "md"}`);
    try {
      const { data, filename } = await kbApi.download(docId, format);
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || `${fallbackTitle}.${format === "pdf" ? "pdf" : format === "docx" ? "docx" : "md"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Descarga exitosa: ${filename}`);
    } catch (e) {
      toast.error(`Error al descargar: ${e.message}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const openUpdateModal = (doc) => {
    setSelectedDocForUpdate(doc);
    const nextVer = doc.version ? `${(parseFloat(doc.version) || 1.0) + 0.1}` : "1.1";
    setUpdateVersion(nextVer);
    setUpdateFile(null);
    setUpdateModalOpen(true);
  };

  const handleUpdateUpload = async () => {
    if (!updateFile || !selectedDocForUpdate) {
      toast.error("Por favor selecciona un archivo para actualizar el documento");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", updateFile);
      fd.append("title", selectedDocForUpdate.title);
      fd.append("doc_type", selectedDocForUpdate.doc_type || "policy");
      fd.append("version", updateVersion || "2.0");
      if (selectedDocForUpdate.owner) fd.append("owner", selectedDocForUpdate.owner);
      fd.append("section_split", "true");

      const res = await kbApi.upload(fd);
      toast.success(`Documento "${selectedDocForUpdate.title}" actualizado a v${updateVersion} (${res.chunks} fragmentos re-indexados)`);
      setUpdateModalOpen(false);
      load();
    } catch (e) {
      toast.error(`Error al actualizar documento: ${e.message}`);
    } finally {
      setBusy(false);
    }
  };

  const filteredDocs = (docs || []).filter((d) => {
    const matchSearch =
      !search.trim() ||
      d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.doc_type.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || d.doc_type === typeFilter;
    return matchSearch && matchType;
  });

  if (!docs) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "100px 0" }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="row-between mb-5" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: "var(--r-md)",
              background: "var(--c-primary-subtle)", color: "var(--c-primary)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Icon name="database" size={20} />
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{t("kb.title")}</h1>
          </div>
          <p style={{ color: "var(--c-text-muted)", marginTop: 6 }}>{t("kb.subtitle")}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
            <Icon name="upload" size={14} />
            <span>{t("kb.uploadTitle")}</span>
          </Button>
          <Button size="sm" variant="secondary" onClick={load}>
            <Icon name="refresh" size={14} />
            <span>{t("common.refresh")}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: 16,
        marginBottom: 24
      }}>
        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--c-text-muted)", fontSize: 12, fontWeight: 600 }}>
            <span>{t("kb.statsDocs").toUpperCase()}</span>
            <Icon name="file-text" size={16} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: "var(--c-primary)" }}>
            {stats?.documents?.active || 0}
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--c-text-muted)", fontSize: 12, fontWeight: 600 }}>
            <span>{t("kb.statsChunks").toUpperCase()}</span>
            <Icon name="database" size={16} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: "var(--c-success)" }}>
            {stats?.chunks || 0}
          </div>
          <div style={{ fontSize: 11, color: "var(--c-text-muted)", marginTop: 4 }}>
            Indexados con pgvector (1024 dims)
          </div>
        </Card>

        <Card padding="md">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--c-text-muted)", fontSize: 12, fontWeight: 600 }}>
            <span>{t("kb.statsObsolete").toUpperCase()}</span>
            <Icon name="trash" size={16} />
          </div>
          <div style={{ fontSize: 28, fontWeight: 800, marginTop: 8, color: "var(--c-text-muted)" }}>
            {stats?.documents?.obsolete || 0}
          </div>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <Card padding="sm" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap", padding: "4px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 260 }}>
            <Icon name="search" size={16} style={{ color: "var(--c-text-muted)" }} />
            <input
              type="text"
              className="input"
              style={{ border: "none", background: "transparent", padding: "6px 0", boxShadow: "none" }}
              placeholder="Buscar por título o categoría..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ minWidth: 160 }}
          >
            <option value="">Todos los tipos</option>
            <option value="policy">Políticas (Policy)</option>
            <option value="runbook">Guías Operativas (Runbook)</option>
            <option value="faq">Preguntas Frecuentes (FAQ)</option>
            <option value="other">Otros Documentos</option>
          </Select>
        </div>
      </Card>

      {/* Documents Table */}
      <Card padding="md">
        <Table
          rowKey={(r) => r.id}
          columns={[
            {
              key: "title",
              title: "Título del Documento",
              render: (r) => (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Icon name="file-text" size={16} style={{ color: "var(--c-primary)", flexShrink: 0 }} />
                  <div>
                    <div
                      style={{ fontWeight: 700, color: "var(--c-text)", cursor: "pointer" }}
                      onClick={() => handlePreview(r)}
                      title="Clic para previsualizar"
                    >
                      {r.title}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--c-text-muted)" }}>ID: {r.id.slice(0, 8)}...</div>
                  </div>
                </div>
              ),
            },
            {
              key: "doc_type",
              title: "Tipo",
              render: (r) => (
                <span style={{
                  textTransform: "uppercase",
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "var(--r-xs)",
                  background: r.doc_type === "policy" ? "var(--c-primary-subtle)" : r.doc_type === "runbook" ? "var(--c-warning-subtle)" : "var(--c-bg-subtle)",
                  color: r.doc_type === "policy" ? "var(--c-primary)" : r.doc_type === "runbook" ? "var(--c-warning)" : "var(--c-text-secondary)"
                }}>
                  {r.doc_type}
                </span>
              ),
            },
            {
              key: "version",
              title: "Versión",
              render: (r) => <span style={{ fontFamily: "var(--f-mono)", fontSize: 12, fontWeight: 600 }}>v{r.version}</span>,
            },
            {
              key: "status",
              title: "Estado",
              render: (r) => (
                <Badge tone={r.status === "active" ? "success" : "muted"}>
                  {r.status}
                </Badge>
              ),
            },
            {
              key: "updated_at",
              title: "Actualizado",
              render: (r) => (
                <span style={{ fontSize: 12, color: "var(--c-text-muted)" }}>
                  {new Date(r.updated_at).toLocaleDateString()}
                </span>
              ),
            },
            {
              key: "actions",
              title: "Acciones",
              align: "right",
              render: (r) => (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 6 }}>
                  {/* Previsualizar */}
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handlePreview(r)}
                    title={t("kb.preview")}
                    style={{ color: "var(--c-primary)" }}
                  >
                    <Icon name="eye" size={13} />
                    <span>Ver</span>
                  </Button>

                  {/* Descargas Rápidas */}
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDownload(r.id, r.title, "pdf")}
                    loading={downloadingId === `${r.id}-pdf`}
                    title="Descargar en formato PDF"
                    style={{ color: "#DC2626", fontWeight: 700 }}
                  >
                    <span style={{ fontSize: 10 }}>PDF</span>
                  </Button>

                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => handleDownload(r.id, r.title, "docx")}
                    loading={downloadingId === `${r.id}-docx`}
                    title="Descargar en formato Word (.docx)"
                    style={{ color: "#2563EB", fontWeight: 700 }}
                  >
                    <span style={{ fontSize: 10 }}>Word</span>
                  </Button>

                  {/* Editar / Actualizar archivo subiendo versión (Solo Admin) */}
                  {isAdmin && (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => openUpdateModal(r)}
                      title="Actualizar / Subir nueva versión de archivo (Solo Admin)"
                      style={{ color: "var(--c-warning)" }}
                    >
                      <Icon name="upload" size={13} />
                      <span>Actualizar</span>
                    </Button>
                  )}

                  {/* Obsoleto */}
                  {r.status === "active" ? (
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() => obsolete(r.id)}
                      title={t("kb.markObsolete")}
                      style={{ color: "var(--c-danger)" }}
                    >
                      <Icon name="trash" size={13} />
                    </Button>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--c-text-muted)", fontStyle: "italic", padding: "0 6px" }}>Archivado</span>
                  )}
                </div>
              ),
            },
          ]}
          rows={filteredDocs}
          empty="No hay documentos que coincidan con la búsqueda"
        />
      </Card>

      {/* Preview Modal */}
      <Modal
        open={previewOpen}
        title={previewDoc?.title || t("kb.previewTitle")}
        onClose={() => setPreviewOpen(false)}
        size="lg"
        footer={
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", gap: 12 }}>
            <div style={{ fontSize: 12, color: "var(--c-text-muted)" }}>
              {previewDoc ? `${previewDoc.total_chunks} fragmentos | ${previewDoc.total_tokens} tokens indexados` : ""}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Button variant="secondary" onClick={() => setPreviewOpen(false)}>
                {t("common.back")}
              </Button>
              {previewDoc && (
                <>
                  <Button
                    variant="secondary"
                    onClick={() => handleDownload(previewDoc.id, previewDoc.title, "pdf")}
                    loading={downloadingId === `${previewDoc.id}-pdf`}
                    style={{ color: "#DC2626", fontWeight: 700 }}
                  >
                    <Icon name="download" size={14} />
                    <span>Descargar PDF</span>
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => handleDownload(previewDoc.id, previewDoc.title, "docx")}
                    loading={downloadingId === `${previewDoc.id}-docx`}
                    style={{ background: "#2563EB", borderColor: "#1D4ED8" }}
                  >
                    <Icon name="download" size={14} />
                    <span>Descargar Word (.docx)</span>
                  </Button>
                </>
              )}
            </div>
          </div>
        }
      >
        {previewLoading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
            <Spinner />
          </div>
        ) : previewDoc ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Pestañas Principales: Documento Completo vs Inspector de Chunks */}
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              borderBottom: "1px solid var(--c-border)",
              paddingBottom: 8
            }}>
              <button
                type="button"
                className={`btn btn-sm ${previewTab === "content" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setPreviewTab("content")}
                style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}
              >
                <Icon name="file-text" size={15} />
                <span>Documento Completo</span>
              </button>
              <button
                type="button"
                className={`btn btn-sm ${previewTab === "chunks" ? "btn-primary" : "btn-ghost"}`}
                onClick={() => setPreviewTab("chunks")}
                style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}
              >
                <Icon name="database" size={15} />
                <span>Fragmentos Vectorizados (Chunks)</span>
                <span style={{
                  background: previewTab === "chunks" ? "rgba(255,255,255,0.25)" : "var(--c-bg-subtle)",
                  padding: "2px 7px",
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 700
                }}>
                  {previewDoc.total_chunks || previewDoc.chunks?.length || 0}
                </span>
              </button>
            </div>

            {/* Visualizer Mode Toggle (Solo cuando se visualiza el Documento Completo) */}
            {previewTab === "content" && (
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                padding: "10px 14px",
                background: "var(--c-bg-subtle)",
                borderRadius: "var(--r-md)",
                border: "1px solid var(--c-border)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-text)" }}>Modo de Vista:</span>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      type="button"
                      className={`btn btn-xs ${previewViewMode === "pdf" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setPreviewViewMode("pdf")}
                      style={previewViewMode === "pdf" ? { background: "#DC2626", borderColor: "#B91C1C" } : {}}
                    >
                      📄 Vista Previa PDF
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${previewViewMode === "word" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setPreviewViewMode("word")}
                      style={previewViewMode === "word" ? { background: "#2563EB", borderColor: "#1D4ED8" } : {}}
                    >
                      📝 Vista Previa Word
                    </button>
                    <button
                      type="button"
                      className={`btn btn-xs ${previewViewMode === "raw" ? "btn-primary" : "btn-ghost"}`}
                      onClick={() => setPreviewViewMode("raw")}
                    >
                      Código Markdown
                    </button>
                  </div>
                </div>

                {/* Botón rápido para actualizar desde modal si es admin */}
                {isAdmin && (
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => {
                      setPreviewOpen(false);
                      openUpdateModal(previewDoc);
                    }}
                    style={{ color: "var(--c-warning)", fontWeight: 700 }}
                  >
                    <Icon name="upload" size={13} />
                    <span>Subir Nueva Versión</span>
                  </Button>
                )}
              </div>
            )}

            {/* Document Simulator Page */}
            {previewTab === "content" && (
              <div style={{
                maxHeight: "55vh",
                overflowY: "auto",
                padding: "28px 34px",
                borderRadius: "var(--r-md)",
                background: previewViewMode === "pdf" ? "#FFFFFF" : previewViewMode === "word" ? "#FAFBFD" : "var(--c-surface-card)",
                color: "#1F2937",
                border: previewViewMode === "pdf" ? "2px solid #E5E7EB" : "1px solid var(--c-border)",
                boxShadow: previewViewMode === "pdf" ? "0 4px 14px rgba(0,0,0,0.08)" : "none",
                fontFamily: previewViewMode === "word" ? "'Calibri', sans-serif" : previewViewMode === "pdf" ? "'Helvetica Neue', Arial, sans-serif" : "var(--f-mono)",
                fontSize: 13.5,
                lineHeight: 1.7,
              }}>
                {/* Encabezado formal estilo hoja institucional */}
                <div style={{
                  borderBottom: previewViewMode === "pdf" ? "2px solid #1E3A8A" : previewViewMode === "word" ? "2px solid #2B579A" : "1px solid #CBD5E1",
                  paddingBottom: 12,
                  marginBottom: 20
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h2 style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 800,
                        color: previewViewMode === "pdf" ? "#1E3A8A" : previewViewMode === "word" ? "#2B579A" : "inherit"
                      }}>
                        {previewDoc.title}
                      </h2>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                        Sistema de Gestión de Seguridad de la Información (SGSI) • Versión {previewDoc.version}
                      </div>
                    </div>
                    <span style={{
                      padding: "3px 10px",
                      borderRadius: 4,
                      background: previewDoc.status === "active" ? "#DCFCE7" : "#F1F5F9",
                      color: previewDoc.status === "active" ? "#166534" : "#475569",
                      fontSize: 11,
                      fontWeight: 700
                    }}>
                      {previewDoc.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Contenido formateado */}
                <div style={{ whiteSpace: "pre-wrap" }}>
                  {previewDoc.content || t("kb.noContent")}
                </div>
              </div>
            )}

            {/* Tab 2: Chunks Inspector */}
            {previewTab === "chunks" && (
              <div style={{
                maxHeight: "55vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 12
              }}>
                {(previewDoc.chunks || []).map((chunk, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "14px 16px",
                      borderRadius: "var(--r-md)",
                      background: "var(--c-surface-card)",
                      border: "1px solid var(--c-border)",
                      boxShadow: "var(--sh-sm)"
                    }}
                  >
                    <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 8,
                      borderBottom: "1px solid var(--c-border-subtle)",
                      paddingBottom: 6
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "var(--r-xs)",
                          background: "var(--c-primary-subtle)",
                          color: "var(--c-primary)",
                          fontFamily: "var(--f-mono)"
                        }}>
                          {t("kb.chunkIndex")} #{chunk.chunk_index}
                        </span>
                        {chunk.section && (
                          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--c-text-secondary)" }}>
                            § {chunk.section}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: 11, color: "var(--c-text-muted)", fontFamily: "var(--f-mono)" }}>
                        {chunk.token_count} {t("kb.chunkTokens")}
                      </span>
                    </div>
                    <div style={{
                      fontSize: 12.5,
                      lineHeight: 1.6,
                      color: "var(--c-text)",
                      whiteSpace: "pre-wrap",
                      fontFamily: "var(--f-sans)"
                    }}>
                      {chunk.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : null}
      </Modal>

      {/* Modal para Actualizar/Subir Nueva Versión (Solo Admin) */}
      <Modal
        open={updateModalOpen}
        title={`Actualizar Documento: ${selectedDocForUpdate?.title || ""}`}
        onClose={() => setUpdateModalOpen(false)}
        size="md"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{
            padding: "10px 14px",
            background: "var(--c-bg-subtle)",
            borderRadius: "var(--r-md)",
            border: "1px solid var(--c-border)",
            fontSize: 12.5,
            color: "var(--c-text-secondary)"
          }}>
            Subir un nuevo archivo reemplazará los fragmentos vectorizados de la versión anterior y marcará la versión previa como obsoleta automáticamente.
          </div>

          <Input
            label="Nueva Versión"
            placeholder="ej. 2.0 o 2.1"
            value={updateVersion}
            onChange={(e) => setUpdateVersion(e.target.value)}
            required
          />

          <div style={{
            border: "2px dashed var(--c-border)",
            borderRadius: "var(--r-md)",
            padding: "24px 16px",
            textAlign: "center",
            background: "var(--c-bg-subtle)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10
          }}>
            <Icon name="upload" size={28} style={{ color: "var(--c-warning)" }} />
            <div>
              <input
                type="file"
                id="kb-update-file-input"
                style={{ display: "none" }}
                accept=".md,.txt,.pdf,.docx,.doc"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setUpdateFile(f);
                }}
              />
              <label htmlFor="kb-update-file-input" className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                Seleccionar archivo actualizado (.md, .pdf, .docx)
              </label>
            </div>
            {updateFile ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-success)" }}>
                ✓ {updateFile.name} ({(updateFile.size / 1024).toFixed(1)} KB)
              </span>
            ) : (
              <span style={{ fontSize: 11, color: "var(--c-text-muted)" }}>
                Formatos permitidos: Markdown (.md), PDF (.pdf), Word (.docx)
              </span>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <Button variant="secondary" onClick={() => setUpdateModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleUpdateUpload} loading={busy} style={{ background: "var(--c-warning)", borderColor: "var(--c-warning)", color: "#000" }}>
              <Icon name="upload" size={14} />
              <span>Publicar Versión v{updateVersion}</span>
            </Button>
          </div>
        </div>
      </Modal>

      {/* Upload Modal */}
      <Modal open={open} title={t("kb.uploadTitle")} onClose={() => setOpen(false)} size="md">
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <p style={{ fontSize: 13, color: "var(--c-text-secondary)" }}>
            {t("kb.uploadDesc")}
          </p>

          <Input
            label={t("kb.docTitle")}
            placeholder="ej. Política de Seguridad en la Nube"
            value={form.title}
            onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            required
          />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Select
              label={t("kb.docType")}
              value={form.doc_type}
              onChange={(e) => setForm((prev) => ({ ...prev, doc_type: e.target.value }))}
            >
              <option value="policy">Política (Policy)</option>
              <option value="runbook">Guía Operativa (Runbook)</option>
              <option value="faq">Preguntas Frecuentes (FAQ)</option>
              <option value="other">Otro</option>
            </Select>

            <Input
              label={t("kb.docVersion")}
              placeholder="1.0"
              value={form.version}
              onChange={(e) => setForm((prev) => ({ ...prev, version: e.target.value }))}
            />
          </div>

          <div style={{
            border: "2px dashed var(--c-border)",
            borderRadius: "var(--r-md)",
            padding: "24px 16px",
            textAlign: "center",
            background: "var(--c-bg-subtle)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10
          }}>
            <Icon name="upload" size={28} style={{ color: "var(--c-primary)" }} />
            <div>
              <input
                type="file"
                id="kb-file-input"
                style={{ display: "none" }}
                accept=".md,.txt,.pdf,.docx,.doc"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setForm({ ...form, file: f, title: form.title || f.name.replace(/\.[^/.]+$/, "") });
                  }
                }}
              />
              <label htmlFor="kb-file-input" className="btn btn-secondary btn-sm" style={{ cursor: "pointer" }}>
                Seleccionar archivo del disco
              </label>
            </div>
            {form.file ? (
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--c-success)" }}>
                ✓ {form.file.name} ({(form.file.size / 1024).toFixed(1)} KB)
              </span>
            ) : (
              <span style={{ fontSize: 11, color: "var(--c-text-muted)" }}>
                Formatos: .md, .pdf, .docx, .txt (Máx 20 MB)
              </span>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input
              type="checkbox"
              id="section-split"
              checked={form.section_split}
              onChange={(e) => setForm((prev) => ({ ...prev, section_split: e.target.checked }))}
            />
            <label htmlFor="section-split" style={{ cursor: "pointer", color: "var(--c-text)" }}>
              {t("kb.sectionSplit")}
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 }}>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button variant="primary" onClick={upload} loading={busy}>
              <Icon name="upload" size={14} />
              <span>{t("kb.uploadBtn")}</span>
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
