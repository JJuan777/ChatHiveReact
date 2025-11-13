// src/features/chat/api/threads.js
import http from "../../../app/lib/http";

export async function fetchThreads({ q, archived } = {}) {
  const params = {};
  if (q) params.q = q;
  if (archived) params.archived = 1;
  const { data } = await http.get("/chat/threads/", { params });
  return data; // lista de threads
}
