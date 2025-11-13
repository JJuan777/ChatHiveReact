// src/features/chat/components/ChatHeader.jsx
import React from "react";
import { MessageCircle, Wifi, WifiOff } from "lucide-react";

export default function ChatHeader({ title, subtitle, connectionReady }) {
  return (
    <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 backdrop-blur">
      <div className="flex items-center gap-2 min-w-0">
        <MessageCircle className="text-indigo-500 shrink-0" size={18} />
        <div className="min-w-0">
          <h2 className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm truncate">
            {title}
          </h2>
          <p className="text-xs text-zinc-500 truncate">{subtitle || "—"}</p>
        </div>
      </div>
      <div
        className={`inline-flex items-center gap-1 text-xs ${
          connectionReady ? "text-emerald-600" : "text-zinc-500"
        }`}
      >
        {connectionReady ? <Wifi size={14} /> : <WifiOff size={14} />}
        <span>{connectionReady ? "Conectado" : "Desconectado"}</span>
      </div>
    </div>
  );
}
