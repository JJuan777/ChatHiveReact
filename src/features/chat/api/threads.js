// src/features/chat/api/threads.js
import http from "../../../app/lib/http";

// Lista de hilos
export async function fetchThreads({ q, archived } = {}) {
  const params = {};
  if (q) params.q = q;
  if (archived) params.archived = 1;
  const { data } = await http.get("/chat/threads/", { params });
  return data;
}

// Resolver si existe un DM directo con user_id
export async function resolveDirectThread(userId) {
  try {
    const { data } = await http.get("/chat/threads/direct/resolve/", {
      params: { user_id: userId },
    });
    return data; // ThreadList
  } catch (err) {
    if (err.response?.status === 404) {
      // No existe conversación todavía
      return null;
    }
    throw err;
  }
}

// Crear (si no existe) el hilo directo y enviar primer mensaje
export async function sendFirstDirectMessage(userId, text, clientId) {
  const { data } = await http.post("/chat/threads/direct/send/", {
    user_id: userId,
    text,
    client_id: clientId,
  });
  return data; // { thread, message }
}
