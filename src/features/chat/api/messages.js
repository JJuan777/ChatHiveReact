// src/features/chat/api/messages.js
import http from "../../../app/lib/http";

/**
 * Mensajes del hilo
 * @param {string} threadId
 * @param {{before?: string, after?: string, page?: number, page_size?: number}} params
 */
export async function fetchThreadMessages(threadId, params = {}) {
  const { data } = await http.get(`/chat/threads/${threadId}/messages/`, {
    params,
  });

  return Array.isArray(data) ? data : (data.results ?? []);
}

/**
 * Crea un mensaje en el hilo
 * Usa client_id
 * @param {string} threadId
 * @param {string} text
 * @param {string} [clientId]
 * @returns {Promise<object>}
 */
export async function createMessage(threadId, text, clientId) {
  const payload = {
    text,
    client_id: clientId || (globalThis.crypto?.randomUUID?.() ?? String(Date.now())),
  };
  const { data } = await http.post(`/chat/threads/${threadId}/messages/`, payload);
  return data;
}
