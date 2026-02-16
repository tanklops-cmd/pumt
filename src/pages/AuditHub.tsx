import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../Layout'
import { getAuditEntries, listHubSnapshots, getHubSnapshot } from '../store'
import { UNITS, getUnitsForPrison } from '../constants'
import type { AuditEntry } from '../types'
import { getAuditRecords } from '../api'

interface BackendAuditRecord {
  id: string;
  userId: string;
  unitId: string;
  pageName: string;
  timestamp: string;
  htmlSnapshot: string;
  screenshotUrl?: string | null;
  pdfUrl?: string | null;
}

export default function AuditHub() {
  const { prisonId } = useParams<{ prisonId?: string }>()
  const [audit, setAudit] = useState<AuditEntry[]>(() => getAuditEntries())
  const [backendRecords, setBackendRecords] = useState<BackendAuditRecord[]>([])
  const [selectedUnit, setSelectedUnit] = useState<string>('north')
  const [availableSnapshots, setAvailableSnapshots] = useState<string[]>([])
  const [loadedSnapshot, setLoadedSnapshot] = useState<any | null>(null)
  const [loadingBackend, setLoadingBackend] = useState(false)

  const unitsToSearch = prisonId ? getUnitsForPrison(prisonId) : UNITS

  useEffect(() => {
    setAudit(getAuditEntries())
    const onStorage = () => setAudit(getAuditEntries())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [prisonId])

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const fetchBackendRecords = async () => {
    setLoadingBackend(true)
    try {
      const response = await fetch(`${API_BASE}/api/audit`);
      if (!response.ok) {
        // Backend might not have the table - this is OK for now
        setBackendRecords([]);
        return;
      }
      const records = await response.json();
      setBackendRecords(Array.isArray(records) ? records : []);
    } catch (err) {
      console.error('Failed to fetch backend audit:', err)
      setBackendRecords([]);
    } finally {
      setLoadingBackend(false)
    }
  }

  useEffect(() => {
    fetchBackendRecords()
  }, [])

  const refreshSnapshots = (unitId = selectedUnit) => setAvailableSnapshots(listHubSnapshots(unitId as any))
  const loadSnapshot = (unitId: string, date: string) => setLoadedSnapshot(getHubSnapshot(unitId as any, date))

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}` : '/'} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← {prisonId ? 'Back to units' : 'Unit selection'}</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">Audit Trail</h1>
          <p className="text-sm text-slate-600">Review audit entries from local storage and backend database</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchBackendRecords} className="btn-outline" disabled={loadingBackend}>
            {loadingBackend ? 'Loading...' : 'Refresh Backend Records'}
          </button>
          <Link to={prisonId ? `/prison/${prisonId}/sco` : '/sco'} className="btn-outline">Back to SCO Hub</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Backend Records Section */}
        <section className="card">
          <div className="p-4 border-b bg-corrections-blue text-white">
            <h3 className="font-semibold">Backend Page Snapshots</h3>
            <p className="text-sm text-white/80">Captured page states from the Record Page button</p>
          </div>
          <div className="overflow-x-auto max-h-[40vh] overflow-y-auto">
            {backendRecords.length === 0 ? (
              <div className="p-4 text-slate-500">No backend records yet. Click "Record Page" on UnitHub to capture page states.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Time</th>
                    <th className="text-left p-2">Page</th>
                    <th className="text-left p-2">Unit</th>
                    <th className="text-left p-2">User ID</th>
                    <th className="text-left p-2">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {backendRecords.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="p-2 text-slate-600 whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString()}
                      </td>
                      <td className="p-2 font-medium">{entry.pageName || '—'}</td>
                      <td className="p-2 capitalize">{entry.unitId || '—'}</td>
                      <td className="p-2 text-slate-600">{entry.userId || '—'}</td>
                      <td className="p-2">
                        {entry.screenshotUrl ? (
                          <a 
                            href={`${API_BASE}${entry.screenshotUrl}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-corrections-blue hover:underline mr-2"
                          >
                            View PNG
                          </a>
                        ) : null}
                        {entry.pdfUrl ? (
                          <a 
                            href={`${API_BASE}${entry.pdfUrl}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-corrections-blue hover:underline"
                          >
                            View PDF
                          </a>
                        ) : null}
                        {!entry.screenshotUrl && !entry.pdfUrl && (
                          <details className="group">
                            <summary className="cursor-pointer text-corrections-blue hover:underline">View HTML</summary>
                            <pre className="mt-2 p-2 bg-slate-100 text-xs overflow-x-auto max-h-40">
                              {entry.htmlSnapshot?.substring(0, 500)}...
                            </pre>
                          </details>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Local Audit Section */}
        <section className="card">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-2">Local Audit Trail</h3>
            <div className="flex gap-2 items-center">
              <button type="button" onClick={() => setAudit(getAuditEntries())} className="btn-outline">Refresh</button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-corrections-charcoal text-white sticky top-0">
                <tr>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Action</th>
                  <th className="text-left p-2">Prisoner</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Detail</th>
                  <th className="text-left p-2">Unit</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="p-2 text-slate-600 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="p-2 font-medium">{entry.action}</td>
                    <td className="p-2 font-medium text-corrections-blue">{entry.prisonerName ?? '—'}</td>
                    <td className="p-2 capitalize font-medium">{entry.prisonerLocation ?? '—'}</td>
                    <td className="p-2 text-slate-600">{entry.detail ?? '—'}</td>
                    <td className="p-2 capitalize">{entry.unitId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  )
}
