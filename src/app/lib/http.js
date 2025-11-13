// src/app/lib/http.js
import axios from "axios";
import { ENV } from "../config/env";

// ✅ Asegúrate que ENV.apiBaseUrl incluya /api
// ej: ENV.apiBaseUrl = "http://127.0.0.1:8000/api"
export const http = axios.create({
  baseURL: ENV.apiBaseUrl,
  withCredentials: true, // cookies si las usas
});

// Clave donde guardas el access en localStorage
const ACCESS_KEY = "access_token";

// Aplica Authorization: Bearer <token> a cada request (si existe)
http.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Instancia "cruda" sin interceptores para refrescar
const raw = axios.create({
  baseURL: ENV.apiBaseUrl,
  withCredentials: true,
});

let isRefreshing = false;
let pendingQueue = [];

/**
 * Reintenta las solicitudes que esperaban un token nuevo
 */
function processQueue(error, newToken = null) {
  pendingQueue.forEach(({ resolve, reject, original }) => {
    if (error) {
      reject(error);
    } else {
      if (newToken) {
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newToken}`;
      }
      resolve(http(original));
    }
  });
  pendingQueue = [];
}

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const status = err?.response?.status;
    const original = err.config || {};

    // Si no es 401 o ya reintentamos, rechaza
    if (status !== 401 || original._retry) {
      return Promise.reject(err);
    }

    // Marcamos el retry para esa request
    original._retry = true;

    // Si ya estamos refrescando, encola esta solicitud
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push({ resolve, reject, original });
      });
    }

    // Intento de refresh
    try {
      isRefreshing = true;

      // 🔁 Llama a tu endpoint de refresh.
      // Debe devolver { access: "..." } si usas Bearer.
      // Si usas cookies y el refresh setea nueva cookie + también responde access, mejor.
      const { data } = await raw.post("/auth/refresh/"); // <- ajusta si tu ruta difiere
      const newAccess = data?.access;

      if (!newAccess) {
        // Si tu refresh solo setea cookies y NO regresa access,
        // entonces no podrás actualizar el Authorization header.
        // Recomendación: haz que /auth/refresh/ también regrese {access}
        throw new Error("Refresh no devolvió access token");
      }

      // Guarda y aplica el nuevo access
      localStorage.setItem(ACCESS_KEY, newAccess);

      // Reintenta las solicitudes en cola
      processQueue(null, newAccess);

      // Reintenta la solicitud original con el nuevo token
      original.headers = original.headers || {};
      original.headers.Authorization = `Bearer ${newAccess}`;
      return http(original);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      // Limpia token inválido
      localStorage.removeItem(ACCESS_KEY);
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }
);

export default http;
