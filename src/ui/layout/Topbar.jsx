import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../app/providers/AuthContext";
import Avatar from "../components/Avatar";
import LogoS from "../../assets/icons/LogoS.svg"; // ✅ import del logo SVG

export default function Topbar({ onToggleSidebar }) {
  const { me, loading, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  // Cierra el menú al hacer click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (!menuOpen) return;
      const clickedButton = buttonRef.current?.contains(e.target);
      const clickedMenu = menuRef.current?.contains(e.target);
      if (!clickedButton && !clickedMenu) setMenuOpen(false);
    }
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Cierra con Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-zinc-900/60 bg-white/70 dark:bg-zinc-900/70 border-b border-zinc-200/70 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-3 sm:px-4">
        <div className="h-14 flex items-center gap-2">
          {/* Botón menú */}
          <button
            onClick={onToggleSidebar}
            className="sm:hidden inline-flex items-center justify-center size-9 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            aria-label="Abrir menú lateral"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
              <path
                fillRule="evenodd"
                d="M3.75 5.25a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 6a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Zm0 6a.75.75 0 0 1 .75-.75h15a.75.75 0 0 1 0 1.5h-15a.75.75 0 0 1-.75-.75Z"
                clipRule="evenodd"
              />
            </svg>
          </button>

        {/* Logo */}
        <div className="flex items-center gap-1.5">
            <img
                src={LogoS}
                alt="Logo ChatHive"
                className="w-10 h-10 object-contain"
            />
            <span className="text-sm font-semibold tracking-tight select-none">ChatHive</span>
        </div>


          {/* Usuario */}
          <div className="ms-auto relative">
            <button
              ref={buttonRef}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex items-center gap-2 ps-1 pe-2 py-1 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-transparent hover:border-zinc-200 dark:hover:border-zinc-700"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-controls="user-menu"
            >
              {loading ? (
                <div className="size-9 rounded-full animate-pulse bg-zinc-200 dark:bg-zinc-800" />
              ) : (
                <Avatar name={me?.display_name} size={36} />
              )}
              <div className="hidden sm:flex flex-col items-start leading-tight">
                <span className="text-[11px] text-zinc-500">Conectado</span>
                <span className="text-sm font-medium max-w-[12rem] truncate">
                  {me?.display_name || "Invitado"}
                </span>
              </div>
              <svg className="ms-1 size-4 text-zinc-500" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.174l3.71-3.943a.75.75 0 1 1 1.08 1.04l-4.24 4.5a.75.75 0 0 1-1.08 0l-4.24-4.5a.75.75 0 0 1 .02-1.06Z"
                  clipRule="evenodd"
                />
              </svg>
            </button>

            {menuOpen && (
              <div
                id="user-menu"
                ref={menuRef}
                role="menu"
                className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-lg overflow-hidden"
              >
                <div className="px-3 py-3 flex items-center gap-3">
                  <Avatar name={me?.display_name} size={32} />
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{me?.display_name || "Invitado"}</div>
                    <div className="text-xs text-zinc-500 truncate">{me?.email || "sin correo"}</div>
                  </div>
                </div>
                <div className="h-px bg-zinc-200/70 dark:bg-zinc-800" />
                <nav className="py-1 text-sm">
                  <button className="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" role="menuitem">
                    Perfil
                  </button>
                  <button className="w-full text-left px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800" role="menuitem">
                    Ajustes
                  </button>
                </nav>
                <div className="h-px bg-zinc-200/70 dark:bg-zinc-800" />
                <div className="p-2">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      logout?.();
                    }}
                    className="w-full inline-flex justify-center items-center h-9 rounded-lg bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900 hover:opacity-90"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
