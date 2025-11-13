import { useAuth } from "../../../app/providers/AuthContext";

export default function HomePage() {
  const { me, logout } = useAuth();
  return (
    <div className="h-screen grid place-items-center">
      <div className="text-center space-y-3">
        <h1 className="text-2xl font-bold">Bienvenido, {me?.display_name || me?.email}</h1>
        <p>Ruta protegida lista para conectar con el chat.</p>
        <button onClick={logout} className="border px-3 py-1 rounded">Salir</button>
      </div>
    </div>
  );
}
