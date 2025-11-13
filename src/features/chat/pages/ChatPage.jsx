import React, { useState } from "react";
import ConversationsSidebar from "../components/ConversationsSidebar";
import ChatContainer from "../components/ChatContainer";

export default function ChatPage({ user }) {
  // Estado simulado para demo
  const [conversations] = useState([
    { id: "1", title: "Usuario 1", lastMessage: "Último mensaje de ejemplo..." },
    { id: "2", title: "Usuario 2", lastMessage: "Hola, ¿cómo va todo?" },
    { id: "3", title: "Equipo Soporte", lastMessage: "Te comparto el folio..." },
  ]);
  const [activeId, setActiveId] = useState(conversations[0]?.id || null);

  const active = conversations.find(c => c.id === activeId);

  return (
    <div className="h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-5rem)] grid grid-cols-1 sm:grid-cols-[280px,1fr] border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
      <ConversationsSidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={setActiveId}
      />
      <ChatContainer
        user={user}
        conversation={active}
        onSendMessage={(text) => {
          // Aquí conectarás a WebSocket / API
          console.log("▶️ send:", text, "to", active?.id);
        }}
      />
    </div>
  );
}
