// src/features/chat/components/ChatContainer.jsx
import React, { useEffect, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatContainer({
  me,
  conversation,             // {id, title, subtitle} o null (pendiente)
  initialMessages = [],
  onSendMessage,             // (text) => maneja WS o creación del hilo
  loading,
  connectionReady,
}) {
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, conversation?.id]);

  const handleSend = async (text) => {
    if (!text.trim()) return;

    // Optimista local (sirve tanto con hilo existente como pendiente)
    const tempId = crypto.randomUUID();
    const optimisticMsg = {
      id: tempId,
      thread_id: conversation?.id || null,
      sender_id: String(me.id),
      text,
      created_at: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      await onSendMessage?.(text);
      // Nota: si se creó hilo nuevo, el padre cambiará la key del componente
      // y se recargará con initialMessages correctos (reemplazando optimista)
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, error: true } : m))
      );
    }
  };

  return (
    <section className="flex flex-1 flex-col min-h-0 bg-white dark:bg-zinc-950">
      <ChatHeader
        title={conversation?.title || "Selecciona una conversación"}
        subtitle={conversation ? conversation.subtitle || "" : ""}
        connectionReady={connectionReady}
      />
      <div className="flex-1 min-h-0 flex flex-col">
        <MessageList
          key={conversation?.id || "no-thread"}
          meId={String(me?.id)}
          messages={messages}
        />
      </div>
      <MessageInput
        onSend={handleSend}
        disabled={loading /* para DM nuevo no bloqueamos; el padre resuelve */}
      />
    </section>
  );
}
