import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../Layout'
import { getAllUnitsSummary, getUnitsSummaryForPrison, getControlHandover, setControlHandover, resetDailyTasksForDate, resetDailyTasksForPrison, getPrisoners } from '../store'
import { PRISONS } from '../constants'
import type { Prisoner } from '../types'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function ControlHub() {
  const { prisonId } = useParams<{ prisonId?: string }>()
  const prison = prisonId ? PRISONS.find((p) => p.id === prisonId) ?? { id: prisonId, name: prisonId } : null
  const [summary, setSummary] = useState(() => (prisonId ? getUnitsSummaryForPrison(prisonId) : getAllUnitsSummary()))
  const [handover, setHandover] = useState(() => getControlHandover(today()))
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [prisonersByUnit, setPrisonersByUnit] = useState<Record<string, Prisoner[]>>({})

  const LOCATION_LABELS: Record<string, string> = {
    CELL: 'Cell',
    YARD: 'Yard',
    MEDICAL: 'Medical',
    COURT: 'Court',
    VISITS: 'Visits',
    PROGRAMMES: 'Programmes',
    WORK: 'Work',
    OTHER: 'Other',
  }

  useEffect(() => {
    setSummary(prisonId ? getUnitsSummaryForPrison(prisonId) : getAllUnitsSummary())
    setHandover(getControlHandover(today()))
    const onStorage = () => {
      setSummary(prisonId ? getUnitsSummaryForPrison(prisonId) : getAllUnitsSummary())
      setHandover(getControlHandover(today()))
      // refresh expanded unit prisoners
      setPrisonersByUnit((prev) => {
        const next = { ...prev }
        Object.keys(expanded).forEach((uid) => {
          if (expanded[uid]) next[uid] = getPrisoners(uid as any)
        })
        return next
      })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const saveHandoverField = (field: keyof typeof handover, value: string) => {
    const next = { ...(handover || {}), [field]: value }
    setHandover(next)
    setControlHandover(today(), { general: next.general, visits: next.visits, other: next.other })
  }

  const handleResetTasks = () => {
    const ok = window.confirm('Reset for new day? This will reset daily checklists, reset prisoner locations to CELL, and clear meal checkboxes. This will NOT modify handovers.')
    if (!ok) return
    if (prisonId) {
      resetDailyTasksForPrison(prisonId, today())
      setSummary(getUnitsSummaryForPrison(prisonId))
    } else {
      resetDailyTasksForDate(today())
      setSummary(getAllUnitsSummary())
    }
    alert('Reset for new day completed.')
  }

  const toggleExpand = (unitId: string) => {
    setExpanded((s) => {
      const next = { ...s, [unitId]: !s[unitId] }
      if (!s[unitId]) {
        // now expanding: load prisoners
        setPrisonersByUnit((p) => ({ ...p, [unitId]: getPrisoners(unitId as any) }))
      }
      return next
    })
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}` : '/'} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← {prisonId ? 'Back to units' : 'Unit selection'}</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">{prison ? `${prison.name} — Control Hub` : 'Control Hub'}</h1>
          <p className="text-sm text-slate-600">{prison ? 'Prison-level overview, handover and task controls.' : 'Facility-wide overview, global handover and task controls.'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="card lg:col-span-1">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Muster summary</div>
          <div className="p-4">
            <div className="text-xs text-slate-500">Prison muster total</div>
            <div className="text-2xl font-bold mb-2">{summary.total}</div>
            <div className="text-sm text-slate-600 mb-2">Offsite: {summary.offSite}</div>
            <div className="text-xs text-slate-500">Units</div>
            <ul className="mt-2 space-y-2">
              {summary.summaries.map((s: any) => (
                <li key={s.unitId} className="border rounded p-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium capitalize">{s.unitId}</div>
                    <div className="text-sm text-slate-600">{s.total} ({s.onSite} on site)</div>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <button type="button" onClick={() => toggleExpand(s.unitId)} className="text-sm text-corrections-blue hover:underline">{expanded[s.unitId] ? 'Hide' : 'Show'} prisoners</button>
                    <Link to={prisonId ? `/prison/${prisonId}/unit/${s.unitId}` : `/unit/${s.unitId}`} className="text-sm text-slate-700 hover:underline">Open unit hub</Link>
                    <Link to={prisonId ? `/prison/${prisonId}/unit/${s.unitId}/muster` : `/unit/${s.unitId}/muster`} className="text-sm text-slate-700 hover:underline">View muster</Link>
                  </div>
                  {expanded[s.unitId] && (
                    <div className="mt-3 border-t pt-3">
                      <div className="text-xs text-slate-500 mb-2">Prisoners</div>
                      <ul className="max-h-40 overflow-y-auto text-sm space-y-1">
                        {(prisonersByUnit[s.unitId] ?? []).map((p) => (
                          <li key={p.id} className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{p.name || 'Unnamed'}</div>
                              <div className="text-xs text-slate-500">{p.cell || '—'} — {LOCATION_LABELS[p.location] ?? p.location}</div>
                            </div>
                            <div className="text-sm">
                              <Link to={`/unit/${s.unitId}`} className="text-corrections-blue hover:underline">Open unit</Link>
                            </div>
                          </li>
                        ))}
                        {(prisonersByUnit[s.unitId] ?? []).length === 0 && <li className="text-sm text-slate-500">No prisoners recorded</li>}
                      </ul>
                    </div>
                  )}
                </li>
              ))}
            </ul>
                    <div className="mt-4">
                      <button type="button" onClick={() => setSummary(prisonId ? getUnitsSummaryForPrison(prisonId) : getAllUnitsSummary())} className="btn-outline mr-2">Refresh</button>
                      <button type="button" onClick={handleResetTasks} className="btn-corrections">Reset for New Day</button>
                    </div>
          </div>
        </section>

        <section className="card lg:col-span-2">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Control handover notes</div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">General</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg p-2 text-sm min-h-[80px]"
                value={handover?.general ?? ''}
                onChange={(e) => saveHandoverField('general', e.target.value)}
                placeholder="General notes for the facility..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Visits</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg p-2 text-sm min-h-[60px]"
                value={handover?.visits ?? ''}
                onChange={(e) => saveHandoverField('visits', e.target.value)}
                placeholder="Notes about visits..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Other</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg p-2 text-sm min-h-[60px]"
                value={handover?.other ?? ''}
                onChange={(e) => saveHandoverField('other', e.target.value)}
                placeholder="Other handover notes..."
              />
            </div>
          </div>
        </section>
      </div>
    </Layout>
  )
}
