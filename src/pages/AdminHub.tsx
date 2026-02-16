import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../Layout'
import { getAuditEntries, replaceAllPrisoners, addAuditEntry, listHubSnapshots, getHubSnapshot } from '../store'
import type { AuditEntry } from '../types'
import { ADMIN_PASSWORD } from '../constants'
import { generateMockPrisoners } from '../mockPrisoners'
import { UNITS } from '../constants'
import * as api from '../api'

const STORAGE_ADMIN_KEY = 'prison-muster-admin-ok'

export default function AdminHub() {
  const [password, setPassword] = useState('')
  const [authenticated, setAuthenticated] = useState(() => {
    try {
      const exp = sessionStorage.getItem(STORAGE_ADMIN_KEY)
      if (!exp) return false
      return Date.now() < parseInt(exp, 10)
    } catch {
      return false
    }
  })
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [error, setError] = useState('')
  const [selectedUnit, setSelectedUnit] = useState(UNITS[0].id)
  const [availableSnapshots, setAvailableSnapshots] = useState<string[]>([])
  const [loadedSnapshot, setLoadedSnapshot] = useState<any | null>(null)

  useEffect(() => {
    if (authenticated) setAudit(getAuditEntries())
  }, [authenticated])

  const login = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!ADMIN_PASSWORD) {
      setError('Admin password is not configured. Set VITE_ADMIN_PASSWORD at build time to enable admin access.')
      return
    }
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(STORAGE_ADMIN_KEY, String(Date.now() + 8 * 60 * 60 * 1000)) // 8h
      setAuthenticated(true)
      setPassword('')
    } else {
      setError('Incorrect password.')
    }
  }

  const logout = () => {
    sessionStorage.removeItem(STORAGE_ADMIN_KEY)
    setAuthenticated(false)
  }

  if (!authenticated) {
    return (
      <Layout>
        <div className="max-w-md mx-auto card p-6">
          <h1 className="text-xl font-bold text-corrections-charcoal mb-2">Administration hub</h1>
          <p className="text-sm text-slate-600 mb-4">Enter the administration password to view the audit trail.</p>
          {ADMIN_PASSWORD ? (
            <form onSubmit={login}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3"
                autoFocus
              />
              {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
              <button type="submit" className="btn-corrections w-full">Access admin</button>
            </form>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
              <p className="text-sm text-yellow-800">Admin access is disabled because no admin password is configured at build time. Set <code>VITE_ADMIN_PASSWORD</code> in your build environment to enable admin features.</p>
            </div>
          )}
        </div>
      </Layout>
    )
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return d.toLocaleString('en-NZ', { dateStyle: 'short', timeStyle: 'short' })
  }

  const loadMockPrisoners = async () => {
    if (!confirm('This will replace all current prisoners with 190 mock prisoners across all units. Continue?')) return
    
    const mock = generateMockPrisoners()
    replaceAllPrisoners(mock)
    
    // Push each prisoner to backend
    for (const prisoner of mock) {
      try {
        await api.savePrisoner(prisoner)
      } catch (e) {
        console.error('Failed to save prisoner:', prisoner.id, e)
      }
    }
    
    addAuditEntry({ action: 'Mock data loaded', detail: '190 prisoners' })
    setAudit(getAuditEntries())
    alert('Loaded 190 mock prisoners (South: 60, Centre: 60, North: 35, Remand: 35).')
  }

  const refreshSnapshots = (unitId = selectedUnit) => {
    setAvailableSnapshots(listHubSnapshots(unitId as any))
  }

  const loadSnapshot = (unitId: string, date: string) => {
    const snap = getHubSnapshot(unitId as any, date)
    setLoadedSnapshot(snap)
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-corrections-charcoal">Audit trail</h1>
        <div className="flex gap-2 flex-wrap">
          <Link
            to="/unit-config"
            className="btn-corrections text-sm"
          >
            Unit Config
          </Link>
          <button
            type="button"
            onClick={loadMockPrisoners}
            className="btn-corrections text-sm"
          >
            Load 190 mock prisoners
          </button>
          <button type="button" onClick={() => setAudit(getAuditEntries())} className="btn-outline text-sm">
            Refresh
          </button>
          <button type="button" onClick={logout} className="text-slate-600 hover:underline text-sm">
            Log out
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="font-semibold mb-2">Review unit hub snapshot</h3>
          <div className="flex gap-2 items-center">
            <select value={selectedUnit} onChange={(e) => { setSelectedUnit(e.target.value as any); setAvailableSnapshots(listHubSnapshots(e.target.value as any)) }} className="border rounded p-2">
              {UNITS.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <select onChange={(e) => loadSnapshot(selectedUnit, e.target.value)} className="border rounded p-2">
              <option value="">Select snapshot...</option>
              {availableSnapshots.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            <button type="button" onClick={() => refreshSnapshots()} className="btn-outline">Refresh list</button>
          </div>
          {loadedSnapshot && (
            <div className="mt-3 border rounded p-3 bg-slate-50 text-sm">
              <div><strong>Date:</strong> {loadedSnapshot.date}</div>
              <div className="mt-2"><strong>Tasks:</strong> {loadedSnapshot.tasks?.length ?? 0} items</div>
              <div><strong>Muster confirmed:</strong> {loadedSnapshot.muster ? JSON.stringify(loadedSnapshot.muster) : '—'}</div>
              <div><strong>Alarms:</strong> {(loadedSnapshot.alarms ?? []).filter((a:any)=>a.checked).length} / {(loadedSnapshot.alarms ?? []).length} checked</div>
              <div className="mt-2"><strong>Handover:</strong><div className="mt-1 whitespace-pre-wrap">{JSON.stringify(loadedSnapshot.handover)}</div></div>
            </div>
          )}
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
              {audit.map((entry) => (
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
        {audit.length === 0 && (
          <div className="p-8 text-center text-slate-500">No audit entries yet. Use the unit and muster pages to generate activity.</div>
        )}
      </div>
    </Layout>
  )
}
