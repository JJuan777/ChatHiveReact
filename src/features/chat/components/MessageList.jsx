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

function DateSeparator({ label }) {
  return (
    <div className="sticky top-2 z-10 mb-2 flex items-center justify-center">
      <span className="px-3 py-0.5 text-[11px] rounded-full bg-zinc-200/50 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-300 border border-zinc-300/50 dark:border-zinc-700/50">
        {label}
      </span>
    </div>
  );
}

function Bubble({ isMe, firstInGroup, lastInGroup, children, timestamp }) {
  const base =
    "max-w-[72%] px-3 py-2 text-sm rounded-2xl transition-colors";
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
        {children}
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

export default function MessageList({ messages = [], meId }) {
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
        new Date(a.items[0].created_at) - new Date(b.items[0].created_at)
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
                  >
                    {m.text}
                    {m.error && (
                      <div className="mt-1 text-[10px] text-red-500">
                        Error al enviar
                      </div>
                    )}
                  </Bubble>
                );
              })}
            </div>
          ))
        )}

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
