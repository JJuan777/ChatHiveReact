// src/features/chat/hooks/useChatSocket.js
import { useEffect, useRef, useState } from "react";
import { createWS } from "../../../app/lib/ws";

export function useChatSocket({ threadId, userId, token }) {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]); // usuarios que están escribiendo en este hilo
  const [isReady, setIsReady] = useState(false);
  const wsRef = useRef(null);

  // 1) Conectar SOLO una vez (no depende de threadId)
  useEffect(() => {
    wsRef.current = createWS("/ws/chat/", {
      onOpen: () => {
        setIsReady(true);
        // Si ya hay hilo activo cuando abra, nos unimos
        if (threadId) {
          wsRef.current?.send({
            type: "thread.join",
            payload: { thread_id: threadId },
          });
        }
      },
      onMessage: (msg) => {
        // console.log("💬 WS msg:", msg);
        if (msg?.type === "message.created") {
          setMessages((prev) => [...prev, msg.payload.message]);
        } else if (msg?.type === "typing") {
          const payload = msg.payload || {};
          const { thread_id, user_id, status } = payload;

          if (!thread_id || !user_id) return;
          // Si el evento es de otro hilo, lo ignoramos
          if (threadId && thread_id !== threadId) return;
          // Ignoramos nuestro propio typing
          if (String(user_id) === String(userId)) return;

          setTypingUsers((prev) => {
            const set = new Set(prev);
            if (status === "start") {
              set.add(String(user_id));
            } else if (status === "stop") {
              set.delete(String(user_id));
            }
            return Array.from(set);
          });
        }
      },
      onClose: () => {
        setIsReady(false);
        setMessages([]);
        setTypingUsers([]);
      },
      onError: (e) => {
        console.error("🔴 WS error:", e);
      },
    });

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      setIsReady(false);
      setMessages([]);
      setTypingUsers([]);
    };
  }, []); // 👈 importante: SIN [threadId]

  // 2) Cuando cambie el hilo activo, mandar thread.join SI el WS está listo
  useEffect(() => {
    if (!threadId || !isReady || !wsRef.current) return;

    // limpiamos mensajes y typing de otros hilos
    setMessages([]);
    setTypingUsers([]);

    wsRef.current.send({
      type: "thread.join",
      payload: { thread_id: threadId },
    });
  }, [threadId, isReady]);

  // 3) Enviar mensaje por WS (solo con texto, el hook arma el payload)
  const sendMessage = (text, { clientId } = {}) => {
    if (!isReady || !threadId || !wsRef.current) {
      console.warn("❌ WS no listo o sin threadId");
      return;
    }

    const cid =
      clientId ||
      (globalThis.crypto?.randomUUID?.() ?? String(Date.now()));

    wsRef.current.send({
      type: "message.send",
      payload: {
        thread_id: threadId,
        text,
        client_id: cid,
        user_id: userId,
      },
    });
  };

  // 4) Enviar eventos de typing
  const startTyping = () => {
    if (!isReady || !threadId || !wsRef.current) return;
    wsRef.current.send({
      type: "typing.start",
      payload: { thread_id: threadId },
    });
  };

  const stopTyping = () => {
    if (!isReady || !threadId || !wsRef.current) return;
    wsRef.current.send({
      type: "typing.stop",
      payload: { thread_id: threadId },
    });
  };

  return { messages, sendMessage, isReady, typingUsers, startTyping, stopTyping };
}
