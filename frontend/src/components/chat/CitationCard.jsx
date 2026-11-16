import { useState } from "react";
import { Icon } from "@/components/Icon";

export default function CitationCard({ citation }) {
  const [expanded, setExpanded] = useState(false);

  // Categorize document by title
  const getDocType = (title = "") => {
    const t = title.toLowerCase();
    if (t.includes("política") || t.includes("politica")) {
      return { label: "POLÍTICA", icon: "shield-check", color: "cyan" };
    }
    if (t.includes("faq")) {
      return { label: "FAQ", icon: "help-circle", color: "purple" };
    }
    if (t.includes("runbook") || t.includes("procedimiento") || t.includes("guía")) {
      return { label: "RUNBOOK", icon: "terminal", color: "amber" };
    }
    return { label: "NORMATIVA", icon: "file-text", color: "mint" };
  };

  const docType = getDocType(citation.title);

  return (
    <div
      className={`citation-card type-${docType.color} ${expanded ? "expanded" : ""}`}
      onClick={() => setExpanded((v) => !v)}
      title="Clic para ver detalles y fragmento de la fuente"
    >
      <div className="citation-top-row">
        <div className="citation-badge-group">
          <span className="citation-badge-idx">[{citation.index}]</span>
          <span className={`citation-type-pill pill-${docType.color}`}>
            <Icon name={docType.icon} size={11} />
            <span>{docType.label}</span>
          </span>
        </div>

        {citation.section && (
          <span className="citation-section-chip" title={citation.section}>
            § {citation.section}
          </span>
        )}
      </div>

      <div className="citation-body-row">
        <span className="citation-full-title" title={citation.title}>
          {citation.title}
        </span>
      </div>

      {expanded && citation.snippet && (
        <div className="citation-snippet-box animate-fade-in">
          <p className="citation-snippet-text">{citation.snippet}</p>
        </div>
      )}
    </div>
  );
}

export function CitationsList({ citations }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="citations-tray">
      <div
        className="citations-tray-header"
        onClick={() => setIsCollapsed((v) => !v)}
        role="button"
        tabIndex={0}
      >
        <div className="citations-tray-title">
          <Icon name="file-text" size={13} className="citations-title-icon" />
          <span>Fuentes normativas verificadas ({citations.length})</span>
        </div>
        <button
          type="button"
          className="citations-tray-toggle"
          aria-label={isCollapsed ? "Ver fuentes" : "Ocultar fuentes"}
        >
          <Icon name={isCollapsed ? "chevron-down" : "chevron-up"} size={12} />
          <span>{isCollapsed ? "Ver fuentes" : "Ocultar"}</span>
        </button>
      </div>

      {!isCollapsed && (
        <div className="citations-grid animate-fade-in">
          {citations.map((c, i) => (
            <CitationCard key={c.index || i} citation={c} />
          ))}
        </div>
      )}
    </div>
  );
}
