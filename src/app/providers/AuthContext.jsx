// AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { http } from "../lib/http";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const { data } = await http.get("/auth/me/");
      setMe(data);
      return data; // ⬅️ devuelve el user
    } catch {
      setMe(null);
      return null;
    }
  };

  const refresh = async () => {
    try { await http.post("/auth/refresh/"); } catch {}
  };

  const login = async ({ email, password }) => {
    await http.post("/auth/login/", { email, password }); // cookies seteadas
    await fetchMe(); // carga el perfil
  };

  const logout = async () => {
    try { await http.post("/auth/logout/"); } finally { setMe(null); }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const user = await fetchMe();       // intenta con access
      if (!user) {                        // ⬅️ usa el valor devuelto
        await refresh();                  // intenta refresh
        await fetchMe();                  // reintenta me
      }
      setLoading(false);
    })();
  }, []);

  return (
    <AuthCtx.Provider value={{ me, loading, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}
