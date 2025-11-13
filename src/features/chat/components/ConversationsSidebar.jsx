// src/features/chat/components/ConversationsSidebar.jsx
import React, { useMemo, useState } from "react";
import { Search, Loader2 } from "lucide-react";

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
        {/* Avatar simple por iniciales */}
        <div className="shrink-0 w-9 h-9 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 grid place-items-center font-semibold">
          {(item.title || "?").slice(0, 2).toUpperCase()}
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

export default function ConversationsSidebar({
  conversations = [],
  activeId,
  onSelect,
  loading,
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const txt = q.trim().toLowerCase();
    if (!txt) return conversations;
    return conversations.filter((c) => c.title?.toLowerCase().includes(txt));
  }, [q, conversations]);

  return (
    <aside className="bg-zinc-50/70 dark:bg-zinc-900/70 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800">
        <h2 className="font-semibold text-zinc-700 dark:text-zinc-100 text-sm">
          Conversaciones
        </h2>
      </div>

      {/* Buscador */}
      <div className="p-2">
        <div className="relative">
          <Search size={16} className="absolute left-2 top-2.5 text-zinc-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            type="text"
            placeholder="Buscar..."
            className="w-full pl-8 pr-2 py-1.5 text-sm bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto">
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
        ) : filtered.length ? (
          <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filtered.map((c) => (
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
            {q ? "No hay coincidencias." : "No tienes conversaciones aún."}
          </div>
        )}
      </div>
      <div className="p-2 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 flex items-center gap-1">
        <Loader2 size={14} className="animate-spin" />
        Tiempo real activo
      </div>
    </aside>
  );
}
