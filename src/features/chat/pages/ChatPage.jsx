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

  const [currentPage, setCurrentPage] = useState(1); // solo informativo ahora
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [totalMessages, setTotalMessages] = useState(0);

  // Índices (1-based) del rango de mensajes cargados en memoria
  // Ejemplo con 35 mensajes totales:
  //  - history = mensajes 6..35  => windowStartIndex = 6, windowEndIndex = 35
  const [windowStartIndex, setWindowStartIndex] = useState(1);
  const [windowEndIndex, setWindowEndIndex] = useState(0);

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

  // Combina historial + live → orden ascendente
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

  // Cargar mensajes del hilo activo → "ventana" de los últimos PAGE_SIZE mensajes
  useEffect(() => {
    if (!activeThread?.id) {
      setHistory([]);
      setCurrentPage(1);
      setHasMoreMessages(false);
      setTotalMessages(0);
      setWindowStartIndex(1);
      setWindowEndIndex(0);
      return;
    }
    let alive = true;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        // 1) Pedimos página 1 para saber el total (count) y tener sus resultados.
        const firstPageData = await fetchThreadMessages(activeThread.id, {
          page: 1,
          page_size: PAGE_SIZE,
        });
        if (!alive) return;

        const firstResults = firstPageData.results || [];
        const count =
          firstPageData.count ??
          (Array.isArray(firstResults) ? firstResults.length : 0);

        if (count === 0) {
          setHistory([]);
          setCurrentPage(1);
          setTotalMessages(0);
          setWindowStartIndex(1);
          setWindowEndIndex(0);
          setHasMoreMessages(false);
          return;
        }

        const lastPage = Math.max(1, Math.ceil(count / PAGE_SIZE));

        // Si solo hay una página, mostramos todos (<= PAGE_SIZE)
        if (lastPage === 1) {
          setHistory(firstResults);
          setCurrentPage(1);
          setTotalMessages(count);
          setWindowStartIndex(1);
          setWindowEndIndex(count);
          setHasMoreMessages(false);
          return;
        }

        // 2) Hay varias páginas → construimos una "ventana" con los últimos PAGE_SIZE mensajes.
        const chunks = [];
        let loaded = 0;

        // Vamos de la última página hacia atrás hasta juntar >= PAGE_SIZE mensajes,
        // reutilizando la página 1 que ya trajimos.
        for (let page = lastPage; page >= 1 && loaded < PAGE_SIZE; page--) {
          let pageData;
          if (page === 1) {
            pageData = firstPageData;
          } else {
            pageData = await fetchThreadMessages(activeThread.id, {
              page,
              page_size: PAGE_SIZE,
            });
            if (!alive) return;
          }
          const res = pageData.results || [];
          chunks.push({ page, results: res });
          loaded += res.length;
        }

        // Ordenamos los chunks por número de página ascendente y concatenamos
        chunks.sort((a, b) => a.page - b.page);
        let combined = [];
        for (const ch of chunks) {
          combined = combined.concat(ch.results || []);
        }

        // Nos quedamos SOLO con los últimos PAGE_SIZE mensajes
        if (combined.length > PAGE_SIZE) {
          combined = combined.slice(combined.length - PAGE_SIZE);
        }

        // Ejemplo: count = 35, PAGE_SIZE = 30 → combined = mensajes 6..35
        setHistory(combined);
        setCurrentPage(lastPage);
        setTotalMessages(count);

        const windowSize = combined.length; // normalmente PAGE_SIZE
        const endIdx = count; // el mensaje más nuevo es el índice "count"
        const startIdx = count - windowSize + 1; // índice del más viejo en la ventana
        setWindowStartIndex(startIdx);
        setWindowEndIndex(endIdx);
        setHasMoreMessages(startIdx > 1); // hay más si no empieza en 1
      } catch (err) {
        console.error("Error cargando mensajes:", err);
      } finally {
        if (alive) setLoadingMessages(false);
      }
    };

    loadMessages();
    setPendingDirectUser(null); // Al cambiar de hilo, ya no hay DM pendiente

    return () => {
      alive = false;
    };
  }, [activeThread?.id]);

  // Cargar más mensajes → trae la "ventana" anterior (mensajes más viejos)
  const handleLoadMoreMessages = async () => {
    if (!activeThread?.id) return;
    if (!hasMoreMessages || loadingMore) return;
    if (windowStartIndex <= 1) return; // ya no hay más viejos

    setLoadingMore(true);
    try {
      const total = totalMessages;

      // Rango nuevo que queremos cargar (justo antes de la ventana actual)
      // Ejemplo: ventana actual = 6..35
      //  -> newEndIdx = 5
      //  -> newStartIdx = max(1, 5 - 30 + 1) = 1   => 1..5
      const newEndIdx = windowStartIndex - 1;
      const newStartIdx = Math.max(1, newEndIdx - PAGE_SIZE + 1);

      // Páginas que cubren ese rango
      const firstPageToFetch = Math.ceil(newStartIdx / PAGE_SIZE);
      const lastPageToFetch = Math.ceil(newEndIdx / PAGE_SIZE);

      let extraMessages = [];

      for (let page = firstPageToFetch; page <= lastPageToFetch; page++) {
        const data = await fetchThreadMessages(activeThread.id, {
          page,
          page_size: PAGE_SIZE,
        });
        const results = data.results || [];

        // Cada mensaje de la página tiene un índice global:
        // indexGlobal = (page - 1) * PAGE_SIZE + (idxLocal + 1)
        results.forEach((m, idx) => {
          const globalIndex = (page - 1) * PAGE_SIZE + (idx + 1);
          if (globalIndex >= newStartIdx && globalIndex <= newEndIdx) {
            extraMessages.push(m);
          }
        });
      }

      // Unimos sin duplicar; mergedMessages se encarga del orden por fecha
      setHistory((prev) => {
        const map = new Map();
        for (const m of extraMessages) map.set(m.id, m);
        for (const m of prev) map.set(m.id, m);
        return Array.from(map.values());
      });

      setWindowStartIndex(newStartIdx);
      setWindowEndIndex(windowEndIndex); // el final (más nuevo) no cambia
      setHasMoreMessages(newStartIdx > 1);
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
        setWindowStartIndex(1);
        setWindowEndIndex(0);
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
