// src/features/chat/hooks/useChatSocket.js
import { useEffect, useRef, useState } from "react";
import { createWS } from "../../../app/lib/ws";

export function useChatSocket({ threadId, userId }) {
  const [messages, setMessages] = useState([]);
  const [isReady, setIsReady] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // sin token: la cookie se enviará automáticamente si el “site” coincide
    wsRef.current = createWS("/ws/chat/", {
      onOpen: () => {
        // console.log("WS conectado");
        setIsReady(true);
        if (threadId) {
          wsRef.current.send({ type: "thread.join", payload: { thread_id: threadId } });
        }
      },
      onMessage: (msg) => {
        // console.log("WS msg:", msg);
        if (msg?.type === "message.created") {
          setMessages((prev) => [...prev, msg.payload.message]);
        }
      },
      onClose: (e) => {
        // console.warn("WS cerrado:", e.code, e.reason || "");
        setIsReady(false);
      },
      onError: (e) => {
        // console.error("WS error:", e);
      },
    });

    return () => wsRef.current?.close();
  }, [threadId]);

  useEffect(() => {
    if (isReady && threadId && wsRef.current) {
      wsRef.current.send({ type: "thread.join", payload: { thread_id: threadId } });
    }
  }, [isReady, threadId]);

  const sendMessage = (text) => {
    if (!isReady || !threadId) {
      // console.error("WS no listo o sin hilo");
      return;
    }
    wsRef.current.send({
      type: "message.send",
      payload: { thread_id: threadId, text, client_id: crypto.randomUUID() },
    });
  };

  return { messages, sendMessage, isReady };
}
