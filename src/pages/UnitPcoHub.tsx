import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../Layout'
import { getPrisoners, getAuditEntries, getDailyTasks, listHubSnapshots, getHubSnapshot, countIncompleteDailyTasks } from '../store'
import { UNITS, getUnitsForPrison } from '../constants'
import type { UnitId } from '../types'

export default function UnitPcoHub() {
  const { prisonId, unitId } = useParams<{ prisonId?: string; unitId?: string }>()
  const id = (unitId ?? 'north') as UnitId
  const unitsToSearch = prisonId ? getUnitsForPrison(prisonId) : UNITS
  const unit = unitsToSearch.find((u) => u.id === id) ?? UNITS[0]

  const [prisoners, setPrisoners] = useState(getPrisoners(id))
  const [audit, setAudit] = useState(getAuditEntries())
  const [tasks, setTasks] = useState(getDailyTasks(id, new Date().toISOString().slice(0, 10)))
  const [incompleteCount, setIncompleteCount] = useState(0)
  const [availableSnapshots, setAvailableSnapshots] = useState<string[]>([])
  const [loadedSnapshot, setLoadedSnapshot] = useState<any | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    setPrisoners(getPrisoners(id))
    setAudit(getAuditEntries())
    setTasks(getDailyTasks(id, today))
    const count = countIncompleteDailyTasks(id, today)
    setIncompleteCount(count)
    setAvailableSnapshots(listHubSnapshots(id))

    const onStorage = () => {
      setPrisoners(getPrisoners(id))
      setAudit(getAuditEntries())
      setTasks(getDailyTasks(id, today))
      const updated = countIncompleteDailyTasks(id, today)
      setIncompleteCount(updated)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [id, today])

  const refreshSnapshots = () => setAvailableSnapshots(listHubSnapshots(id))
  const loadSnapshot = (date: string) => setLoadedSnapshot(getHubSnapshot(id, date))

  // Get prisoner counts by location
  const byLocation: Record<string, number> = {}
  prisoners.forEach((p) => {
    byLocation[p.location] = (byLocation[p.location] ?? 0) + 1
  })

  // Activity trends for this unit
  const unitAudit = audit.filter((e) => e.unitId === id)
  const movementEntries = unitAudit.filter((e) => {
    const a = (e.action ?? '').toLowerCase()
    return a.includes('move') || a.includes('moved') || a.includes('location')
  })

  const locationNames: Record<string, string> = {
    CELL: 'Cell',
    YARD: 'Yard',
    MEDICAL: 'Medical',
    COURT: 'Court',
    VISITS: 'Visits',
    PROGRAMMES: 'Programmes',
    WORK: 'Work',
    OTHER: 'Other',
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}/unit/${id}` : `/unit/${id}`} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← {unit.name} Hub</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">{unit.name} — PCO Hub</h1>
          <p className="text-sm text-slate-600">Unit-specific operational overview, muster summary, and audit review</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Muster Summary */}
        <section className="card lg:col-span-1">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Unit Muster Summary</div>
          <div className="p-4">
            <div className="text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-700">Total prisoners:</span>
                <span className="font-bold text-lg">{prisoners.length}</span>
              </div>
              <div className="border-t pt-3">
                <div className="text-xs text-slate-600 mb-2 font-medium">By Location:</div>
                {Object.entries(byLocation)
                  .sort()
                  .map(([loc, count]) => (
                    <div key={loc} className="flex items-center justify-between text-sm py-1">
                      <span className="text-slate-600">{locationNames[loc] || loc}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </section>

        {/* Incomplete Tasks & Trends */}
        <section className="card lg:col-span-2">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Operational Status</div>
          <div className="p-4 space-y-4">
            {incompleteCount > 0 && (
              <div className="border-l-4 border-orange-500 bg-orange-50 p-3 rounded">
                <h3 className="font-semibold text-orange-800 text-sm">Incomplete Daily Tasks</h3>
                <p className="text-sm text-orange-700 mt-1">{incompleteCount} task{incompleteCount !== 1 ? 's' : ''} not completed</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-sm mb-3">Activity Trends</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded p-3">
                  <div className="text-xl font-bold text-corrections-blue">{movementEntries.length}</div>
                  <div className="text-xs text-slate-600 mt-1">Movement actions</div>
                </div>
                <div className="bg-slate-50 rounded p-3">
                  <div className="text-xl font-bold text-slate-700">{tasks.filter((t) => t.done).length}/{tasks.length}</div>
                  <div className="text-xs text-slate-600 mt-1">Tasks completed</div>
                </div>
                <div className="bg-slate-50 rounded p-3">
                  <div className="text-xl font-bold text-slate-700">{unitAudit.length}</div>
                  <div className="text-xs text-slate-600 mt-1">Unit audit entries</div>
                </div>
                <div className="bg-slate-50 rounded p-3">
                  <div className="text-xl font-bold text-slate-700">{prisoners.filter((p) => p.location !== 'CELL').length}</div>
                  <div className="text-xs text-slate-600 mt-1">Out of unit</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Snapshots */}
        <section className="card lg:col-span-3">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Unit Hub Snapshot Review</div>
          <div className="p-4">
            <div className="flex gap-2 items-center mb-3">
              <select onChange={(e) => loadSnapshot(e.target.value)} className="border rounded p-2 text-sm">
                <option value="">Select snapshot...</option>
                {availableSnapshots.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              <button type="button" onClick={refreshSnapshots} className="btn-outline text-sm">
                Refresh list
              </button>
            </div>
            {loadedSnapshot && (
              <div className="border rounded p-3 bg-slate-50 text-sm space-y-1">
                <div>
                  <strong>Date:</strong> {loadedSnapshot.date}
                </div>
                <div>
                  <strong>Tasks:</strong> {loadedSnapshot.tasks?.length ?? 0} items
                </div>
                <div>
                  <strong>Muster confirmed:</strong> {loadedSnapshot.muster ? JSON.stringify(loadedSnapshot.muster) : '—'}
                </div>
                <div>
                  <strong>Cell alarms checked:</strong> {(loadedSnapshot.alarms ?? []).filter((a: any) => a.checked).length} / {(loadedSnapshot.alarms ?? []).length}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Unit Audit Trail */}
        <section className="card lg:col-span-3">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Unit Audit Trail</div>
          <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="text-left p-2">Time</th>
                  <th className="text-left p-2">Action</th>
                  <th className="text-left p-2">Prisoner</th>
                  <th className="text-left p-2">Location</th>
                  <th className="text-left p-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {unitAudit.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-slate-500">
                      No audit entries for this unit yet
                    </td>
                  </tr>
                ) : (
                  unitAudit.map((entry) => (
                    <tr key={entry.id} className="border-t border-slate-200 hover:bg-slate-50">
                      <td className="p-2 text-slate-600 whitespace-nowrap">{new Date(entry.timestamp).toLocaleTimeString()}</td>
                      <td className="p-2 font-medium text-sm">{entry.action}</td>
                      <td className="p-2 font-medium text-corrections-blue text-sm">{entry.prisonerName ?? '—'}</td>
                      <td className="p-2 capitalize font-medium text-sm">{entry.prisonerLocation ?? '—'}</td>
                      <td className="p-2 text-slate-600 text-sm">{entry.detail ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </Layout>
  )
}
