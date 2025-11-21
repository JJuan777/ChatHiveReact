// src/features/chat/components/ChatContainer.jsx
import React, { useEffect, useMemo, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";

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
  conversation, // { id, title, peer, kind, ... }
  initialMessages = [],
  onSendMessage, // viene de ChatPage (usa WS y/o REST)
  loading,
  connectionReady,
  typingUsers = [], // array de user_ids que están escribiendo
  onTypingStart,
  onTypingStop,
  hasMoreMessages = false,
  onLoadMoreMessages,
  loadingMoreMessages = false,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const meId = String(me?.id);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, conversation?.id]);

  const handleSend = (text) => {
    if (!text.trim() || !conversation?.id) return;

    const threadId = conversation.id;
    const clientId =
      globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const tempId = clientId;

    // 1) Mensaje optimista local (solo UI)
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

    // 2) Delegamos el envío al padre (ChatPage) → él usa SOLO WS
    onSendMessage?.(text);
    // ❌ IMPORTANTE: ya NO llamamos createMessage aquí.
    // El mensaje real llegará por WS (liveMessages) y
    // mergedMessages reemplazará este estado vía initialMessages.
  };

  const headerTitle = useMemo(
    () => buildTitle(conversation, meId),
    [conversation, meId],
  );

  const headerSubtitle = useMemo(() => {
    if (!conversation) return "";
    // Si alguien (que no soy yo) está escribiendo
    if (typingUsers && typingUsers.length > 0) {
      if (conversation.kind === "DIRECT" && conversation.peer) {
        const name = displayFromUser(conversation.peer);
        return name ? `${name} está escribiendo…` : "Escribiendo…";
      }
      return "Escribiendo…";
    }
    // Subtítulo normal
    return conversation ? conversation.subtitle || "" : "";
  }, [conversation, typingUsers]);

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
          hasMore={hasMoreMessages}
          onLoadMore={onLoadMoreMessages}
          loadingMore={loadingMoreMessages}
        />
      </div>
      <MessageInput
        onSend={handleSend}
        disabled={loading || !conversation?.id}
        onTypingStart={onTypingStart}
        onTypingStop={onTypingStop}
      />
    </section>
  );
}
