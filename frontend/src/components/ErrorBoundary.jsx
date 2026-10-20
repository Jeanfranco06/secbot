import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    // En producción, reenviar a Sentry/OTel
    // eslint-disable-next-line no-console
    console.error("UI ErrorBoundary:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="container" role="alert">
          <h1>Algo salió mal</h1>
          <p>Se produjo un error inesperado en la interfaz.</p>
          <details style={{ whiteSpace: "pre-wrap", color: "var(--c-text-muted)" }}>
            {String(this.state.error?.message || this.state.error)}
          </details>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Recargar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}