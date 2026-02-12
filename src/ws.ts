import type { AuditEntry } from './types'

type StatusCb = (connected: boolean) => void

export function subscribeAudit(onEntry: (entry: AuditEntry) => void, onStatus?: StatusCb) {
  const url = (import.meta.env?.VITE_WS_URL as string) ?? 'ws://localhost:4000'
  let ws: WebSocket | null = null
  let closed = false

  function connect() {
    ws = new WebSocket(url)
    onStatus?.(false)
    ws.onopen = () => {
      onStatus?.(true)
    }
    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data?.type === 'audit' && data.entry) {
          onEntry(data.entry as AuditEntry)
        }
      } catch (e) {
        // ignore
      }
    }
    ws.onclose = () => {
      onStatus?.(false)
      if (!closed) {
        // try reconnect after delay
        setTimeout(() => connect(), 2000)
      }
    }
    ws.onerror = () => {
      // will trigger close
    }
  }

  try {
    connect()
  } catch (e) {
    onStatus?.(false)
  }

  return {
    close() {
      closed = true
      try { ws?.close() } catch {}
    },
  }
}
