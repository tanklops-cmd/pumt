import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GlassLayout from '../components/GlassLayout'
import { getPrisoners, getAuditEntries, getDailyTasks, listHubSnapshots, getHubSnapshot, countIncompleteDailyTasks, getPrisonersPendingInductionNotification, markPrisonerInductionNotified } from '../store'
import { UNITS, getUnitsForPrison } from '../constants'
import type { UnitId, Prisoner } from '../types'
import { getOutOfUnitHours } from '../printUtils'

// Helper to check if OPs is active (handles legacy string values)
function isOpsActive(p: Prisoner): boolean {
  if (p.ops === true) return true
  const maybe = (p as any).ops
  if (typeof maybe === 'string' && (maybe?.toLowerCase() === 'yes' || maybe === '1')) return true
  return false
}

// Helper to check if CCs is active (handles legacy string values)
function isCcsActive(p: Prisoner): boolean {
  if (p.ccs === true) return true
  const maybe = (p as any).ccs
  if (typeof maybe === 'string' && (maybe?.toLowerCase() === 'yes' || maybe === '1')) return true
  return false
}

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
  const [pendingInductions, setPendingInductions] = useState<{ prisoner: Prisoner; id: string }[]>([])

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    setPrisoners(getPrisoners(id))
    setAudit(getAuditEntries())
    setTasks(getDailyTasks(id, today))
    const count = countIncompleteDailyTasks(id, today)
    setIncompleteCount(count)
    setAvailableSnapshots(listHubSnapshots(id))
    setPendingInductions(getPrisonersPendingInductionNotification(id))

    const onStorage = () => {
      setPrisoners(getPrisoners(id))
      setAudit(getAuditEntries())
      setTasks(getDailyTasks(id, today))
      const updated = countIncompleteDailyTasks(id, today)
      setIncompleteCount(updated)
      setPendingInductions(getPrisonersPendingInductionNotification(id))
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [id, today])

  const handleDismissInduction = (prisonerId: string) => {
    markPrisonerInductionNotified(prisonerId, id)
    setPendingInductions(getPrisonersPendingInductionNotification(id))
    setPrisoners(getPrisoners(id))
    setAudit(getAuditEntries())
  }

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

  // Analytics calculations
  const totalPrisoners = prisoners.length
  
  // Low Yard Hours - prisoners with less than 2 hours in yard
  const lowYardPrisoners = prisoners.filter((p) => {
    const { summary } = getOutOfUnitHours(p.locationHistory ?? [], p.location)
    // Parse hours from summary (e.g., "2.5h Yard" -> 2.5)
    const yardMatch = summary.match(/([\d.]+)h\s*Yard/)
    if (!yardMatch) return true // No yard time = low
    const hours = parseFloat(yardMatch[1])
    return hours < 1
  })
  
  // Missed Meals - prisoners missing all meals (breakfast, lunch, dinner)
  const missedMealsPrisoners = prisoners.filter((p) => 
    !p.mealBreakfast && !p.mealLunch && !p.mealDinner
  )
  
  // OPs active
  const opsPrisoners = prisoners.filter((p) => isOpsActive(p))
  
  // CCs active
  const ccsPrisoners = prisoners.filter((p) => isCcsActive(p))

  return (
<GlassLayout>
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
                <span className="font-bold text-lg">{totalPrisoners}</span>
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
            
            {/* Induction Notifications */}
            {pendingInductions.length > 0 && (
              <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-blue-600">📋</span>
                  <h3 className="font-semibold text-blue-800 text-sm">Prisoner Inductions Complete ({pendingInductions.length})</h3>
                </div>
                <ul className="space-y-2">
                  {pendingInductions.map((item) => (
                    <li key={item.id} className="flex items-center justify-between bg-white p-2 rounded border border-blue-200">
                      <div>
                        <div className="text-sm font-medium text-blue-900">{item.prisoner.name || 'Unnamed'}</div>
                        <div className="text-xs text-blue-700">Cell: {item.prisoner.cell || '—'} • Inducted: {item.prisoner.inductedBy || 'Unknown'}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDismissInduction(item.id)}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                      >
                        Acknowledge
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Analytics Alerts */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm">Analytics & Alerts</h4>
              
              {/* Low Yard Hours Alert */}
              {lowYardPrisoners.length > 0 && (
                <div className="border-l-4 border-amber-500 bg-amber-50 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-600">⚠️</span>
                    <h3 className="font-semibold text-amber-800 text-sm">Low Yard Hours ({lowYardPrisoners.length})</h3>
                  </div>
                  <p className="text-xs text-amber-700 mt-1">Prisoners with less than 2 hours yard time:</p>
                  <ul className="mt-2 space-y-1">
                    {lowYardPrisoners.slice(0, 5).map((p) => (
                      <li key={p.id} className="text-sm text-amber-800 flex justify-between">
                        <span>{p.name || p.cell}</span>
                        <span className="font-mono text-xs">{p.cell}</span>
                      </li>
                    ))}
                    {lowYardPrisoners.length > 5 && (
                      <li className="text-xs text-amber-700">+{lowYardPrisoners.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* Missed Meals Alert */}
              {missedMealsPrisoners.length > 0 && (
                <div className="border-l-4 border-red-500 bg-red-50 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-red-600">🍽️</span>
                    <h3 className="font-semibold text-red-800 text-sm">Missed All Meals ({missedMealsPrisoners.length})</h3>
                  </div>
                  <p className="text-xs text-red-700 mt-1">Prisoners who missed all meals:</p>
                  <ul className="mt-2 space-y-1">
                    {missedMealsPrisoners.slice(0, 5).map((p) => (
                      <li key={p.id} className="text-sm text-red-800 flex justify-between">
                        <span>{p.name || p.cell}</span>
                        <span className="font-mono text-xs">{p.cell}</span>
                      </li>
                    ))}
                    {missedMealsPrisoners.length > 5 && (
                      <li className="text-xs text-red-700">+{missedMealsPrisoners.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* OPs Active Alert */}
              {opsPrisoners.length > 0 && (
                <div className="border-l-4 border-red-600 bg-red-100 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-red-700">🚨</span>
                    <h3 className="font-semibold text-red-900 text-sm">OPs Active ({opsPrisoners.length})</h3>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {opsPrisoners.slice(0, 5).map((p) => (
                      <li key={p.id} className="text-sm text-red-800 flex justify-between">
                        <span>{p.name || p.cell}</span>
                        <span className="font-mono text-xs">{p.cell}</span>
                      </li>
                    ))}
                    {opsPrisoners.length > 5 && (
                      <li className="text-xs text-red-700">+{opsPrisoners.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* CCs Active Alert */}
              {ccsPrisoners.length > 0 && (
                <div className="border-l-4 border-red-600 bg-red-100 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-red-700">🚨</span>
                    <h3 className="font-semibold text-red-900 text-sm">CCs Active ({ccsPrisoners.length})</h3>
                  </div>
                  <ul className="mt-2 space-y-1">
                    {ccsPrisoners.slice(0, 5).map((p) => (
                      <li key={p.id} className="text-sm text-red-800 flex justify-between">
                        <span>{p.name || p.cell}</span>
                        <span className="font-mono text-xs">{p.cell}</span>
                      </li>
                    ))}
                    {ccsPrisoners.length > 5 && (
                      <li className="text-xs text-red-700">+{ccsPrisoners.length - 5} more</li>
                    )}
                  </ul>
                </div>
              )}
              
              {/* No Alerts */}
              {lowYardPrisoners.length === 0 && missedMealsPrisoners.length === 0 && opsPrisoners.length === 0 && ccsPrisoners.length === 0 && (
                <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✓</span>
                    <span className="text-sm text-green-800 font-medium">No operational alerts</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold text-sm mb-3">Activity Summary</h4>
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
</GlassLayout>
  )
}
