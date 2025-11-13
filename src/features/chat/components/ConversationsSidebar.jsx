import React, { useState } from "react";
import { Search } from "lucide-react";

export default function ConversationsSidebar({ conversations = [], activeId, onSelect }) {
  const [q, setQ] = useState("");

  const filtered = conversations.filter(c =>
    c.title.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <aside className="bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
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

      {/* Lista de chats */}
      <div className="flex-1 overflow-y-auto">
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {filtered.map((c) => {
            const active = c.id === activeId;
            return (
              <li
                key={c.id}
                onClick={() => onSelect?.(c.id)}
                className={`p-3 cursor-pointer ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-950/30"
                    : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">
                  {c.title}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                  {c.lastMessage}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
