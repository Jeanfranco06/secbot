/**
 * Official Assistant Avatar for SecBot AI Copilot
 * Scalable SVG with animated glowing neural visor and cyber-shield contours
 */
export function SecBotAvatar({ size = 32, animated = false, className = "" }) {
  const s = size;

  return (
    <div
      className={`secbot-avatar-container ${className} ${animated ? "avatar-pulse" : ""}`}
      style={{
        width: s,
        height: s,
        borderRadius: "28%",
        background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 45%, #06b6d4 100%)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        boxShadow: "0 2px 10px rgba(99, 102, 241, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <svg
        width={s * 0.75}
        height={s * 0.75}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="avatar-visor-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="50%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>

        {/* Head Contours / Helmet Geometry */}
        <path
          d="M16 3C8.8 3 4 8 4 14.5C4 21 8.5 27 16 29C23.5 27 28 21 28 14.5C28 8 23.2 3 16 3Z"
          fill="#090a10"
          fillOpacity="0.4"
        />

        {/* Outer Shield Ridge */}
        <path
          d="M16 4.5L6 9.5V15.5C6 22 10.5 26.5 16 28C21.5 26.5 26 22 26 15.5V9.5L16 4.5Z"
          stroke="#ffffff"
          strokeWidth="1.2"
          strokeOpacity="0.8"
        />

        {/* Cyber Visor (Eye Screen) */}
        <rect
          x="8.5"
          y="12"
          width="15"
          height="5.5"
          rx="2.75"
          fill="url(#avatar-visor-grad)"
          style={{ filter: "drop-shadow(0 0 4px #06b6d4)" }}
        />

        {/* Visor Cyber Glint Eyes */}
        <circle cx="12" cy="14.75" r="1.25" fill="#ffffff" />
        <circle cx="20" cy="14.75" r="1.25" fill="#ffffff" />

        {/* Antenna / Communication Beacon */}
        <path d="M16 1.5V4" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="16" cy="1.5" r="1" fill="#22d3ee" />

        {/* Lower Chin Shield / Circuit Accent */}
        <path d="M13 21H19" stroke="#38bdf8" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
        <path d="M14.5 23.5H17.5" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
      </svg>
    </div>
  );
}

export default SecBotAvatar;
