// src/features/chat/hooks/useChatSocket.js
import { useEffect, useRef, useState } from "react";
import { createWS } from "../../../app/lib/ws";

export function useChatSocket({ threadId, userId }) {
  const [messages, setMessages] = useState([]);
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
        }
      },
      onClose: () => {
        setIsReady(false);
      },
      onError: (e) => {
        console.error("🔴 WS error:", e);
      },
    });

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
      setIsReady(false);
    };
  }, []); // 👈 importante: SIN [threadId]

  // 2) Cuando cambie el hilo activo, mandar thread.join SI el WS está listo
  useEffect(() => {
    if (!threadId || !isReady || !wsRef.current) return;

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

    const cid = clientId || (globalThis.crypto?.randomUUID?.() ?? String(Date.now()));

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

  return { messages, sendMessage, isReady };
}
