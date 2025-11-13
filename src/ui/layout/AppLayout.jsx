// src/ui/layout/AppLayout.jsx
import React from "react";
import Topbar from "./Topbar";

/**
 * Layout
 * - Topbar y un contenedor central
 */
export default function AppLayout({ children }) {
  return (
    <div className="flex flex-col min-h-dvh bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <Topbar />

      {/* Contenido principal */}
      <main className="flex-grow flex items-stretch w-full">
        <div className="flex-1 px-3 sm:px-6 py-6 w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
