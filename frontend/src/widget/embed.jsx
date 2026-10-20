/**
 * Widget embebible. Se inyecta con:
 *   <script src="https://cdn.empresa.local/secbot-widget.js"
 *           data-api="https://api.secbot.empresa.local"></script>
 */
import { createRoot } from "react-dom/client";
import ChatWidget from "./ChatWidget";
import "../styles/global.css";

(function init() {
  const script = document.currentScript;
  const apiUrl = script?.dataset?.api || window.SECBOT_API || "";
  window.SECBOT_API_URL = apiUrl;

  const container = document.createElement("div");
  container.id = "secbot-widget-root";
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<ChatWidget apiUrl={apiUrl} />);
})();