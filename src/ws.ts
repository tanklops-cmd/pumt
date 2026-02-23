import type { AuditEntry } from './types'

type StatusCb = (connected: boolean) => void

export interface PageRecordEvent {
  type: 'page_recorded'
  action: 'all_completed' | 'prison_completed'
  payload: {
    triggeredBy: string
    timestamp: string
    totalUnits?: number
    successful?: number
    failed?: number
    results?: Array<{ prisonId: string; unitId: string; success: boolean; error?: string }>
    prisonId?: string
  }
}

type PageRecordCb = (event: PageRecordEvent) => void

export function subscribeAudit(onEntry: (entry: AuditEntry) => void, onStatus?: StatusCb) {
  const url = (import.meta.env?.VITE_WS_URL as string) ?? 'ws://localhost:3001'
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

/**
 * Subscribe to page recording events (from manual trigger or scheduler)
 */
export function subscribePageRecord(onEvent: PageRecordCb, onStatus?: StatusCb) {
  const url = (import.meta.env?.VITE_WS_URL as string) ?? 'ws://localhost:3001'
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
        if (data?.type === 'page_recorded') {
          onEvent(data as PageRecordEvent)
        }
      } catch (e) {
        // ignore
      }
    }
    ws.onclose = () => {
      onStatus?.(false)
      if (!closed) {
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
