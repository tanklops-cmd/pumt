import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import GlassLayout from '../components/GlassLayout'
import { getAllUnitsSummary, getUnitsSummaryForPrison, getControlHandover, setControlHandover, resetDailyTasksForDate, resetDailyTasksForPrison, getPrisoners, getAllPrisoners, unitsWithIncompleteTasksForPrison, unitsWithIncompleteTasksForAll, addAuditEntry } from '../store'
import { PRISONS } from '../constants'
import { recordAllUnits, recordPrisonUnits } from '../api'
import { subscribePageRecord } from '../ws'
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
  const [quickLookupQuery, setQuickLookupQuery] = useState('')
  const [quickLookupResults, setQuickLookupResults] = useState<Prisoner[]>([])
  const [recording, setRecording] = useState(false)
  const [recordResult, setRecordResult] = useState<{ triggeredBy: string; timestamp: string; successful: number; totalUnits: number } | null>(null)

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

  const saveHandoverField = (field: 'general' | 'visits' | 'other', value: string) => {
    const next = { ...(handover || {}), [field]: value }
    setHandover(next)
    setControlHandover(today(), { ...(field === 'general' ? { general: value } : {}), ...(field === 'visits' ? { visits: value } : {}), ...(field === 'other' ? { other: value } : {}) })
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

  // incomplete tasks list
  const [incompleteUnits, setIncompleteUnits] = useState<{ unitId: string; incomplete: number }[]>([])

  useEffect(() => {
    const d = today()
    setIncompleteUnits(prisonId ? unitsWithIncompleteTasksForPrison(prisonId, d) : unitsWithIncompleteTasksForAll(d))
  }, [summary, prisonId])

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

  // Handle Record All Units
  const handleRecordAllUnits = async () => {
    if (!prisonId) {
      // Global - record all units
      try {
        setRecording(true)
        const result = await recordAllUnits('manual')
        setRecordResult({
          triggeredBy: result.triggeredBy || 'manual',
          timestamp: result.timestamp,
          successful: result.successful,
          totalUnits: result.totalUnits,
        })
        // Refresh data after recording
        setSummary(getAllUnitsSummary())
      } catch (err) {
        console.error('Failed to record all units:', err)
        alert('Failed to record all units')
      } finally {
        setRecording(false)
      }
    } else {
      // Prison-specific - record all units for this prison
      try {
        setRecording(true)
        const result = await recordPrisonUnits(prisonId, 'manual')
        setRecordResult({
          triggeredBy: result.triggeredBy || 'manual',
          timestamp: result.timestamp,
          successful: result.successful,
          totalUnits: result.totalUnits,
        })
        // Refresh data after recording
        setSummary(getUnitsSummaryForPrison(prisonId))
      } catch (err) {
        console.error('Failed to record prison units:', err)
        alert('Failed to record prison units')
      } finally {
        setRecording(false)
      }
    }
  }

  // Subscribe to page record events for real-time updates
  useEffect(() => {
    const sub = subscribePageRecord((event) => {
      if (event.action === 'all_completed' || (event.action === 'prison_completed' && event.payload.prisonId === prisonId)) {
        setRecordResult({
          triggeredBy: event.payload.triggeredBy,
          timestamp: event.payload.timestamp,
          successful: event.payload.successful || 0,
          totalUnits: event.payload.totalUnits || 0,
        })
        // Refresh data
        if (prisonId) {
          setSummary(getUnitsSummaryForPrison(prisonId))
        } else {
          setSummary(getAllUnitsSummary())
        }
        setRecording(false)
      }
    })
    return () => sub.close()
  }, [prisonId])

  return (
<GlassLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}` : '/'} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← {prisonId ? 'Back to units' : 'Unit selection'}</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">{prison ? `${prison.name} — Control Hub` : 'Control Hub'}</h1>
          <p className="text-sm text-slate-600">{prison ? 'Prison-level overview, handover and task controls.' : 'Facility-wide overview, global handover and task controls.'}</p>
        </div>
        <div>
          <Link to={prisonId ? `/prison/${prisonId}/sco` : '/sco'} className="btn-outline">Open SCO Hub</Link>
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
                      <button type="button" onClick={handleResetTasks} className="btn-corrections mr-2">Reset for New Day</button>
                      <button 
                        type="button" 
                        onClick={handleRecordAllUnits} 
                        disabled={recording}
                        className="btn-corrections bg-green-600 hover:bg-green-700 disabled:opacity-50"
                      >
                        {recording ? 'Recording...' : 'Record All Units'}
                      </button>
                    </div>
                    
                    {/* Record Result Notification */}
                    {recordResult && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded p-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-medium text-green-800">
                            Recorded {recordResult.successful}/{recordResult.totalUnits} units
                          </span>
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                          Triggered by: {recordResult.triggeredBy} at {new Date(recordResult.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                    <div className="mt-4">
                      <div className="text-xs text-slate-500 mb-2">Units with incomplete daily tasks</div>
                      {incompleteUnits.length === 0 ? (
                        <div className="text-sm text-slate-500">All units have completed tasks.</div>
                      ) : (
                        <ul className="text-sm space-y-1">
                          {incompleteUnits.map((u) => (
                            <li key={u.unitId} className="flex items-center justify-between">
                              <div className="capitalize">{u.unitId}</div>
                              <div className="text-slate-600">{u.incomplete} incomplete</div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                      <div className="mt-4">
                        <div className="text-xs text-slate-500 mb-2">Quick person lookup</div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Name or ID"
                            value={quickLookupQuery}
                            onChange={(e) => setQuickLookupQuery(e.target.value)}
                            className="flex-1 border rounded px-2 py-1 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const q = quickLookupQuery.trim().toLowerCase()
                              if (!q) { setQuickLookupResults([]); return }
                              const all = getAllPrisoners()
                              const matches = all.filter((p) => (p.name ?? '').toLowerCase().includes(q) || (p.id ?? '').toLowerCase().includes(q))
                              setQuickLookupResults(matches.slice(0, 10))
                            }}
                            className="btn-outline text-sm"
                          >Find</button>
                        </div>
                        {quickLookupResults.length > 0 && (
                          <ul className="mt-2 text-sm space-y-1 max-h-36 overflow-y-auto">
                            {quickLookupResults.map((p) => (
                              <li key={p.id} className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{p.name || 'Unnamed'}</div>
                                  <div className="text-xs text-slate-500">{p.id} — {p.cell || '—'} — {p.unitId}</div>
                                </div>
                                <div>
                                  <Link to={prisonId ? `/prison/${prisonId}/unit/${p.unitId}` : `/unit/${p.unitId}`} className="text-corrections-blue hover:underline text-sm">Open</Link>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
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
</GlassLayout>
  )
}
