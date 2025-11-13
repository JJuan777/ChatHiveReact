import { ENV } from '@app/config/env'

export function createWS(path, { token, onMessage, onOpen, onClose } = {}) {
  const url = new URL(path, ENV.wsUrl).toString()
  let ws
  let retry = 0
  const connect = () => {
    ws = new WebSocket(url, token ? ['jwt', token] : undefined)
    ws.onopen = (e) => { retry = 0; onOpen?.(e) }
    ws.onmessage = (e) => onMessage?.(JSON.parse(e.data))
    ws.onclose = (e) => {
      onClose?.(e)
      setTimeout(connect, Math.min(1000 * (2 ** retry), 15000))
      retry++
    }
  }
  connect()
  return {
    send: (obj) => ws?.readyState === 1 && ws.send(JSON.stringify(obj)),
    close: () => ws?.close(),
  }
}
