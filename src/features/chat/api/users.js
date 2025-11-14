// src/features/chat/api/users.js
import http from "../../../app/lib/http";

export async function fetchUserSuggest({ q, limit = 10, excludeMe = true } = {}) {
  const params = {};
  if (q) params.q = q;
  if (limit) params.limit = limit;
  if (excludeMe) params.exclude_me = 1;

  // sin /api aquí
  const { data } = await http.get("/users/suggest/", { params });
  return data;
}
