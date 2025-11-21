// src/features/chat/api/messages.js
import http from "../../../app/lib/http";

const DEFAULT_PAGE_SIZE = 30;

/**
 * Mensajes del hilo (paginados)
 *
 * Devuelve siempre un objeto:
 * {
 *   count: number,
 *   next: string | null,
 *   previous: string | null,
 *   results: Mensaje[]
 * }
 */
export async function fetchThreadMessages(
  threadId,
  { page = null, page_size = DEFAULT_PAGE_SIZE } = {},
) {
  // Si page == null → primero pedimos la metadata sin resultados
  if (page === null) {
    const meta = await http.get(`/chat/threads/${threadId}/messages/`, {
      params: { page: 1, page_size },
    });

    const count = meta.data.count || 0;
    const lastPage = Math.max(1, Math.ceil(count / page_size));

    // Ahora pedimos la última página REAL
    page = lastPage;
  }

  const { data } = await http.get(`/chat/threads/${threadId}/messages/`, {
    params: { page, page_size },
  });

  return {
    count: data.count ?? (data.results?.length ?? 0),
    next: data.next ?? null,
    previous: data.previous ?? null,
    results: data.results ?? [],
    page,
  };
}


/**
 * Crea un mensaje en el hilo por REST
 */
export async function createMessage({ threadId, text, clientId }) {
  const payload = {
    text,
    client_id:
      clientId ||
      (globalThis.crypto?.randomUUID?.() ?? String(Date.now())),
  };
  const { data } = await http.post(
    `/chat/threads/${threadId}/messages/`,
    payload,
  );
  return data;
}