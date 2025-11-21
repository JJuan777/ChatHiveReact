// src/features/chat/components/MessageList.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";

function dayKey(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString();
}
function timeLabel(iso) {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─────────────────────────────
   Helpers para detectar emojis
   ───────────────────────────── */

// ¿Es solo emojis (sin texto)?
function isOnlyEmoji(text) {
  if (!text) return false;
  const trimmed = text.trim();

  // Regex general para emojis (requiere soporte de Unicode property escapes)
  const emojiRegex =
    /^(?:\p{Extended_Pictographic}|\p{Emoji_Component}|\p{Emoji_Presentation}|\p{Emoji}\uFE0F|\s)+$/u;

  // Debe contener al menos un emoji
  const hasEmoji = /\p{Extended_Pictographic}/u.test(trimmed);

  return hasEmoji && emojiRegex.test(trimmed);
}

// Contar emojis (para tamaño dinámico)
function countEmojis(text) {
  if (!text) return 0;
  const emojiRegex = /\p{Extended_Pictographic}/gu;
  return (text.match(emojiRegex) || []).length;
}

function DateSeparator({ label }) {
  return (
    <div className="sticky top-2 z-10 mb-2 flex items-center justify-center">
      <span className="px-3 py-0.5 text-[11px] rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border border-zinc-300/50 dark:border-zinc-700/50">
        {label}
      </span>
    </div>
  );
}

function Bubble({ isMe, firstInGroup, lastInGroup, children, timestamp, error }) {
  const text = children ?? "";

  const onlyEmoji = isOnlyEmoji(text);
  const emojiCount = countEmojis(text);

  /* ─────────────────────────────
     Caso especial: SOLO EMOJIS
     ───────────────────────────── */
  if (onlyEmoji) {
    // Tamaño según cantidad de emojis
    let emojiSizeClass = "text-4xl";
    if (emojiCount === 1) emojiSizeClass = "text-6xl";
    else if (emojiCount <= 3) emojiSizeClass = "text-5xl";

    return (
      <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
        <div className="px-1 py-1">
          <div
            className={`inline-block ${emojiSizeClass} leading-tight select-text`}
          >
            {text}
          </div>

          {/* Hora debajo, discreta */}
          <div
            className={`mt-1 text-[10px] text-right opacity-70 ${
              isMe ? "text-zinc-400" : "text-zinc-500"
            }`}
          >
            {timestamp}
          </div>

          {error && (
            <div className="mt-0.5 text-[10px] text-red-500 text-right">
              Error al enviar
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ─────────────────────────────
     Caso normal: burbuja de texto
     ───────────────────────────── */

  const base =
    "max-w-[72%] px-3 py-2 text-sm rounded-2xl transition-colors break-words";
  const me = isMe
    ? "bg-indigo-500 text-white"
    : "bg-zinc-50 dark:bg-zinc-900/70 text-zinc-900 dark:text-zinc-100 border border-zinc-200/70 dark:border-zinc-800";
  const radius = [
    isMe
      ? firstInGroup
        ? "rounded-tr-none"
        : lastInGroup
        ? "rounded-br-none"
        : ""
      : firstInGroup
      ? "rounded-tl-none"
      : lastInGroup
      ? "rounded-bl-none"
      : "",
  ].join(" ");

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`${base} ${me} ${radius}`}>
        <div>{text}</div>

        {error && (
          <div className="mt-1 text-[10px] text-red-300 dark:text-red-400">
            Error al enviar
          </div>
        )}

        <div
          className={`mt-1 text-[10px] opacity-70 ${
            isMe ? "text-white/80" : "text-zinc-500"
          }`}
        >
          {timestamp}
        </div>
      </div>
    </div>
  );
}

export default function MessageList({
  messages = [],
  meId,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
}) {
  const viewRef = useRef(null);
  const [atBottom, setAtBottom] = useState(true);

  const chunks = useMemo(() => {
    const byDay = new Map();
    for (const m of messages) {
      const k = dayKey(m.created_at);
      if (!byDay.has(k)) byDay.set(k, []);
      byDay.get(k).push(m);
    }
    const result = [];
    for (const [k, list] of byDay.entries()) {
      const enhanced = list.map((m, i, arr) => {
        const prev = arr[i - 1];
        const next = arr[i + 1];
        const firstInGroup = !prev || prev.sender_id !== m.sender_id;
        const lastInGroup = !next || next.sender_id !== m.sender_id;
        return { ...m, firstInGroup, lastInGroup };
      });
      result.push({ day: k, items: enhanced });
    }
    return result.sort(
      (a, b) =>
        new Date(a.items[0].created_at) - new Date(b.items[0].created_at),
    );
  }, [messages]);

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    if (atBottom) el.scrollTop = el.scrollHeight;
  }, [messages, atBottom]);

  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const onScroll = () => {
      const nearBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight < 40;
      setAtBottom(nearBottom);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        ref={viewRef}
        className="scroll-smoothy flex-1 min-h-0 overflow-y-auto p-4 space-y-3 bg-white dark:bg-zinc-950 [mask-image:linear-gradient(to_bottom,transparent_0,black_16px,black_calc(100%-16px),transparent_100%)]"
      >
        {/* Botón "ver más" arriba */}
        {hasMore && (
          <div className="sticky top-0 z-20 mb-2 flex justify-center">
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loadingMore}
              className="px-3 py-1.5 text-xs rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm border border-zinc-800 dark:border-zinc-300 disabled:opacity-60"
            >
              {loadingMore ? "Cargando..." : "Ver mensajes anteriores"}
            </button>
          </div>
        )}

        {chunks.length === 0 ? (
          <div className="h-full grid place-items-center text-sm text-zinc-500">
            No hay mensajes todavía.
          </div>
        ) : (
          chunks.map(({ day, items }) => (
            <div key={day} className="space-y-2">
              <DateSeparator label={day} />
              {items.map((m) => {
                const isMe = String(m.sender_id) === String(meId);
                return (
                  <Bubble
                    key={m.id}
                    isMe={isMe}
                    firstInGroup={m.firstInGroup}
                    lastInGroup={m.lastInGroup}
                    timestamp={timeLabel(m.created_at)}
                    error={m.error}
                  >
                    {m.text}
                  </Bubble>
                );
              })}
            </div>
          ))
        )}

        {/* Botón "ver últimos" abajo */}
        {!atBottom && (
          <div className="sticky bottom-4 flex justify-center">
            <button
              onClick={() => {
                const el = viewRef.current;
                if (el) el.scrollTop = el.scrollHeight;
              }}
              className="px-3 py-1.5 text-xs rounded-full bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm ring-1 ring-black/5 dark:ring-white/10"
            >
              Ver últimos mensajes
            </button>
          </div>
        )}
      </div>
    </>
  );
}
