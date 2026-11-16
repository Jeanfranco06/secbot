import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { chatApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useLanguage } from "@/context/LanguageContext";
import { Icon } from "@/components/Icon";
import { SecBotAvatar } from "@/components/SecBotAvatar";
import { useChatSocket } from "@/hooks/useChatSocket";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatComposer from "@/components/chat/ChatComposer";
import ChatHistoryList from "@/components/chat/ChatHistoryList";
import { Button, Modal, Input, Textarea, Spinner } from "@/ui";
import "./chat.css";

export default function Chat() {
  const { user } = useAuth();
  const toast = useToast();
  const { t } = useLanguage();
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isResponding, setIsResponding] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    return window.innerWidth >= 960;
  });
  const [refreshHistoryTrigger, setRefreshHistoryTrigger] = useState(0);
  const scrollAreaRef = useRef(null);
  const isAutoScrollActiveRef = useRef(true);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  // Estados del Analizador Anti-Phishing
  const [phishingModalOpen, setPhishingModalOpen] = useState(false);
  const [emailForm, setEmailForm] = useState({ sender: "", subject: "", body: "" });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  // Resize listener for responsive default
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 860 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [sidebarOpen]);

  // WebSocket message handlers
  const socketHandlers = useMemo(
    () => ({
      onChatId: (id) => {
        setChatId(id);
        setRefreshHistoryTrigger((v) => v + 1);
      },
      onToken: (tokenText) => {
        setIsResponding(true);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant" && last.streaming) {
            return [...prev.slice(0, -1), { ...last, content: last.content + tokenText }];
          }
          return [
            ...prev,
            {
              role: "assistant",
              content: tokenText,
              streaming: true,
              citations: [],
              created_at: new Date().toISOString(),
            },
          ];
        });
      },
      onCitation: (citation) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last) return prev;
          const exists = (last.citations || []).some((x) => x.index === citation.index);
          if (exists) return prev;
          return [...prev.slice(0, -1), { ...last, citations: [...(last.citations || []), citation] }];
        });
      },
      onTicket: (ticketData) => {
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last) return prev;
          return [...prev.slice(0, -1), { ...last, ticket: ticketData }];
        });
      },
      onDone: (meta) => {
        setIsResponding(false);
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (!last) return prev;
          return [...prev.slice(0, -1), { ...last, streaming: false, ...meta }];
        });
        setRefreshHistoryTrigger((v) => v + 1);
      },
      onError: (msg) => {
        setIsResponding(false);
        if (msg && !msg.includes("empty")) {
          toast.error(msg);
        }
      },
    }),
    [toast]
  );

  const { send, connected } = useChatSocket(socketHandlers);

  // Scroll position monitor to know if the user is reviewing history or following the feed
  const handleScroll = useCallback(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isAtBottom = distanceFromBottom <= 120;
    isAutoScrollActiveRef.current = isAtBottom;
    setShowScrollBottom(!isAtBottom && el.scrollHeight > el.clientHeight + 100);
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollAreaRef.current;
    if (!el) return;
    isAutoScrollActiveRef.current = true;
    setShowScrollBottom(false);
    if (smooth) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  // Direct scrollTop assignment during streaming without window-jumping smooth animations
  useEffect(() => {
    if (!isAutoScrollActiveRef.current) return;
    const el = scrollAreaRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, isResponding]);

  const submit = useCallback(
    (text) => {
      setMessages((m) => [
        ...m,
        { role: "user", content: text, created_at: new Date().toISOString() },
      ]);
      setIsResponding(true);
      isAutoScrollActiveRef.current = true;
      setShowScrollBottom(false);
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      });
      send(text, chatId);
    },
    [send, chatId]
  );

  const openChat = async (id) => {
    try {
      const data = await chatApi.chat(id);
      setChatId(id);
      setIsResponding(false);
      isAutoScrollActiveRef.current = true;
      setShowScrollBottom(false);
      setMessages(
        data.messages.map((m) => ({
          message_id: m.id,
          role: m.role,
          content: m.content,
          citations: m.citations,
          streaming: false,
          created_at: m.created_at,
          cached: m.cached,
          latency_ms: m.latency_ms,
        }))
      );
      if (window.innerWidth < 860) {
        setSidebarOpen(false);
      }
      requestAnimationFrame(() => {
        if (scrollAreaRef.current) {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
      });
    } catch (e) {
      toast.error(e.message || "Error al cargar la conversación");
    }
  };

  const newChat = () => {
    setChatId(null);
    setMessages([]);
    setIsResponding(false);
    isAutoScrollActiveRef.current = true;
    setShowScrollBottom(false);
    if (window.innerWidth < 860) {
      setSidebarOpen(false);
    }
  };


  const handleAnalyzeEmail = async () => {
    if (!emailForm.sender.trim() && !emailForm.body.trim()) {
      toast.error('Ingresa al menos el remitente o el cuerpo del correo.');
      return;
    }
    setAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await chatApi.analyzeEmail(emailForm);
      setAnalysisResult(res);
      toast.success('Análisis heurístico completado');
    } catch (e) {
      toast.error(e.message || 'Error al analizar el correo');
    } finally {
      setAnalyzing(false);
    }
  };

  const loadPhishingPreset = () => {
    setEmailForm({
      sender: 'security-update@micros0ft-corp-security.com',
      subject: 'URGENTE: Su cuenta corporativa será bloqueada en 2 horas',
      body: 'Estimado colaborador,\n\nSe han detectado múltiples intentos fallidos de inicio de sesión en su cuenta de Microsoft 365. Para evitar el bloqueo permanente de sus accesos y su nómina empresarial, confirme sus credenciales en nuestro servidor de contingencia:\n\nhttp://194.26.29.112/auth/login-verify.php\n\nTiene un plazo improrrogable de 120 minutos.\n\nAtentamente,\nDepartamento de TI & Soporte de Seguridad',
    });
    setAnalysisResult(null);
  };

  const loadLegitPreset = () => {
    setEmailForm({
      sender: 'notificaciones@empresa.com',
      subject: 'Recordatorio: Sesión informativa mensual sobre ciberseguridad',
      body: 'Estimado equipo,\n\nLes recordamos que este viernes a las 10:00 AM tendremos nuestra charla informativa sobre buenas prácticas en el manejo de datos y prevención de fraudes.\n\nPueden consultar el calendario y los temas en el portal oficial de la intranet interna.\n\nSaludos cordiales,\nOficina de Seguridad de la Información',
    });
    setAnalysisResult(null);
  };

  const sendEmailReportToChat = (result) => {
    if (!result) return;
    const reportPrompt = `He recibido un correo sospechoso y lo analicé con la herramienta heurística anti-phishing.
Remitente: ${emailForm.sender || 'No especificado'}
Asunto: ${emailForm.subject || 'Sin asunto'}
Veredicto del Analizador: ${result.verdict} (Riesgo: ${result.risk_score}/100)
Evidencias detectadas:
${(result.red_flags || []).map((f) => `- [${f.severity}] ${f.name}: ${f.detail}`).join('\n')}

Por favor, asesórame sobre las medidas de contención según nuestras normativas internas y si debo reportar un ticket P1/P2.`;
    setPhishingModalOpen(false);
    submit(reportPrompt);
  };

  const suggestions = [
    {
      icon: "key",
      color: "cyan",
      title: "¿Cuál es la política de contraseñas?",
      desc: "Requisitos de longitud, caducidad y complejidad corporativa",
      query: "¿Cuál es la política de complejidad y cambio de contraseñas?",
    },
    {
      icon: "shield-alert",
      color: "amber",
      title: "¿Cómo reportar correo sospechoso?",
      desc: "Protocolo para posibles intentos de phishing o estafa",
      query: "¿Qué debo hacer si recibo un correo sospechoso de phishing?",
    },
    {
      icon: "lock",
      color: "mint",
      title: "¿Uso de USBs o medios externos?",
      desc: "Restricciones sobre dispositivos personales o no autorizados",
      query: "¿Puedo conectar una memoria USB personal o no homologada?",
    },
    {
      icon: "alert-triangle",
      color: "purple",
      title: "Reportar incidente de seguridad",
      desc: "Criterios para declarar un evento crítico o fuga de datos",
      query: "¿Cómo reportar un incidente de seguridad y qué niveles de severidad existen?",
    },
  ];

  return (
    <div className={`chat-layout ${sidebarOpen ? "sidebar-expanded" : "sidebar-collapsed"}`}>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="chat-mobile-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Historial */}
      <aside className={`chat-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-left">
            <Icon name="clock" size={14} className="sidebar-icon" />
            <span className="sidebar-title">{t("chat.history") || "Conversaciones"}</span>
          </div>

          <button
            type="button"
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            title="Ocultar panel lateral"
          >
            <Icon name="chevron-down" size={14} className="icon-rotate-left" />
          </button>
        </div>

        {/* Primary New Chat CTA in Sidebar */}
        <div className="sidebar-action-wrap">
          <button
            type="button"
            className="sidebar-new-chat-btn"
            onClick={newChat}
            title="Iniciar nueva consulta"
          >
            <Icon name="plus" size={14} />
            <span>{t("chat.newChat") || "Nueva consulta"}</span>
          </button>
        </div>

        <div className="sidebar-body">
          <ChatHistoryList
            onSelect={openChat}
            activeId={chatId}
            refreshTrigger={refreshHistoryTrigger}
          />
        </div>
      </aside>

      {/* Main Full-Width Chat Arena */}
      <main className="chat-main full-width-chat">
        {/* Top Chat Bar */}
        <header className="chat-navbar">
          <div className="navbar-left">
            <button
              type="button"
              className="navbar-toggle-btn"
              onClick={() => setSidebarOpen((v) => !v)}
              title={sidebarOpen ? "Ocultar panel lateral" : "Mostrar historial"}
              aria-label="Alternar historial"
            >
              <Icon name="sidebar" size={16} />
            </button>

            {!sidebarOpen && (
              <button
                type="button"
                className="navbar-new-chat-btn animate-fade-in"
                onClick={newChat}
                title="Iniciar nueva consulta"
              >
                <Icon name="plus" size={13} />
                <span>{t("chat.newChat") || "Nueva consulta"}</span>
              </button>
            )}
          </div>

          <div className="navbar-center">
            <div className="chat-model-indicator">
              <SecBotAvatar size={24} />
              <span className="model-name">SecBot Copilot</span>
              {isResponding ? (
                <span className="responding-pill">
                  <span className="responding-dot" />
                  <span>generando respuesta...</span>
                </span>
              ) : (
                <span className="model-badge">RAG Active · v2.1</span>
              )}
            </div>
          </div>

          <div className="navbar-right">
            <button
              type="button"
              className="navbar-phishing-btn"
              onClick={() => setPhishingModalOpen(true)}
              title="Analizador Heurístico de Correos Sospechosos / Anti-Phishing"
            >
              <Icon name="mail" size={14} />
              <span>Analizar Correo</span>
            </button>
            <div className={`connection-pill ${connected ? "connected" : "reconnecting"}`}>
              <span className="connection-dot" />
              <span className="connection-text">
                {connected ? (t("common.connected") || "En línea") : (t("common.reconnecting") || "Reconectando...")}
              </span>
            </div>
          </div>
        </header>

        {/* Full-Width Message Feed Scroll Area */}
        <div
          ref={scrollAreaRef}
          onScroll={handleScroll}
          className="chat-scroll-area"
          role="log"
          aria-live="polite"
          aria-label="Conversación"
        >
          <div className="chat-reading-container full-width-container">
            {messages.length === 0 ? (
              <div className="chat-welcome-hero animate-fade-in">
                <div className="welcome-badge">
                  <Icon name="shield-check" size={14} />
                  <span>Copiloto de Seguridad & Cumplimiento Normativo</span>
                </div>

                <h1 className="welcome-title">
                  {t("chat.welcome", { name: user?.full_name?.split(" ")[0] || "Equipo" })}
                </h1>

                <p className="welcome-subtitle">
                  {t("chat.subtitle") ||
                    "Consulta las normativas internas, resuelve dudas de cumplimiento o reporta incidentes en tiempo real."}
                </p>

                <div className="suggestions-grid">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className={`suggestion-card card-${s.color}`}
                      onClick={() => submit(s.query)}
                      title={`Preguntar: ${s.query}`}
                    >
                      <div className={`suggestion-icon-wrap icon-${s.color}`}>
                        <Icon name={s.icon} size={18} />
                      </div>
                      <div className="suggestion-content">
                        <span className="suggestion-title">{s.title}</span>
                        <span className="suggestion-desc">{s.desc}</span>
                      </div>
                      <Icon name="chevron-right" size={14} className="suggestion-arrow" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="messages-stream">
                {messages.map((m, i) => (
                  <ChatMessage key={m.message_id || i} message={m} />
                ))}

                {/* Original SecBot Neural Responding Indicator */}
                {isResponding && messages[messages.length - 1]?.role === "user" && (
                  <div className="msg-row msg-row-bot animate-fade-in">
                    <div className="msg-card-bot bot-typing-card">
                      <div className="typing-header-row">
                        <SecBotAvatar size={26} animated={true} />
                        <span className="typing-bot-name">SecBot Copilot</span>
                        <span className="typing-status-text">analizando normativas y generando respuesta...</span>
                      </div>
                      <div className="typing-wave-container">
                        <span className="wave-bar bar-1" />
                        <span className="wave-bar bar-2" />
                        <span className="wave-bar bar-3" />
                        <span className="wave-bar bar-4" />
                        <span className="wave-bar bar-5" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Scroll to bottom floating action button */}
        {showScrollBottom && (
          <button
            type="button"
            className="chat-scroll-bottom-btn animate-fade-in"
            onClick={() => scrollToBottom(true)}
            title="Ir al final de la conversación"
            aria-label="Ir al final de la conversación"
          >
            <Icon name="chevron-down" size={14} />
            <span>{t("chat.scrollToBottom") || "Mensajes recientes"}</span>
          </button>
        )}

        {/* Floating Full-Width Composer Dock */}
        <footer className="chat-composer-dock full-width-dock">
          <ChatComposer onSend={submit} disabled={!connected} />
        </footer>
      </main>

      {/* Modal Analizador Heurístico de Phishing */}
      <Modal
        isOpen={phishingModalOpen}
        onClose={() => setPhishingModalOpen(false)}
        title="🛡️ Analizador Heurístico de Correos Sospechosos / Anti-Phishing"
        size="lg"
      >
        <div className="phishing-analyzer-modal">
          <p className="phishing-intro-text">
            Evalúa correos electrónicos sospechosos mediante análisis heurístico de dominios, palabras clave de urgencia psicológica, trampas de recolección de credenciales y reputación de enlaces.
          </p>

          <div className="phishing-presets-bar">
            <span className="presets-label">Demos de prueba:</span>
            <button type="button" className="preset-chip preset-phishing" onClick={loadPhishingPreset}>
              ⚡ Cargar Caso Phishing
            </button>
            <button type="button" className="preset-chip preset-legit" onClick={loadLegitPreset}>
              ✅ Cargar Caso Legítimo
            </button>
            <button
              type="button"
              className="preset-chip preset-clear"
              onClick={() => {
                setEmailForm({ sender: '', subject: '', body: '' });
                setAnalysisResult(null);
              }}
            >
              Limpiar
            </button>
          </div>

          <div className="phishing-form-grid">
            <div className="form-field">
              <label>Remitente (From):</label>
              <Input
                placeholder="ej: security@micros0ft-support.com o alert@bank-secure.net"
                value={emailForm.sender}
                onChange={(e) => setEmailForm((prev) => ({ ...prev, sender: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Asunto (Subject):</label>
              <Input
                placeholder="ej: URGENTE: Bloqueo inminente de su cuenta corporativa"
                value={emailForm.subject}
                onChange={(e) => setEmailForm((prev) => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="form-field">
              <label>Cuerpo del Mensaje (Body / Enlaces):</label>
              <Textarea
                rows={5}
                placeholder="Pega aquí el contenido textual o enlaces del correo sospechoso..."
                value={emailForm.body}
                onChange={(e) => setEmailForm((prev) => ({ ...prev, body: e.target.value }))}
              />
            </div>
          </div>

          <div className="phishing-actions-row">
            <Button
              variant="primary"
              onClick={handleAnalyzeEmail}
              disabled={analyzing || (!emailForm.sender && !emailForm.body)}
            >
              {analyzing ? <Spinner size="sm" /> : <Icon name="shield-check" size={16} />}
              <span>{analyzing ? 'Inspeccionando correo...' : 'Ejecutar Análisis Heurístico'}</span>
            </Button>
          </div>

          {analysisResult && (
            <div className={`phishing-results-card verdict-${analysisResult.verdict === 'PHISHING CRÍTICO' ? 'critical' : analysisResult.verdict === 'CORREO SOSPECHOSO' ? 'warning' : 'safe'}`}>
              <div className="phishing-result-header">
                <div className="verdict-badge-box">
                  <span className="verdict-title">VEREDICTO HEURÍSTICO:</span>
                  <span className="verdict-tag">{analysisResult.verdict}</span>
                </div>
                <div className="risk-score-box">
                  <span className="score-number">{analysisResult.risk_score}</span>
                  <span className="score-scale">/100 Riesgo</span>
                </div>
              </div>

              <div className="risk-meter-bar">
                <div
                  className="risk-meter-fill"
                  style={{
                    width: `${analysisResult.risk_score}%`,
                    backgroundColor:
                      analysisResult.risk_score >= 70
                        ? 'var(--c-danger, #ef4444)'
                        : analysisResult.risk_score >= 40
                        ? 'var(--c-warning, #f59e0b)'
                        : 'var(--c-mint, #10b981)',
                  }}
                />
              </div>

              {analysisResult.red_flags && analysisResult.red_flags.length > 0 && (
                <div className="phishing-flags-section">
                  <h4>🚩 Indicadores de Amenaza Detectados ({analysisResult.red_flags.length}):</h4>
                  <div className="flags-list">
                    {analysisResult.red_flags.map((flag, idx) => (
                      <div key={idx} className={`flag-item flag-${flag.severity.toLowerCase()}`}>
                        <div className="flag-head">
                          <span className="flag-severity">{flag.severity}</span>
                          <span className="flag-name">{flag.name}</span>
                        </div>
                        <p className="flag-detail">{flag.detail}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {analysisResult.iocs && (
                <div className="phishing-iocs-section">
                  <h4>🔍 Elementos de Red Detectados:</h4>
                  <div className="iocs-chips-grid">
                    {analysisResult.iocs.urls?.map((u, i) => (
                      <span key={i} className="ioc-chip ioc-url">🔗 {u}</span>
                    ))}
                    {analysisResult.iocs.ips?.map((ip, i) => (
                      <span key={i} className="ioc-chip ioc-ip">🌐 {ip}</span>
                    ))}
                    {analysisResult.iocs.domains?.map((d, i) => (
                      <span key={i} className="ioc-chip ioc-domain">🏢 {d}</span>
                    ))}
                    {(!analysisResult.iocs.urls?.length && !analysisResult.iocs.ips?.length && !analysisResult.iocs.domains?.length) && (
                      <span className="text-muted text-sm">No se detectaron IoCs externos en el cuerpo.</span>
                    )}
                  </div>
                </div>
              )}

              {analysisResult.recommendations && analysisResult.recommendations.length > 0 && (
                <div className="phishing-recs-section">
                  <h4>🛡️ Recomendaciones de Contención Inmediata:</h4>
                  <ul className="recs-bullet-list">
                    {analysisResult.recommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="phishing-copilot-cta">
                <Button
                  variant="secondary"
                  onClick={() => sendEmailReportToChat(analysisResult)}
                >
                  <Icon name="bot" size={16} />
                  <span>Consultar Contención con el Copilot de Seguridad</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}
