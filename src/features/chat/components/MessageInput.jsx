import React, { useState } from "react";
import { Send } from "lucide-react";

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    onSend?.(text);
    setText("");
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex items-center gap-2">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        type="text"
        placeholder={disabled ? "Selecciona una conversación..." : "Escribe un mensaje..."}
        disabled={disabled}
        className="flex-1 px-3 py-2 text-sm rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="p-2 rounded-full bg-indigo-500 hover:bg-indigo-600 text-white disabled:opacity-60"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
