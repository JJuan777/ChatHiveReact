// src/app/lib/http.js (o donde lo tengas)
import axios from "axios";
import { ENV } from "../config/env";

export const http = axios.create({
  baseURL: ENV.apiBaseUrl,       // http://127.0.0.1:8000
  withCredentials: true,         // ⬅️ importante para enviar/recibir cookies
});

// Si NO usas Bearer, puedes quitar este interceptor.
// Lo dejo por si algún endpoint opcional lo requiere.
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let isRefreshing = false;

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config || {};
    const status = err?.response?.status;

    // Si el access expira, intenta refrescar una vez usando la cookie refresh
    if (status === 401 && !original._retry) {
      original._retry = true;
      try {
        if (!isRefreshing) {
          isRefreshing = true;
          await http.post("/auth/refresh/");  // ⬅️ setea nuevos cookies
          isRefreshing = false;
        }
        return http(original);
      } catch (_) {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);
