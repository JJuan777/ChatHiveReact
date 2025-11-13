import React, { useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

export default function ChatContainer({ user, conversation, onSendMessage }) {
  // Mensajes de ejemplo (normalmente vendrán por WebSocket/API)
  const [messages, setMessages] = useState([
    { id: "m1", from: "peer", text: "¡Hola! ¿Cómo estás?" },
    { id: "m2", from: "me", text: "Todo bien, gracias. ¿Y tú?" },
  ]);

  const handleSend = (text) => {
    if (!text.trim()) return;
    const msg = { id: crypto.randomUUID(), from: "me", text };
    setMessages((prev) => [...prev, msg]);
    onSendMessage?.(text);
  };

  return (
    <section className="flex flex-col bg-white dark:bg-zinc-950">
      <ChatHeader title={conversation?.title || "Selecciona una conversación"} />
      <MessageList messages={messages} />
      <MessageInput onSend={handleSend} disabled={!conversation} />
    </section>
  );
}
