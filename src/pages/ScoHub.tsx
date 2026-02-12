import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../Layout'
import { getAuditEntries } from '../store'
import type { AuditEntry } from '../types'

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('en-NZ', { dateStyle: 'short', timeStyle: 'short' })
}

export default function ScoHub() {
  const { prisonId, unitId } = useParams<{ prisonId?: string; unitId?: string }>()
  const [entries, setEntries] = useState<AuditEntry[]>(() => getAuditEntries())
  const [live, setLive] = useState(false)
  const [intervalMs, setIntervalMs] = useState<number>(5000)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  

  useEffect(() => {
    const onStorage = () => {
      setEntries(getAuditEntries())
      setLastUpdated(new Date().toISOString())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!live) return
    let sub: { close: () => void } | null = null
    let pollId: number | null = null
    let pollTimeout: number | null = null

    ;(async () => {
      try {
        const { subscribeAudit } = await import('../ws')
        sub = subscribeAudit((entry) => {
          setEntries((prev) => [entry, ...prev].slice(0, 500))
          setLastUpdated(new Date().toISOString())
        }, () => {})
      } catch (e) {
        // no websocket available
      }

      if (!sub) {
        // start polling immediately
        pollId = window.setInterval(() => {
          setEntries(getAuditEntries())
          setLastUpdated(new Date().toISOString())
        }, intervalMs)
      } else {
        // in case WS connects slowly, fallback to polling after a short delay
        pollTimeout = window.setTimeout(() => {
          if (!sub) {
            pollId = window.setInterval(() => {
              setEntries(getAuditEntries())
              setLastUpdated(new Date().toISOString())
            }, intervalMs)
          }
        }, 800)
      }
    })()

    return () => {
      if (pollTimeout) clearTimeout(pollTimeout)
      if (pollId) clearInterval(pollId)
      sub?.close()
    }
  }, [live, intervalMs])

  // Movement-related filters: moves and location updates
  const movementAll = entries.filter((e) => {
    const a = (e.action ?? '').toLowerCase()
    return a.includes('move') || a.includes('moved') || a.includes('location updated') || a.includes('location')
  })

  // If a unitId is provided in the route, show only entries for that unit
  const movement = unitId ? movementAll.filter((e) => e.unitId === unitId) : movementAll

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}` : '/'} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← {prisonId ? 'Back to units' : 'Unit selection'}</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">SCO Hub — Movement log</h1>
          <p className="text-sm text-slate-600">Running log of movement and location updates (filtered from audit trail).</p>
        </div>
        <div className="flex gap-2">
          <Link to={prisonId ? `/prison/${prisonId}/control` : '/control'} className="btn-outline">Open Control Hub</Link>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Movement log</h3>
          <div className="flex gap-2 items-center">
            <button type="button" onClick={() => { setEntries(getAuditEntries()); setLastUpdated(new Date().toISOString()) }} className="btn-outline">Refresh</button>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} className="rounded" />
              <span className="text-sm">Live</span>
            </label>
            <select value={String(intervalMs)} onChange={(e) => setIntervalMs(parseInt(e.target.value, 10))} className="border rounded p-1 text-sm">
              <option value="2000">2s</option>
              <option value="5000">5s</option>
              <option value="10000">10s</option>
              <option value="30000">30s</option>
            </select>
            <div className="ml-2 flex items-center gap-2 text-sm">
              <span className={`inline-block w-2 h-2 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              <span className="text-slate-600">{live ? 'Polling' : 'Idle'}</span>
              {lastUpdated && <span className="text-slate-500 ml-2">Last: {new Date(lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-corrections-charcoal text-white sticky top-0">
              <tr>
                <th className="text-left p-2">Time</th>
                <th className="text-left p-2">Action</th>
                <th className="text-left p-2">Detail</th>
                <th className="text-left p-2">Unit</th>
              </tr>
            </thead>
            <tbody>
              {movement.map((entry) => (
                <tr key={entry.id} className="border-t border-slate-200 hover:bg-slate-50">
                  <td className="p-2 text-slate-600 whitespace-nowrap">{formatDate(entry.timestamp)}</td>
                  <td className="p-2 font-medium">{entry.action}</td>
                  <td className="p-2 text-slate-600">{entry.detail ?? '—'}</td>
                  <td className="p-2 capitalize">{entry.unitId ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {movement.length === 0 && (
          <div className="p-8 text-center text-slate-500">No movement entries yet.</div>
        )}
      </div>
    </Layout>
  )
}
