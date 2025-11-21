// src/features/chat/pages/ChatPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../app/providers/AuthContext";
import ConversationsSidebar from "../components/ConversationsSidebar";
import ChatContainer from "../components/ChatContainer";
import { useChatSocket } from "../hooks/useChatSocket";
import { fetchThreads } from "../api/threads";
import { fetchThreadMessages } from "../api/messages";
import { resolveDirectThread, sendFirstDirectMessage } from "../api/threads";

const PAGE_SIZE = 30;

export default function ChatPage() {
  const { me, token } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [activeThread, setActiveThread] = useState(null);

  // Historial del hilo (REST paginado)
  const [history, setHistory] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);

  // Para DMs nuevos (sin hilo todavía)
  const [pendingDirectUser, setPendingDirectUser] = useState(null);

  // Mensajes en tiempo real (WS)
  const {
    messages: liveMessages,
    sendMessage,
    isReady,
    typingUsers,
    startTyping,
    stopTyping,
  } = useChatSocket({
    threadId: activeThread?.id,
    token,
    userId: me?.id,
  });

  // Combina historial + live → orden ascendente (más viejos arriba, más nuevos abajo)
  const mergedMessages = useMemo(() => {
    if (!activeThread) return [];
    const base = history || [];
    const live = liveMessages || [];
    if (!live.length && !base.length) return [];

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

  // Cargar mensajes del hilo activo → página 1 (más nuevos primero)
  useEffect(() => {
    if (!activeThread?.id) {
      setHistory([]);
      setCurrentPage(1);
      setHasMoreMessages(false);
      setTotalMessages(0);
      return;
    }

    let alive = true;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        // IMPORTANTE:
        // La API devuelve page=1 con los mensajes MÁS NUEVOS (orden -created_at)
        const data = await fetchThreadMessages(activeThread.id, {
          page: 1,
          page_size: PAGE_SIZE,
        });
        if (!alive) return;

        const results = data.results || [];
        const count = data.count ?? (Array.isArray(results) ? results.length : 0);

        setHistory(results);
        setTotalMessages(count);
        setCurrentPage(1);
        setHasMoreMessages(Boolean(data.next)); // hay más páginas (más viejos) si next != null
      } catch (err) {
        console.error("Error cargando mensajes:", err);
      } finally {
        if (alive) setLoadingMessages(false);
      }
    };

    loadMessages();
    setPendingDirectUser(null); // al cambiar de hilo, ya no hay DM pendiente

    return () => {
      alive = false;
    };
  }, [activeThread?.id]);

  // Cargar más mensajes → siguiente página (más viejos)
  const handleLoadMoreMessages = async () => {
    if (!activeThread?.id) return;
    if (!hasMoreMessages || loadingMore) return;

    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;

      const data = await fetchThreadMessages(activeThread.id, {
        page: nextPage,
        page_size: PAGE_SIZE,
      });

      const results = data.results || [];

      // Añadimos los mensajes más viejos al historial
      setHistory((prev) => [...(prev || []), ...results]);

      setCurrentPage(nextPage);
      setHasMoreMessages(Boolean(data.next));
      // totalMessages ya lo tenemos desde la primera carga; no cambia al paginar
    } catch (err) {
      console.error("Error cargando más mensajes:", err);
    } finally {
      setLoadingMore(false);
    }
  };

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
        setCurrentPage(1);
        setHasMoreMessages(false);
        setTotalMessages(0);
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

        // agregamos el mensaje al historial local (es el más nuevo)
        setHistory((prev) => [...(prev || []), message]);
        setTotalMessages((prev) => prev + 1);

        // refrescar lista de hilos
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
      sendMessage(clean);
      // opcional: incrementar contador local
      setTotalMessages((prev) => prev + 1);
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
          typingUsers={typingUsers}
          onTypingStart={startTyping}
          onTypingStop={stopTyping}
          hasMoreMessages={hasMoreMessages}
          onLoadMoreMessages={handleLoadMoreMessages}
          loadingMoreMessages={loadingMore}
        />
      </div>
    </div>
  );
}
