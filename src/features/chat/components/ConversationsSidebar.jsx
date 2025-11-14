import React, { useEffect, useMemo, useRef, useState } from "react";
import { Search, Loader2, MessageSquarePlus } from "lucide-react";
import { fetchUserSuggest } from "../api/users";

// Helpers
function initialsFrom(text = "?") {
  const t = String(text).trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ThreadItem({ item, active, onClick }) {
  return (
    <li
      onClick={onClick}
      className={`p-3 cursor-pointer group transition-colors ${
        active
          ? "bg-indigo-50 dark:bg-indigo-950/30"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="shrink-0 w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 grid place-items-center font-semibold">
          {initialsFrom(item.title)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
              {item.title}
            </div>
            {item.unread_count > 0 && (
              <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-indigo-500 text-white">
                {item.unread_count}
              </span>
            )}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
            {item.lastMessage || "—"}
          </div>
        </div>
      </div>
    </li>
  );
}

function SuggestItem({ u, active, onClick }) {
  return (
    <li
      onClick={onClick}
      className={`px-3 py-2 cursor-pointer flex items-center gap-2 transition-colors ${
        active
          ? "bg-indigo-50 dark:bg-indigo-950/30"
          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 grid place-items-center text-xs font-semibold overflow-hidden">
        {u.avatar ? (
          <img src={u.avatar} alt={u.title} className="w-8 h-8 rounded-full object-cover" />
        ) : (
          (u.initials || initialsFrom(u.title))
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-zinc-800 dark:text-zinc-100 truncate">{u.title}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{u.subtitle}</div>
      </div>
      <div className="shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <MessageSquarePlus size={16} />
      </div>
    </li>
  );
}

/**
 * Props:
 * - conversations: []        -> hilos del usuario
 * - activeId: string         -> id del hilo activo
 * - onSelect: (threadId)     -> selecciona un hilo existente
 * - onSelectUser: (userObj)  -> selecciona un usuario (sólo resolve, NO crea)
 * - loading: boolean
 */
export default function ConversationsSidebar({
  conversations = [],
  activeId,
  onSelect,
  onSelectUser,
  loading,
}) {
  const [q, setQ] = useState("");
  const [suggest, setSuggest] = useState([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1); // navegación con teclado
  const inputRef = useRef(null);

  // Debounce + fetch de sugerencias
  useEffect(() => {
    let alive = true;
    const run = async () => {
      const txt = q.trim();
      if (txt.length < 2) {
        if (alive) { setSuggest([]); setActiveIdx(-1); }
        return;
      }
      setLoadingSuggest(true);
      try {
        const data = await fetchUserSuggest({ q: txt, limit: 8, excludeMe: true });
        if (!alive) return;
        setSuggest(data || []);
        setActiveIdx(data?.length ? 0 : -1);
      } catch {
        if (alive) setSuggest([]);
      } finally {
        if (alive) setLoadingSuggest(false);
      }
    };
    const t = setTimeout(run, 200);
    return () => { alive = false; clearTimeout(t); };
  }, [q]);

  // Filtrado local de conversaciones cuando no hay búsqueda real (>=2)
  const filteredConversations = useMemo(() => {
    const txt = q.trim().toLowerCase();
    if (!txt) return conversations;
    if (txt.length < 2) {
      return conversations.filter((c) => c.title?.toLowerCase().includes(txt));
    }
    return conversations;
  }, [q, conversations]);

  const showingSuggest = q.trim().length >= 2;

  function onKeyDown(e) {
    if (!showingSuggest || loadingSuggest || suggest.length === 0) {
      if (e.key === "Escape") {
        setQ(""); setSuggest([]); setActiveIdx(-1);
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => (i + 1) % suggest.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => (i - 1 + suggest.length) % suggest.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && typeof onSelectUser === "function") {
        onSelectUser(suggest[activeIdx]);
        setQ("");
        setSuggest([]);
        setActiveIdx(-1);
      }
    } else if (e.key === "Escape") {
      setQ(""); setSuggest([]); setActiveIdx(-1);
    }
  }

  return (
    <aside className="bg-zinc-50/70 dark:bg-zinc-900/70 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-semibold text-zinc-700 dark:text-zinc-100 text-sm">Conversaciones</h2>
      </div>

      {/* Buscador */}
      <div className="p-2">
        <div className="relative">
          <Search size={16} className="absolute left-2 top-2.5 text-zinc-400" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKeyDown}
            type="text"
            placeholder="Buscar conversación o persona…"
            className="w-full pl-8 pr-2 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          {!!q && (
            <button
              onClick={() => { setQ(""); setSuggest([]); setActiveIdx(-1); inputRef.current?.focus(); }}
              className="absolute right-2 top-2 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              title="Limpiar"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Lista principal */}
      <div className="flex-1 overflow-y-auto">
        {showingSuggest ? (
          <div className="pb-2">
            <div className="px-3 py-1.5 text-[11px] uppercase tracking-wide text-zinc-500">Personas</div>
            {loadingSuggest ? (
              <div className="px-3 py-2 text-sm text-zinc-500">Buscando…</div>
            ) : suggest.length ? (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {suggest.map((u, idx) => (
                  <SuggestItem
                    key={u.id}
                    u={u}
                    active={idx === activeIdx}
                    onClick={() => {
                      if (typeof onSelectUser === "function") {
                        onSelectUser(u);
                        setQ("");
                        setSuggest([]);
                        setActiveIdx(-1);
                      }
                    }}
                  />
                ))}
              </ul>
            ) : (
              <div className="px-3 py-6 text-sm text-zinc-500">Sin coincidencias.</div>
            )}
          </div>
        ) : (
          <>
            {loading ? (
              <ul className="p-3 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <li key={i} className="animate-pulse">
                    <div className="flex gap-2 items-center">
                      <div className="w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 w-2/3 rounded bg-zinc-200 dark:bg-zinc-800" />
                        <div className="h-2 w-1/2 rounded bg-zinc-200 dark:bg-zinc-800" />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : filteredConversations.length ? (
              <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredConversations.map((c) => (
                  <ThreadItem
                    key={c.id}
                    item={c}
                    active={c.id === activeId}
                    onClick={() => onSelect?.(c.id)}
                  />
                ))}
              </ul>
            ) : (
              <div className="h-full grid place-items-center p-6 text-center text-sm text-zinc-500">
                {q ? "No hay coincidencias." : "No tienes conversaciones aún. Empieza escribiendo un nombre arriba 👆"}
              </div>
            )}
          </>
        )}
      </div>

      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-1">
        <Loader2 size={14} className="animate-spin" />
        Tiempo real activo
      </div>
    </aside>
  );
}
