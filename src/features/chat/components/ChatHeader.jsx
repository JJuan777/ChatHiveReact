// src/features/chat/components/ChatHeader.jsx
import React from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function ChatHeader({
  title,
  subtitle,
  connectionReady,
  avatarUrl,
  initials = "?" // fallback
}) {
  return (
    <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white/60 dark:bg-zinc-950/60 backdrop-blur">
      
      <div className="flex items-center gap-3 min-w-0">
        {/* --- AVATAR --- */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            className="w-8 h-8 rounded-full object-cover shrink-0"
            alt={title}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-medium shrink-0">
            {initials.toUpperCase()}
          </div>
        )}

        {/* --- TITLES --- */}
        <div className="min-w-0">
          <h2 className="font-semibold text-zinc-800 dark:text-zinc-100 text-sm truncate">
            {title}
          </h2>
          <p className="text-xs text-zinc-500 truncate">{subtitle || "—"}</p>
        </div>
      </div>

      {/* --- STATUS --- */}
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
