import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GlassLayout from '../components/GlassLayout'
import { getAuditEntries, listHubSnapshots, getHubSnapshot } from '../store'
import type { AuditEntry } from '../types'

export default function PcoHub() {
  const { prisonId } = useParams<{ prisonId?: string }>()
  const [audit, setAudit] = useState<AuditEntry[]>(() => getAuditEntries())
  const [selectedUnit, setSelectedUnit] = useState<string>('north')
  const [availableSnapshots, setAvailableSnapshots] = useState<string[]>([])
  const [loadedSnapshot, setLoadedSnapshot] = useState<any | null>(null)

  useEffect(() => {
    setAudit(getAuditEntries())
    const onStorage = () => setAudit(getAuditEntries())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const refreshSnapshots = (unitId = selectedUnit) => setAvailableSnapshots(listHubSnapshots(unitId as any))
  const loadSnapshot = (unitId: string, date: string) => setLoadedSnapshot(getHubSnapshot(unitId as any, date))

  return (
<GlassLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}` : '/'} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← {prisonId ? 'Back to units' : 'Unit selection'}</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">PCO Hub</h1>
          <p className="text-sm text-slate-600">PCO view — audit and unit snapshots (read-only)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <section className="card">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-2">Review unit hub snapshot</h3>
            <div className="flex gap-2 items-center">
              <select value={selectedUnit} onChange={(e) => { setSelectedUnit(e.target.value); setAvailableSnapshots(listHubSnapshots(e.target.value as any)) }} className="border rounded p-2">
                <option value="north">North</option>
                <option value="south">South</option>
                <option value="remand">Remand</option>
                <option value="centre">Centre</option>
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
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-2">Audit trail (read-only)</h3>
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
                  <th className="text-left p-2">Detail</th>
                  <th className="text-left p-2">Unit</th>
                </tr>
              </thead>
              <tbody>
                {audit.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="p-2 text-slate-600 whitespace-nowrap">{new Date(entry.timestamp).toLocaleString()}</td>
                    <td className="p-2 font-medium">{entry.action}</td>
                    <td className="p-2 text-slate-600">{entry.detail ?? '—'}</td>
                    <td className="p-2 capitalize">{entry.unitId ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
</GlassLayout>
  )
}
