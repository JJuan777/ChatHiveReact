// src/ui/layout/AppLayout.jsx
import React from "react";
import Topbar from "./Topbar";

/**
 * Layout general de ChatHive (sin sidebar)
 * - Incluye Topbar y un contenedor central
 * - Envuelve las páginas principales
 */
export default function AppLayout({ children }) {
  return (
    <div className="min-h-dvh bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <Topbar />

      {/* Contenido principal (sin sidebar) */}
      <main>
        <div className="mx-auto max-w-7xl px-3 sm:px-6 py-6">
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/50 shadow-sm p-4 sm:p-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
