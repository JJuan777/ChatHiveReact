// src/features/chat/components/ChatContainer.jsx
import React, { useEffect, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { createMessage } from "../api/messages";

export default function ChatContainer({
  me,
  conversation,
  initialMessages = [],
  onSendMessage,
  loading,
  connectionReady,
}) {
  const [messages, setMessages] = useState(initialMessages);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, conversation?.id]);

  const handleSend = async (text) => {
    if (!text.trim() || !conversation) return;

    const tempId = crypto.randomUUID();
    const optimisticMsg = {
      id: tempId,
      thread_id: conversation.id,
      sender_id: String(me.id),
      text,
      created_at: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      // 1) tiempo real
      onSendMessage?.(text);
      // 2) persistencia 
      const saved = await createMessage(conversation.id, text, tempId);
      setMessages((prev) => prev.map((m) => (m.id === tempId ? saved : m)));
    } catch (err) {
      console.error("Error enviando mensaje:", err);
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
        disabled={!conversation || loading || !connectionReady}
      />
    </section>
  );
}
