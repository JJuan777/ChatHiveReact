// src/app/lib/ws.js
import { ENV } from "../../app/config/env";

export function createWS(path, { onMessage, onOpen, onClose, onError } = {}) {
  const url = new URL(path, ENV.wsUrl);
  let ws;
  let retry = 0;
  let closedManually = false;

  const connect = () => {
    if (closedManually) return;
    console.info("🔌 WS → conectando a", url.toString());
    ws = new WebSocket(url); // 👈 sin subprotocolos/token

    ws.onopen = (e) => {
      retry = 0;
      console.info("🟢 WS conectado:", url.toString());
      onOpen?.(e);
    };
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onMessage?.(data);
      } catch (err) {
        console.error("WS parse error:", err, e.data);
      }
    };
    ws.onerror = (e) => {
      console.error("🔴 WS error:", e);
      onError?.(e);
    };
    ws.onclose = (e) => {
      console.warn("🟠 WS cerrado:", e.code, e.reason || "");
      onClose?.(e);
      if (!closedManually) {
        const delay = Math.min(1000 * 2 ** retry, 15000);
        console.warn(`⏳ Reintentando en ${delay / 1000}s… (intento ${retry + 1})`);
        setTimeout(connect, delay);
        retry++;
      }
    };
  };

  connect();

  return {
    send: (obj) => {
      if (ws?.readyState === 1) ws.send(JSON.stringify(obj));
      else console.warn("❌ WS no listo para enviar:", obj);
    },
    close: () => {
      closedManually = true;
      console.info("🔌 WS → close solicitado");
      ws?.close();
    },
  };
}
