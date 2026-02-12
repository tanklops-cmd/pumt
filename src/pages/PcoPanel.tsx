import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getPrisoners, unitsWithIncompleteTasksForPrison, unitsWithIncompleteTasksForAll, getAuditEntries } from '../store'
import { UNITS, getUnitsForPrison } from '../constants'
import type { UnitId } from '../types'

interface PcoPanelProps {
  prisonId?: string
  onClose: () => void
}

export function PcoPanel({ prisonId, onClose }: PcoPanelProps) {
  const unitsToSearch = prisonId ? getUnitsForPrison(prisonId) : UNITS
  const [incompleteUnits, setIncompleteUnits] = useState<Array<{ unitId: string; incomplete: number }>>([])
  const [incompleteCount, setIncompleteCount] = useState(0)
  const [audit, setAudit] = useState(getAuditEntries())

  const today = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    // Get incomplete tasks for today
    if (prisonId) {
      const incomplete = unitsWithIncompleteTasksForPrison(prisonId, today)
      setIncompleteUnits(incomplete)
      const count = incomplete.reduce((sum, item) => sum + item.incomplete, 0)
      setIncompleteCount(count)
    } else {
      const incomplete = unitsWithIncompleteTasksForAll(today)
      setIncompleteUnits(incomplete)
      const count = incomplete.reduce((sum, item) => sum + item.incomplete, 0)
      setIncompleteCount(count)
    }
    setAudit(getAuditEntries())
  }, [prisonId, today])

  // Count movement entries
  const movementEntries = audit.filter((e) => {
    const a = (e.action ?? '').toLowerCase()
    return a.includes('move') || a.includes('moved') || a.includes('location')
  })

  // Get unit prisoner counts by location for all units
  const unitsAndCounts = unitsToSearch.map((unit) => {
    const prisoners = getPrisoners(unit.id as UnitId)
    const byLocation: Record<string, number> = {}
    prisoners.forEach((p) => {
      byLocation[p.location] = (byLocation[p.location] ?? 0) + 1
    })
    return {
      unit,
      total: prisoners.length,
      byLocation,
    }
  })

  const totalAllUnits = unitsAndCounts.reduce((sum, u) => sum + u.total, 0)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-end overflow-y-auto">
      <div className="bg-white w-full max-w-2xl min-h-screen p-6 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-corrections-charcoal">PCO Hub</h2>
          <button onClick={onClose} className="text-2xl text-slate-400 hover:text-slate-600">×</button>
        </div>

        {/* Incomplete Tasks Notification */}
        {incompleteCount > 0 && (
          <section className="card mb-6 border-l-4 border-orange-500 bg-orange-50">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-orange-100 text-orange-600">
                    <span className="text-lg font-bold">!</span>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-orange-800">Incomplete Daily Tasks</h3>
                  <p className="text-sm text-orange-700 mt-1">
                    {incompleteCount} task{incompleteCount !== 1 ? 's' : ''} incomplete across {incompleteUnits.length} unit{incompleteUnits.length !== 1 ? 's' : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {incompleteUnits.map((item) => {
                      const unit = unitsToSearch.find((u) => u.id === item.unitId)
                      return (
                        <Link
                          key={item.unitId}
                          to={prisonId ? `/prison/${prisonId}/unit/${item.unitId}` : `/unit/${item.unitId}`}
                          className="inline-block px-2 py-1 bg-orange-200 text-orange-800 rounded text-xs font-medium hover:bg-orange-300"
                          onClick={onClose}
                        >
                          {unit?.shortName || item.unitId} ({item.incomplete})
                        </Link>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Trends Panel */}
        <section className="card mb-6">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Activity Trends</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 rounded p-3">
                <div className="text-2xl font-bold text-corrections-blue">{movementEntries.length}</div>
                <div className="text-xs text-slate-600 mt-1">Movement actions</div>
              </div>
              <div className="bg-slate-50 rounded p-3">
                <div className="text-2xl font-bold text-slate-700">{new Set(audit.map((e) => e.unitId)).size}</div>
                <div className="text-xs text-slate-600 mt-1">Units active</div>
              </div>
              <div className="bg-slate-50 rounded p-3">
                <div className="text-2xl font-bold text-slate-700">{audit.filter((e) => e.action?.includes('task')).length}</div>
                <div className="text-xs text-slate-600 mt-1">Task updates</div>
              </div>
              <div className="bg-slate-50 rounded p-3">
                <div className="text-2xl font-bold text-slate-700">{totalAllUnits}</div>
                <div className="text-xs text-slate-600 mt-1">Total prisoners</div>
              </div>
            </div>
          </div>
        </section>

        {/* Unit Muster Summary */}
        <section className="card">
          <div className="p-4 border-b">
            <h3 className="font-semibold mb-3">Unit Muster Summary</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {unitsAndCounts.map(({ unit, total, byLocation }) => (
                <div key={unit.id} className="border rounded p-3 bg-slate-50">
                  <Link
                    to={prisonId ? `/prison/${prisonId}/unit/${unit.id}/muster` : `/unit/${unit.id}/muster`}
                    className="font-semibold text-corrections-blue hover:underline block mb-2"
                    onClick={onClose}
                  >
                    {unit.name}
                  </Link>
                  <div className="text-sm space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-700">Total:</span>
                      <span className="font-medium">{total}</span>
                    </div>
                    {Object.entries(byLocation).sort().map(([loc, count]) => (
                      <div key={loc} className="flex items-center justify-between text-slate-600">
                        <span className="text-xs capitalize">{loc}</span>
                        <span className="text-xs font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
