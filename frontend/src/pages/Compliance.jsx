import { useEffect, useState } from "react";
import { complianceApi } from "@/lib/api";
import { useToast } from "@/context/ToastContext";
import { Card, Spinner, Badge } from "@/ui";

export default function Compliance() {
  const toast = useToast();
  const [data, setData] = useState(null);

  useEffect(() => {
    complianceApi.evidence().then(setData).catch((e) => toast.error(e.message));
  }, [toast]);

  if (!data) {
    return (
      <div className="container" style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
        <Spinner />
      </div>
    );
  }

  const blocks = [
    {
      title: "ISO/IEC 27001:2022",
      subtitle: "Sistema de Gestión de Seguridad de la Información (SGSI)",
      badge: "Estándar Global",
      items: data.iso_27001_2022 || {},
    },
    {
      title: "NIST CSF 2.0",
      subtitle: "Cybersecurity Framework del National Institute of Standards and Technology",
      badge: "Marco de Referencia",
      items: data.nist_csf_2_0 || {},
    },
  ];

  return (
    <div className="container">
      <div className="mb-5">
        <h1>Evidencia de Cumplimiento & Estándares</h1>
        <p className="text-muted text-sm mt-1">
          Mapeo orientativo de controles y capacidades técnicas de SecBot frente a normas de seguridad internacionales.
        </p>
      </div>

      <div className="grid grid-2">
        {blocks.map((b) => (
          <Card key={b.title} padding="lg">
            <div className="card-head">
              <div>
                <h3 className="card-title">{b.title}</h3>
                <div className="text-xs text-muted mt-1">{b.subtitle}</div>
              </div>
              <Badge tone="info">{b.badge}</Badge>
            </div>

            <dl className="def-list" style={{ marginTop: 16 }}>
              {Object.entries(b.items).map(([k, v]) => (
                <div key={k} style={{ display: "contents" }}>
                  <dt>{k.replace(/_/g, " ").toUpperCase()}</dt>
                  <dd>
                    <span
                      style={{
                        background: "var(--c-bg-subtle)",
                        padding: "3px 8px",
                        borderRadius: "var(--r-xs)",
                        fontWeight: 600,
                        fontSize: 12,
                        border: "1px solid var(--c-border)",
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
    </div>
  );
}