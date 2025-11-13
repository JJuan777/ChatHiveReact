// src/ui/components/Avatar.jsx
import React, { useMemo } from "react";

// Helpers
function getInitials(name = "?") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function hashToIndex(str = "?") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

const AVATAR_BG = [
  "bg-indigo-600",
  "bg-violet-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-fuchsia-600",
];

/**
 * Componente Avatar reutilizable
 * @param {string} name - Nombre del usuario para generar iniciales
 * @param {number} size - Tamaño en px (por defecto 36)
 * @param {string} className - Clases extra de Tailwind
 */
export default function Avatar({ name, size = 36, className = "" }) {
  const initials = useMemo(() => getInitials(name), [name]);
  const idx = useMemo(() => hashToIndex(name) % AVATAR_BG.length, [name]);
  const style = { width: size, height: size, minWidth: size };

  return (
    <div
      title={name || "Usuario"}
      style={style}
      className={`inline-flex items-center justify-center rounded-full text-white font-semibold shadow-sm ring-2 ring-white/5 ${AVATAR_BG[idx]} ${className}`}
    >
      <span className="select-none" style={{ fontSize: Math.max(12, size * 0.36) }}>
        {initials}
      </span>
    </div>
  );
}
