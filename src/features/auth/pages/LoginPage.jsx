import { useState } from "react";
import { useAuth } from "../../../app/providers/AuthContext";
import { Navigate } from "react-router-dom";

export default function LoginPage() {
  const { me, login } = useAuth();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false); const [error, setError] = useState(null);

  if (me) return <Navigate to="/" replace />;

  const onSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(null);
    try { await login({ email, password }); } 
    catch { setError("Credenciales inválidas"); } 
    finally { setLoading(false); }
  };

  return (
    <div className="h-screen grid place-items-center">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 p-6 border rounded">
        <h1 className="text-xl font-semibold">Iniciar sesión</h1>
        <input className="w-full border px-3 py-2 rounded" placeholder="Email"
               value={email} onChange={(e)=>setEmail(e.target.value)} />
        <input className="w-full border px-3 py-2 rounded" type="password" placeholder="Password"
               value={password} onChange={(e)=>setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button disabled={loading} className="w-full bg-black text-white py-2 rounded">
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </div>
  );
}
