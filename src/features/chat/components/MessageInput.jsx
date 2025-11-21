// src/features/chat/components/MessageInput.jsx
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Send, Paperclip, Smile } from "lucide-react";

export default function MessageInput({ onSend, disabled, onTypingStart, onTypingStop }) {
  const [text, setText] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const taRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const resize = () => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "0px";
    const next = Math.max(38, Math.min(el.scrollHeight, 192));
    el.style.height = next + "px";
  };

  useLayoutEffect(resize, []);
  useLayoutEffect(resize, [text]);

  useEffect(() => {
    //(rotación móvil)
    const ro = new ResizeObserver(resize);
    if (taRef.current) ro.observe(taRef.current);
    return () => ro.disconnect();
  }, []);

  const stopTypingInternal = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTyping) {
      onTypingStop?.();
      setIsTyping(false);
    }
  };

  const scheduleStopTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      onTypingStop?.();
      setIsTyping(false);
      typingTimeoutRef.current = null;
    }, 2000); // 2s sin escribir -> stop
  };

  const notifyTyping = () => {
    if (disabled) return;
    if (!isTyping) {
      setIsTyping(true);
      onTypingStart?.();
    }
    scheduleStopTyping();
  };

  const submit = () => {
    const value = text.trim();
    if (!value || disabled) return;
    onSend?.(value);
    setText("");
    stopTypingInternal();
    requestAnimationFrame(resize);
  };

  const onKeyDown = (e) => {
    if (isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onChange = (e) => {
    setText(e.target.value);
    notifyTyping();
  };

  useEffect(() => {
    return () => {
      // al desmontar, avisamos que dejamos de escribir
      stopTypingInternal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white/60 dark:bg-zinc-950/60 backdrop-blur">
      <div className="flex items-end gap-2">
        <button
          type="button"
          className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 disabled:opacity-50 self-end"
          title="Adjuntar"
          disabled={disabled}
        >
          <Paperclip size={18} />
        </button>

        <div className="flex-1">
          <div className="rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 focus-within:ring-1 focus-within:ring-indigo-500">
            <textarea
              ref={taRef}
              value={text}
              onChange={onChange}
              onKeyDown={onKeyDown}
              onCompositionStart={() => setIsComposing(true)}
              onCompositionEnd={() => setIsComposing(false)}
              rows={1}
              placeholder={
                disabled
                  ? "Selecciona una conversación..."
                  : "Escribe un mensaje..."
              }
              disabled={disabled}
              className="w-full min-h-[38px] max-h-48 overflow-auto resize-none px-3 py-2 text-sm leading-5 bg-transparent focus:outline-none placeholder:text-zinc-400"
            />
          </div>
        </div>

        <button
          type="button"
          className="p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 disabled:opacity-50 self-end"
          title="Emojis"
          disabled={disabled}
        >
          <Smile size={18} />
        </button>

        <button
          type="button"
          onClick={submit}
          disabled={disabled || !text.trim()}
          className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 self-end"
          title="Enviar"
        >
          <Send size={18} />
        </button>
      </div>

      <div className="mt-1 text-[10px] text-zinc-500">
        Enter para enviar • Shift+Enter para nueva línea
      </div>
    </div>
  );
}
