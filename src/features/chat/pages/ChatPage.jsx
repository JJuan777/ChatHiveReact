// src/features/chat/pages/ChatPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthContext";
import ConversationsSidebar from "../components/ConversationsSidebar";
import ChatContainer from "../components/ChatContainer";
import { useChatSocket } from "../hooks/useChatSocket";
import { fetchThreads } from "../api/threads";
import { fetchThreadMessages } from "../api/messages";
import { resolveDirectThread, sendFirstDirectMessage } from "../api/threads";

export default function ChatPage() {
  const { me, token } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeThread, setActiveThread] = useState(null);

  // Historial del hilo (REST)
  const [history, setHistory] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Para DMs nuevos (sin hilo todavía)
  const [pendingDirectUser, setPendingDirectUser] = useState(null);

  // Mensajes en tiempo real (WS)
  const { messages: liveMessages, sendMessage, isReady } = useChatSocket({
    threadId: activeThread?.id,
    token,
    userId: me?.id,
  });

  // Combina historial + live
  const mergedMessages = useMemo(() => {
    if (!activeThread) return [];
    const base = history || [];
    const live = liveMessages || [];
    if (!live.length) return base;

    const byId = new Map();
    for (const m of base) byId.set(m.id, m);
    for (const m of live) byId.set(m.id, m);
    return Array.from(byId.values()).sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at),
    );
  }, [history, liveMessages, activeThread]);

  // Cargar hilos al entrar
  useEffect(() => {
    let alive = true;
    const loadThreads = async () => {
      setLoadingThreads(true);
      try {
        const data = await fetchThreads();
        if (!alive) return;
        setConversations(data || []);
        if (data?.length && !activeThread) {
          setActiveThread(data[0]);
        }
      } catch (err) {
        console.error("Error cargando hilos:", err);
      } finally {
        if (alive) setLoadingThreads(false);
      }
    };
    if (me) loadThreads();
    return () => {
      alive = false;
    };
  }, [me]);

  // Cargar mensajes del hilo activo
  useEffect(() => {
    if (!activeThread?.id) {
      setHistory([]);
      return;
    }
    let alive = true;
    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const data = await fetchThreadMessages(activeThread.id);
        if (!alive) return;
        setHistory(data?.results || data || []);
      } catch (err) {
        console.error("Error cargando mensajes:", err);
      } finally {
        if (alive) setLoadingMessages(false);
      }
    };
    loadMessages();
    // Al cambiar de hilo, ya no tenemos “pendiente”
    setPendingDirectUser(null);
    return () => {
      alive = false;
    };
  }, [activeThread?.id]);

  // Cuando eliges una conversación de la lista
  const handleSelectThread = (threadId) => {
    const found = conversations.find((t) => t.id === threadId);
    if (!found) return;
    setActiveThread(found);
  };

  // Cuando eliges una persona desde el buscador del sidebar
  const handleSelectUser = async (user) => {
    try {
      // 1) Intentar resolver si YA existe un DM
      const existing = await resolveDirectThread(user.id);

      if (existing) {
        // ✅ Ya había hilo, lo usamos
        setActiveThread(existing);

        // refrescamos lista por si cambió algo
        setConversations((prev) => {
          const others = prev.filter((t) => t.id !== existing.id);
          return [existing, ...others];
        });
      } else {
        // ❌ No existe hilo todavía → guardamos el usuario pendiente
        setPendingDirectUser(user);
        setActiveThread(null); // aún no hay hilo
        setHistory([]);
      }
    } catch (err) {
      console.error("Error al resolver DM directo:", err);
    }
  };

  // Enviar mensaje desde el ChatContainer
  const handleSendMessage = async (text) => {
    const clean = (text || "").trim();
    if (!clean) return;

    // Caso 1: estamos iniciando un DM nuevo (no hay hilo aún)
    if (pendingDirectUser && !activeThread) {
      try {
        const clientId = crypto.randomUUID();
        const { thread, message } = await sendFirstDirectMessage(
          pendingDirectUser.id,
          clean,
          clientId,
        );

        // seteamos hilo activo ya creado
        setActiveThread(thread);
        setPendingDirectUser(null);

        // agregamos el mensaje al historial local
        setHistory((prev) => [...(prev || []), message]);

        // opcional: refrescar lista de hilos
        setConversations((prev) => {
          const others = prev.filter((t) => t.id !== thread.id);
          return [thread, ...others];
        });
      } catch (err) {
        console.error("Error enviando primer DM:", err);
      }
      return;
    }

    // Caso 2: ya existe un hilo → usamos WS normal
    if (activeThread?.id && isReady) {
      sendMessage({
        type: "message.send",
        payload: {
          thread_id: activeThread.id,
          text: clean,
        },
      });
    }
  };

  return (
    <div className="flex h-[calc(100dvh-3rem)] bg-white dark:bg-zinc-950">
      {/* Sidebar con conversaciones y buscador de personas */}
      <div className="w-72 border-r border-zinc-200 dark:border-zinc-800">
        <ConversationsSidebar
          conversations={conversations}
          activeId={activeThread?.id || null}
          onSelect={handleSelectThread}
          onSelectUser={handleSelectUser}
          loading={loadingThreads}
        />
      </div>

      {/* Panel de chat */}
      <div className="flex-1 flex flex-col">
        <ChatContainer
          me={me}
          conversation={activeThread}
          initialMessages={mergedMessages}
          onSendMessage={handleSendMessage}
          loading={loadingMessages}
          connectionReady={isReady}
        />
      </div>
    </div>
  );
}
