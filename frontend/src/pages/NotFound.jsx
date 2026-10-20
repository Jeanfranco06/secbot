import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="container" style={{ textAlign: "center", padding: 64 }}>
      <h1>404</h1>
      <p>La página que buscas no existe.</p>
      <Link className="btn btn-primary" to="/chat">Volver al chat</Link>
    </div>
  );
}