/**
 * Official Brand Logo for SecBot Enterprise AI Security Platform
 * Vector SVG with gradient neural shield and cyber core
 */
export function SecBotLogo({ size = 36, showText = true, className = "", subtitle = "AI Security" }) {
  const iconSize = size;

  return (
    <div className={`secbot-brand-logo ${className}`} style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="secbot-logo-svg"
        style={{ flexShrink: 0, filter: "drop-shadow(0 2px 8px rgba(99, 102, 241, 0.4))" }}
      >
        <defs>
          <linearGradient id="secbot-shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
          <linearGradient id="secbot-core-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id="secbot-border-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.4" />
          </linearGradient>
        </defs>

        {/* Outer Shield Geometry */}
        <path
          d="M24 4L7 11.5V23C7 33.5 14.5 41.5 24 44C33.5 41.5 41 33.5 41 23V11.5L24 4Z"
          fill="url(#secbot-shield-grad)"
        />

        {/* Inner Facet / Dark Backdrop for depth */}
        <path
          d="M24 7L10 13.2V22.5C10 31.2 16.2 38 24 40.5C31.8 38 38 31.2 38 22.5V13.2L24 7Z"
          fill="#090a10"
          fillOpacity="0.35"
        />

        {/* Cyber Shield Rim Line */}
        <path
          d="M24 8.5L11.5 14.2V22.8C11.5 30.5 17 36.8 24 39.2C31 36.8 36.5 30.5 36.5 22.8V14.2L24 8.5Z"
          stroke="url(#secbot-border-glow)"
          strokeWidth="1.2"
        />

        {/* Neural AI Core Node */}
        <circle cx="24" cy="23" r="5" fill="url(#secbot-core-grad)" />
        <circle cx="24" cy="23" r="8" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 2" opacity="0.85" />

        {/* Hex Circuits */}
        <path d="M24 15V11" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        <path d="M24 31V35" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        <path d="M17 23H13" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
        <path d="M35 23H31" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />

        {/* Central Core Glint */}
        <circle cx="22.5" cy="21.5" r="1.5" fill="#ffffff" opacity="0.9" />
      </svg>

      {showText && (
        <div className="secbot-brand-text" style={{ display: "flex", flexDirection: "column" }}>
          <span
            className="secbot-brand-title"
            style={{
              fontSize: "17px",
              fontWeight: 800,
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
              color: "var(--c-text)",
            }}
          >
            Sec<span style={{ color: "var(--c-primary)" }}>Bot</span>
          </span>
          <span
            className="secbot-brand-sub"
            style={{
              fontSize: "10px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--c-cyan)",
              lineHeight: 1.1,
            }}
          >
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
}

export default SecBotLogo;
