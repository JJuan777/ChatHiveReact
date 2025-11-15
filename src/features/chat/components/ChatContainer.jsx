// src/features/chat/components/ChatContainer.jsx
import React, { useEffect, useMemo, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { createMessage } from "../api/messages";

function displayFromUser(u) {
  if (!u) return "";
  return (
    u.display ||
    [u.first_name, u.last_name].filter(Boolean).join(" ") ||
    u.email ||
    ""
  );
}

function buildTitle(conversation, meId) {
  if (!conversation) return "Selecciona una conversación";

  if (conversation.title && String(conversation.title).trim()) {
    return conversation.title;
  }

  if (conversation.peer) {
    const name = displayFromUser(conversation.peer);
    if (name) return name;
  }

  const rawMembers =
    conversation.members ||
    conversation.participants ||
    conversation.users ||
    [];

  const others = rawMembers.filter((u) => String(u.id) !== String(meId));

  if (!others.length) return "Chat";

  const names = others.map(displayFromUser).filter(Boolean);

  if (!names.length) return "Chat";
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]}, ${names[1]}`;
  return `${names[0]}, ${names[1]} +${names.length - 2}`;
}

export default function ChatContainer({
  me,
  conversation,         // { id, title, peer, ... }
  initialMessages = [],
  onSendMessage,         // viene de useChatSocket.sendMessage
  loading,
  connectionReady,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const meId = String(me?.id);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, conversation?.id]);

  const handleSend = async (text) => {
    if (!text.trim() || !conversation?.id) return;

    const threadId = conversation.id;
    const clientId = crypto.randomUUID();
    const tempId = clientId; // reutilizamos para vincular optimista vs real

    // 1) Mensaje optimista local
    const optimisticMsg = {
      id: tempId,
      thread_id: threadId,
      sender_id: meId,
      sender: {
        id: me.id,
        email: me.email,
        first_name: me.first_name,
        last_name: me.last_name,
        display: displayFromUser(me),
      },
      text,
      type: "TEXT",
      created_at: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    try {
      // 2) WebSocket para tiempo real (si está listo)
      onSendMessage?.(text, { clientId, threadIdOverride: threadId });

      // 3) REST → GUARDA en backend
      const real = await createMessage({ threadId, text, clientId });

      // 4) Reemplazamos el optimista por el real que viene del backend
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...real, optimistic: false } : m)),
      );
    } catch (err) {
      console.error("❌ Error al crear mensaje:", err);
      // Marcamos el mensaje como fallido (opcionalmente podrías quitarlo)
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, error: true } : m,
        ),
      );
    }
  };

  const headerTitle = useMemo(
    () => buildTitle(conversation, meId),
    [conversation, meId],
  );

  const headerSubtitle = conversation ? conversation.subtitle || "" : "";

  return (
    <section className="flex flex-1 flex-col min-h-0 bg-white dark:bg-zinc-950">
      <ChatHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        connectionReady={connectionReady}
      />
      <div className="flex-1 min-h-0 flex flex-col">
        <MessageList
          key={conversation?.id || "no-thread"}
          meId={meId}
          messages={messages}
        />
      </div>
      <MessageInput
        onSend={handleSend}
        disabled={loading || !conversation?.id}
      />
    </section>
  );
}
