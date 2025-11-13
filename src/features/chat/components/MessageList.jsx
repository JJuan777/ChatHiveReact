import React, { useEffect, useRef } from "react";

function Bubble({ align = "left", children }) {
  const base = "max-w-xs px-3 py-2 text-sm rounded-2xl";
  const styles =
    align === "right"
      ? "bg-indigo-500 text-white ml-auto"
      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100";
  return <div className={`${base} ${styles}`}>{children}</div>;
}

export default function MessageList({ messages = [] }) {
  const viewRef = useRef(null);

  useEffect(() => {
    // Auto-scroll al final cuando lleguen mensajes nuevos
    viewRef.current?.scrollTo({ top: viewRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div ref={viewRef} className="flex-1 overflow-y-auto p-4 space-y-3">
      {messages.map((m) => (
        <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
          <Bubble align={m.from === "me" ? "right" : "left"}>{m.text}</Bubble>
        </div>
      ))}
    </div>
  );
}
