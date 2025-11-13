import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthContext";

export default function ProtectedRoute() {
  const { me, loading } = useAuth();
  if (loading) return <div style={{ padding: 24 }}>Cargando…</div>;
  return me ? <Outlet /> : <Navigate to="/login" replace />;
}
