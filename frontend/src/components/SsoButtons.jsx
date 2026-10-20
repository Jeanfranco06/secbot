import { useEffect, useState } from "react";

export default function SsoButtons() {
  const [providers, setProviders] = useState({});

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/api/v1/sso/providers`)
      .then((r) => r.json())
      .then(setProviders);
  }, []);

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:8000";

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      {Object.entries(providers).filter(([, on]) => on).map(([name]) => (
        <a key={name} href={`${apiBase}/api/v1/sso/${name}/login`}
           style={{ padding: "8px 14px", border: "1px solid #ccc", borderRadius: 8, textDecoration: "none" }}>
          Entrar con {name}
        </a>
      ))}
    </div>
  );
}