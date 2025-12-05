// src/features/chat/components/ChatContainer.jsx
import React, { useEffect, useMemo, useState } from "react";
import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { updateMessage, deleteMessage } from "../api/messages";
// ⬇️ Sonner
import { toast } from "sonner";
// ⬇️ Confirm personalizado con Sonner
import { confirmToast } from "../../../utils/confirmToast";

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
  typingUsers = [],
  onTypingStart,
  onTypingStop,
  hasMoreMessages = false,
  onLoadMoreMessages,
  loadingMoreMessages = false,
}) {
  const [messages, setMessages] = useState(initialMessages);
  const meId = String(me?.id);

  // Sincronizar mensajes cuando cambia el hilo o llegan nuevos desde el padre
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages, conversation?.id]);

  const handleSend = (text) => {
    if (!text.trim() || !conversation?.id) return;

    const threadId = conversation.id;
    const clientId =
      globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    const tempId = clientId;

    // Mensaje optimista local
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

    onSendMessage?.(text);
  };

  // 🔹 Editar mensaje
  const handleEditMessage = async (message) => {
    if (!conversation?.id) return;
    const threadId = conversation.id;

    const currentText = message.text || "";
    const nuevoTexto = window.prompt("Editar mensaje", currentText);
    if (nuevoTexto === null) return;
    const trimmed = nuevoTexto.trim();
    if (!trimmed || trimmed === currentText.trim()) return;

    // Optimista
    setMessages((prev) =>
      prev.map((m) =>
        m.id === message.id
          ? { ...m, text: trimmed, edited_at: new Date().toISOString() }
          : m,
      ),
    );

    try {
      await updateMessage({
        threadId,
        messageId: message.id,
        text: trimmed,
      });
      toast.success("Mensaje editado");
    } catch (err) {
      console.error("Error al editar mensaje", err);
      toast.error("No se pudo editar el mensaje");
      // (Opcional) revertir el cambio optimista:
      // setMessages(prev => prev.map(m => (m.id === message.id ? message : m)));
    }
  };

  // 🔹 Eliminar mensaje (con confirm usando Sonner)
  const handleDeleteMessage = async (message) => {
    if (!conversation?.id) return;
    const threadId = conversation.id;

    // ⬇️ Reemplaza window.confirm
    const ok = await confirmToast("¿Eliminar este mensaje?", {
      actionText: "Eliminar",
    });
    if (!ok) return;

    // Optimista: marcar como eliminado en el estado
    setMessages((prev) =>
      prev.map((m) =>
        m.id === message.id
          ? {
              ...m,
              text: "",
              deleted: true,
              deleted_at: new Date().toISOString(),
            }
          : m,
      ),
    );

    try {
      await deleteMessage({
        threadId,
        messageId: message.id,
      });
      toast.success("Mensaje eliminado");
    } catch (err) {
      console.error("Error al eliminar mensaje", err);
      toast.error("No se pudo eliminar el mensaje");

      // (Opcional) revertir flag deleted:
      // setMessages(prev => prev.map(m => (m.id === message.id ? message : m)));
    }
  };

  const headerTitle = useMemo(
    () => buildTitle(conversation, meId),
    [conversation, meId],
  );

  const headerSubtitle = useMemo(() => {
    if (!conversation) return "";
    if (typingUsers && typingUsers.length > 0) {
      if (conversation.kind === "DIRECT" && conversation.peer) {
        const name = displayFromUser(conversation.peer);
        return name ? `${name} está escribiendo…` : "Escribiendo…";
      }
      return "Escribiendo…";
    }
    return conversation ? conversation.subtitle || "" : "";
  }, [conversation, typingUsers]);

  const otherUser = useMemo(() => {
    if (!conversation) return null;
    if (conversation.kind === "DIRECT" && conversation.peer) {
      return conversation.peer;
    }
    const members =
      conversation.members ||
      conversation.participants ||
      conversation.users ||
      [];
    return members.find((u) => String(u.id) !== meId) || null;
  }, [conversation, meId]);

  const otherInitials = useMemo(() => {
    if (!otherUser) return "?";

    if (otherUser.display && otherUser.display.trim()) {
      const parts = otherUser.display.trim().split(" ");
      if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
      }
      return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
    }

    const fn = otherUser.first_name || "";
    const ln = otherUser.last_name || "";
    if (!fn && !ln) return "?";
    return (fn[0] || "" + ln[0] || "").toUpperCase() || "?";
  }, [otherUser]);

  return (
    <section className="flex flex-1 flex-col min-h-0 bg-white dark:bg-zinc-950">
      <ChatHeader
        title={headerTitle}
        subtitle={headerSubtitle}
        connectionReady={connectionReady}
        avatarUrl={otherUser?.avatar}
        initials={otherInitials}
      />

      <div className="flex-1 min-h-0 flex flex-col">
        <MessageList
          key={conversation?.id || "no-thread"}
          meId={meId}
          messages={messages}
          hasMore={hasMoreMessages}
          onLoadMore={onLoadMoreMessages}
          loadingMore={loadingMoreMessages}
          onEditMessage={handleEditMessage}
          onDeleteMessage={handleDeleteMessage}
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
