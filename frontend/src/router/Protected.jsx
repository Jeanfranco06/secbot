import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/ui";

export function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <div className="container"><Spinner /></div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children ?? <Outlet />;
}

export function RequirePermission({ permission, anyOf, children }) {
  const { has, hasAny, loading } = useAuth();
  if (loading) return <div className="container"><Spinner /></div>;

  const ok = permission ? has(permission) : anyOf ? hasAny(...anyOf) : true;
  if (!ok) {
    return (
      <div className="container" role="alert">
        <h2>Acceso denegado</h2>
        <p>No tienes permisos para ver esta sección.</p>
      </div>
    );
  }
  return children ?? <Outlet />;
}