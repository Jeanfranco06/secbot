import { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";

const LanguageCtx = createContext(null);

const TRANSLATIONS = {
  es: {
    // Navigation
    "nav.brand": "SecBot",
    "nav.tag": "Security AI",
    "nav.chat": "Chat Asistente",
    "nav.dashboard": "Dashboard",
    "nav.tickets": "Incidentes & Tickets",
    "nav.kb": "Base de Conocimiento",
    "nav.reports": "Reportes",
    "nav.audit": "Auditoría",
    "nav.compliance": "Cumplimiento",
    "nav.users": "Usuarios",
    "nav.roles": "Roles",
    "nav.sessions": "Sesiones",
    "nav.profile": "Mi Perfil",
    "nav.logout": "Salir",
    "nav.menu": "Menú",
    "nav.closeMenu": "Cerrar menú",

    // Common
    "common.loading": "Cargando...",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.delete": "Eliminar",
    "common.search": "Buscar...",
    "common.filter": "Filtrar",
    "common.all": "Todos",
    "common.actions": "Acciones",
    "common.status": "Estado",
    "common.date": "Fecha",
    "common.view": "Ver",
    "common.download": "Descargar",
    "common.back": "Volver",
    "common.confirm": "Confirmar",
    "common.refresh": "Actualizar",
    "common.connected": "SecBot Conectado",
    "common.reconnecting": "Reconectando...",

    // Theme & Lang
    "theme.toLight": "Cambiar a modo claro",
    "theme.toDark": "Cambiar a modo oscuro",
    "lang.switch": "Cambiar idioma",

    // Chat
    "chat.title": "Asistente Corporativo RAG",
    "chat.subtitle": "Resuelvo dudas de normativas de seguridad, runbooks y gestión de incidentes con fuentes verificadas.",
    "chat.welcome": "Hola, {name} 👋",
    "chat.promptPlaceholder": "Haz una pregunta sobre normativas, contraseñas o incidentes...",
    "chat.send": "Enviar consulta",
    "chat.history": "Conversaciones",
    "chat.newChat": "Nueva consulta",
    "chat.noHistory": "Sin conversaciones previas",
    "chat.citations": "Fuentes citadas",
    "chat.incidentDetected": "Incidente Detectado",
    "chat.ticketCreated": "Ticket creado",
    "chat.viewTicket": "Ver ticket",
    "chat.confidence": "Confianza",
    "chat.latency": "Latencia",
    "chat.cached": "En caché",
    "chat.copy": "Copiar respuesta",
    "chat.copied": "¡Copiado!",
    "chat.feedbackPositive": "Respuesta útil",
    "chat.feedbackNegative": "Respuesta inexacta",
    "chat.scrollToBottom": "Mensajes recientes",

    // Suggestions
    "sugg.passwords": "¿Cuál es la política de complejidad y cambio de contraseñas?",
    "sugg.phishing": "¿Cómo reporto un correo sospechoso de phishing?",
    "sugg.usb": "¿Está permitido conectar dispositivos USB personales?",
    "sugg.incident": "He detectado una fuga de información confidencial en un enlace público",

    // Tickets
    "tickets.title": "Gestión de Incidentes y Tickets",
    "tickets.subtitle": "Seguimiento en tiempo real de alertas de seguridad y reportes del personal.",
    "tickets.searchPlaceholder": "Buscar por número, título o categoría...",
    "tickets.newTicket": "+ Nuevo Ticket",
    "tickets.statusAll": "Todos los estados",
    "tickets.statusNuevo": "Nuevo",
    "tickets.statusProgreso": "En Progreso",
    "tickets.statusResuelto": "Resuelto",
    "tickets.statusCerrado": "Cerrado",
    "tickets.severity": "Severidad",
    "tickets.category": "Categoría",
    "tickets.reportedBy": "Reportado por",
    "tickets.assignedTo": "Asignado a",
    "tickets.dueAt": "Vencimiento SLA",
    "tickets.noTickets": "No se encontraron tickets.",
    "tickets.detailTitle": "Detalle del Incidente",
    "tickets.resolution": "Resolución / Notas",
    "tickets.updateStatus": "Actualizar Estado",

    // KB
    "kb.title": "Base de Conocimiento de Seguridad",
    "kb.subtitle": "Documentos corporativos, runbooks y políticas indexadas para búsqueda semántica.",
    "kb.uploadTitle": "Subir nuevo documento normativo",
    "kb.uploadDesc": "Formatos soportados: Markdown (.md), PDF, Word (.docx) y texto (.txt). Máx. 20 MB.",
    "kb.docTitle": "Título del documento",
    "kb.docType": "Tipo de documento",
    "kb.docVersion": "Versión",
    "kb.sectionSplit": "Dividir inteligentemente por encabezados (#, ##)",
    "kb.uploadBtn": "Ingestar documento en vector store",
    "kb.statsDocs": "Documentos Activos",
    "kb.statsChunks": "Fragmentos Vectoriales (Chunks)",
    "kb.statsObsolete": "Documentos Obsoletos",
    "kb.markObsolete": "Marcar como obsoleto",
    "kb.preview": "Previsualizar",
    "kb.previewTitle": "Previsualización del Documento",
    "kb.downloadBtn": "Descargar",
    "kb.downloading": "Descargando...",
    "kb.tabContent": "Contenido Completo",
    "kb.tabChunks": "Fragmentos Vectoriales (Chunks)",
    "kb.chunkIndex": "Fragmento",
    "kb.chunkTokens": "Tokens",
    "kb.section": "Sección",
    "kb.noContent": "No hay contenido disponible para previsualizar.",
    "kb.docMetadata": "Metadatos del Documento",

    // Dashboard
    "dash.title": "Centro de Operaciones y Métricas",
    "dash.subtitle": "Rendimiento del asistente IA, volumen de consultas y cumplimiento de SLAs.",
    "dash.totalQueries": "Consultas Atendidas",
    "dash.resolutionRate": "Resuelto sin Escalamiento",
    "dash.incidentsTotal": "Incidentes Reportados",
    "dash.latencyP95": "Latencia p95",
    "dash.hoursSaved": "Horas Hombre Ahorradas",
    "dash.cacheRatio": "Ratio Hit en Caché",
    "dash.topTopics": "Temas Más Consultados",
    "dash.severityDist": "Distribución por Severidad",

    // Reports
    "reports.title": "Reportes y Exportaciones",
    "reports.subtitle": "Generación de informes de gestión ejecutiva y auditoría técnica.",
    "reports.exportOperational": "Reporte Operativo (30 días)",
    "reports.exportManagement": "Reporte Gerencial (6 meses)",
    "reports.downloadPdf": "Descargar PDF",
    "reports.downloadDocx": "Descargar Word",
    "reports.downloadXlsx": "Descargar Excel",
    "reports.previewTitle": "Vista Previa de Métricas",
    "reports.previewSubtitle": "Métricas operativas del periodo seleccionado previo a la exportación.",
    "reports.recentExports": "Historial de Exportaciones",
    "reports.noExports": "Aún no se han generado exportaciones.",
    "reports.exportTime": "Fecha de Exportación",
    "reports.fileSize": "Tamaño",
    "reports.selectRange": "Ventana Temporal",
    "reports.selectType": "Tipo de Informe",
    "reports.range7": "Últimos 7 días",
    "reports.range30": "Últimos 30 días",
    "reports.range90": "Último Trimestre (90 días)",
    "reports.range180": "Último Semestre (180 días)",
    "reports.generating": "Generando informe...",
    "reports.downloadSuccess": "Reporte descargado exitosamente",
    "reports.kpiTotal": "Consultas Atendidas",
    "reports.kpiResolution": "Resueltas sin Escalamiento",
    "reports.kpiIncidents": "Incidentes Reportados",
    "reports.kpiEscalation": "Tasa de Escalamiento",
    "reports.kpiLatency": "Latencia Promedio",
    "reports.kpiHours": "Horas Hombre Ahorradas",

    // Compliance
    "compliance.title": "Cumplimiento y Evidencias",
    "compliance.subtitle": "Alineación de controles con estándares internacionales de seguridad.",
    "compliance.isoTitle": "ISO/IEC 27001:2022",
    "compliance.nistTitle": "NIST Cybersecurity Framework 2.0",
    "compliance.auditLogs": "Registros de Auditoría Inmutables",
    "compliance.activePolicies": "Políticas de Seguridad Activas",
    "compliance.rbacRoles": "Roles RBAC Implementados",
    "compliance.rbacPerms": "Permisos Finos Asignados",
  },
  en: {
    // Navigation
    "nav.brand": "SecBot",
    "nav.tag": "Security AI",
    "nav.chat": "AI Copilot",
    "nav.dashboard": "Dashboard",
    "nav.tickets": "Incidents & Tickets",
    "nav.kb": "Knowledge Base",
    "nav.reports": "Reports",
    "nav.audit": "Audit Logs",
    "nav.compliance": "Compliance",
    "nav.users": "Users",
    "nav.roles": "Roles",
    "nav.sessions": "Sessions",
    "nav.profile": "My Profile",
    "nav.logout": "Sign Out",
    "nav.menu": "Menu",
    "nav.closeMenu": "Close menu",

    // Common
    "common.loading": "Loading...",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.search": "Search...",
    "common.filter": "Filter",
    "common.all": "All",
    "common.actions": "Actions",
    "common.status": "Status",
    "common.date": "Date",
    "common.view": "View",
    "common.download": "Download",
    "common.back": "Back",
    "common.confirm": "Confirm",
    "common.refresh": "Refresh",
    "common.connected": "SecBot Connected",
    "common.reconnecting": "Reconnecting...",

    // Theme & Lang
    "theme.toLight": "Switch to light mode",
    "theme.toDark": "Switch to dark mode",
    "lang.switch": "Switch language",

    // Chat
    "chat.title": "Enterprise Security Copilot",
    "chat.subtitle": "Answers security policies, operational runbooks and incident guidance with grounded citations.",
    "chat.welcome": "Hello, {name} 👋",
    "chat.promptPlaceholder": "Ask about security policies, passwords, or report an incident...",
    "chat.send": "Send message",
    "chat.history": "Chat History",
    "chat.newChat": "New Consultation",
    "chat.noHistory": "No previous conversations",
    "chat.citations": "Referenced Sources",
    "chat.incidentDetected": "Incident Detected",
    "chat.ticketCreated": "Ticket Created",
    "chat.viewTicket": "View ticket",
    "chat.confidence": "Confidence",
    "chat.latency": "Latency",
    "chat.cached": "Cached",
    "chat.copy": "Copy answer",
    "chat.copied": "Copied!",
    "chat.feedbackPositive": "Helpful answer",
    "chat.feedbackNegative": "Inaccurate answer",
    "chat.scrollToBottom": "Recent messages",

    // Suggestions
    "sugg.passwords": "What is the password complexity and change policy?",
    "sugg.phishing": "How do I report a suspicious phishing email?",
    "sugg.usb": "Can I plug in a personal USB flash drive?",
    "sugg.incident": "I found sensitive company data exposed on a public link",

    // Tickets
    "tickets.title": "Incident & Ticket Management",
    "tickets.subtitle": "Real-time tracking of security alerts and staff reports.",
    "tickets.searchPlaceholder": "Search by ticket #, title, or category...",
    "tickets.newTicket": "+ New Ticket",
    "tickets.statusAll": "All statuses",
    "tickets.statusNuevo": "New",
    "tickets.statusProgreso": "In Progress",
    "tickets.statusResuelto": "Resolved",
    "tickets.statusCerrado": "Closed",
    "tickets.severity": "Severity",
    "tickets.category": "Category",
    "tickets.reportedBy": "Reported by",
    "tickets.assignedTo": "Assigned to",
    "tickets.dueAt": "SLA Deadline",
    "tickets.noTickets": "No tickets found.",
    "tickets.detailTitle": "Incident Details",
    "tickets.resolution": "Resolution / Notes",
    "tickets.updateStatus": "Update Status",

    // KB
    "kb.title": "Security Knowledge Base",
    "kb.subtitle": "Corporate policies, runbooks, and documents indexed for semantic retrieval.",
    "kb.uploadTitle": "Upload new security document",
    "kb.uploadDesc": "Supported formats: Markdown (.md), PDF, Word (.docx), text (.txt). Max 20 MB.",
    "kb.docTitle": "Document title",
    "kb.docType": "Document type",
    "kb.docVersion": "Version",
    "kb.sectionSplit": "Smart split by section headers (#, ##)",
    "kb.uploadBtn": "Ingest document into vector store",
    "kb.statsDocs": "Active Documents",
    "kb.statsChunks": "Vector Chunks",
    "kb.statsObsolete": "Obsolete Documents",
    "kb.markObsolete": "Mark as obsolete",
    "kb.preview": "Preview",
    "kb.previewTitle": "Document Preview",
    "kb.downloadBtn": "Download",
    "kb.downloading": "Downloading...",
    "kb.tabContent": "Full Content",
    "kb.tabChunks": "Vector Chunks",
    "kb.chunkIndex": "Chunk",
    "kb.chunkTokens": "Tokens",
    "kb.section": "Section",
    "kb.noContent": "No content available to preview.",
    "kb.docMetadata": "Document Metadata",

    // Dashboard
    "dash.title": "Security Operations Center & Metrics",
    "dash.subtitle": "AI assistant throughput, query volume, and SLA compliance.",
    "dash.totalQueries": "Queries Handled",
    "dash.resolutionRate": "Resolved without Escalation",
    "dash.incidentsTotal": "Reported Incidents",
    "dash.latencyP95": "p95 Latency",
    "dash.hoursSaved": "Hours Saved",
    "dash.cacheRatio": "Cache Hit Ratio",
    "dash.topTopics": "Frequently Asked Topics",
    "dash.severityDist": "Severity Distribution",

    // Reports
    "reports.title": "Reports & Exports",
    "reports.subtitle": "Executive management and technical audit report generation.",
    "reports.exportOperational": "Operational Report (30 days)",
    "reports.exportManagement": "Management Report (6 months)",
    "reports.downloadPdf": "Download PDF",
    "reports.downloadDocx": "Download Word",
    "reports.downloadXlsx": "Download Excel",
    "reports.previewTitle": "Live Metrics Preview",
    "reports.previewSubtitle": "Operational performance metrics for the selected time window.",
    "reports.recentExports": "Export History",
    "reports.noExports": "No reports exported yet.",
    "reports.exportTime": "Export Date",
    "reports.fileSize": "File Size",
    "reports.selectRange": "Time Range",
    "reports.selectType": "Report Type",
    "reports.range7": "Last 7 days",
    "reports.range30": "Last 30 days",
    "reports.range90": "Last Quarter (90 days)",
    "reports.range180": "Last Semester (180 days)",
    "reports.generating": "Generating report...",
    "reports.downloadSuccess": "Report downloaded successfully",
    "reports.kpiTotal": "Total Queries Handled",
    "reports.kpiResolution": "Resolved without Escalation",
    "reports.kpiIncidents": "Reported Incidents",
    "reports.kpiEscalation": "Escalation Rate",
    "reports.kpiLatency": "Avg Latency",
    "reports.kpiHours": "Hours Saved",

    // Compliance
    "compliance.title": "Compliance & Audit Evidence",
    "compliance.subtitle": "Security control alignment with international standards.",
    "compliance.isoTitle": "ISO/IEC 27001:2022",
    "compliance.nistTitle": "NIST Cybersecurity Framework 2.0",
    "compliance.auditLogs": "Immutable Audit Log Entries",
    "compliance.activePolicies": "Active Security Policies",
    "compliance.rbacRoles": "Implemented RBAC Roles",
    "compliance.rbacPerms": "Fine-Grained Permissions",
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("secbot_lang");
      if (saved === "es" || saved === "en") return saved;
      const navLang = navigator.language?.toLowerCase();
      if (navLang?.startsWith("en")) return "en";
    }
    return "es";
  });

  useEffect(() => {
    localStorage.setItem("secbot_lang", lang);
    document.documentElement.setAttribute("lang", lang);
  }, [lang]);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === "es" ? "en" : "es"));
  }, []);

  const setLang = useCallback((newLang) => {
    if (newLang === "es" || newLang === "en") setLangState(newLang);
  }, []);

  const t = useCallback(
    (key, params = {}) => {
      let str = TRANSLATIONS[lang]?.[key] || TRANSLATIONS.es[key] || key;
      if (typeof str === "string" && Object.keys(params).length > 0) {
        Object.entries(params).forEach(([k, v]) => {
          str = str.replace(`{${k}}`, v);
        });
      }
      return str;
    },
    [lang]
  );

  const value = useMemo(
    () => ({ lang, setLang, toggleLang, t }),
    [lang, setLang, toggleLang, t]
  );

  return <LanguageCtx.Provider value={value}>{children}</LanguageCtx.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageCtx);
  if (!ctx) {
    // Graceful fallback if rendered outside LanguageProvider (e.g. isolated test)
    return {
      lang: "es",
      setLang: () => {},
      t: (key, params) => {
        let text = TRANSLATIONS.es[key] || key;
        if (params && typeof params === "object") {
          Object.entries(params).forEach(([k, v]) => {
            text = text.replace(new RegExp(`{${k}}`, "g"), String(v));
          });
        }
        return text;
      },
    };
  }
  return ctx;
}
