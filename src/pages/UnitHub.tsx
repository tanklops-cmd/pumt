import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../Layout'
import { UNITS, getUnitsForPrison } from '../constants'
import type { UnitId } from '../types'
import {
  getHandover,
  setHandover,
  ensureDailyTasks,
  toggleDailyTask,
  getMusterConfirmation,
  setMusterConfirmation,
  getCellAlarms,
  ensureCellAlarms,
  toggleCellAlarm,
  getSearchTargets,
  generateSearches,
  getStripSearch,
  setStripSearch,
  getPrisoners,
} from '../store'
import { getAuditEntries } from '../store'
import { addAuditEntry } from '../store'
import { openPrintWindow, buildHandoverPrintHtml } from '../printUtils'
import { useDataSync } from '../sync'
import { fetchUnitConfig } from '../api'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function UnitHub() {
  const { prisonId, unitId } = useParams<{ prisonId?: string; unitId?: string }>()
  const id = (unitId ?? 'north') as UnitId
  
  // find unit in prison-specific units if prisonId supplied, otherwise fall back to legacy UNITS
  const unitsToSearch = prisonId ? getUnitsForPrison(prisonId) : UNITS
  const unit = unitsToSearch.find((u) => u.id === id) ?? (UNITS.find((u) => u.id === id) ?? unitsToSearch[0])

  const [handover, setHandoverState] = useState(getHandover(id, today()))
  const [tasks, setTasks] = useState(ensureDailyTasks(id, today()))
  const [muster, setMuster] = useState(getMusterConfirmation(id, today()))
  const [alarms, setAlarms] = useState(getCellAlarms(id))
  const [searches, setSearches] = useState(getSearchTargets(id, today()))
  const [stripSearch, setStripSearchState] = useState(getStripSearch(id, today()))
  const [musterModal, setMusterModal] = useState<{ key: 'unlock' | 'random' | 'lockup' } | null>(null)
  const [selectedStaff1, setSelectedStaff1] = useState('')
  const [selectedStaff2, setSelectedStaff2] = useState('')
  const [totalMustered, setTotalMustered] = useState('')
  const [unitConfig, setUnitConfig] = useState<{ cells: string[]; facilities: string[] } | null>(null)
  const [configError, setConfigError] = useState('')
  const prisoners = getPrisoners(id)
  const cells = [...new Set(prisoners.map((p) => p.cell))].sort()

  // Load UnitConfig on mount
  useEffect(() => {
    fetchUnitConfig(id)
      .then(setUnitConfig)
      .catch((e) => {
        console.error('Failed to load unit config:', e)
        setConfigError('No config found')
      })
  }, [id])

  // Listen for storage events (from other browsers)
  useEffect(() => {
    const handleStorage = () => {
      const unitPrisoners = getPrisoners(id)
      const unitCells = [...new Set(unitPrisoners.map((p) => p.cell))].sort()
      setTasks(ensureDailyTasks(id, today()))
      setMuster(getMusterConfirmation(id, today()))
      setAlarms(ensureCellAlarms(id, unitCells))
      setSearches(getSearchTargets(id, today()))
      setStripSearchState(getStripSearch(id, today()))
      setHandoverState(getHandover(id, today()))
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [id, cells.join(',')])

  const saveHandover = (field: keyof typeof handover, value: string) => {
    const next = { ...handover, [field]: value }
    setHandoverState(next)
    setHandover(id, today(), next)
    addAuditEntry({ action: 'Handover updated', detail: field, unitId: id })
  }

  const handleToggleTask = (taskId: string) => {
    toggleDailyTask(taskId)
    setTasks(ensureDailyTasks(id, today()))
    addAuditEntry({ action: 'Daily task toggled', unitId: id })
  }

  const handleMusterConfirm = (key: 'unlock' | 'random' | 'lockup', value: boolean) => {
    if (value) {
      // Check if staff names are entered
      const availableStaff = [
        { id: 'sco', name: handover.scoName, label: 'SCO' },
        { id: 'co1', name: handover.co1Name, label: 'CO1' },
        { id: 'co2', name: handover.co2Name, label: 'CO2' },
        { id: 'co3', name: handover.co3Name, label: 'CO3' },
      ].filter(s => s.name && s.name.trim())
      
      if (availableStaff.length < 2) {
        alert('Please enter at least 2 staff names in Staff on duty section first')
        return
      }
      
      // Open modal to collect details
      setMusterModal({ key })
      setSelectedStaff1('')
      setSelectedStaff2('')
      setTotalMustered('')
    } else {
      setMusterConfirmation(id, today(), { [key]: value })
      addAuditEntry({ action: `Muster ${key} confirmed`, detail: 'No', unitId: id })
      setMuster(getMusterConfirmation(id, today()))
    }
  }

  const handleMusterSubmit = () => {
    if (!musterModal) return
    
    const total = parseInt(totalMustered, 10)
    if (isNaN(total) || total < 0) {
      alert('Please enter a valid number')
      return
    }
    
    const staff1 = availableStaffOptions.find(s => s.id === selectedStaff1)
    const staff2 = availableStaffOptions.find(s => s.id === selectedStaff2)
    
    if (!staff1 || !staff2) {
      alert('Please select 2 staff members')
      return
    }
    
    const staffStr = `${staff1.name}, ${staff2.name}`
    setMusterConfirmation(id, today(), { 
      [musterModal.key]: true,
      totalMustered: total,
      musterdBy: staffStr,
    })
    addAuditEntry({ action: `Muster ${musterModal.key} confirmed`, detail: `${total} prisoners by ${staffStr}`, unitId: id })
    setMuster(getMusterConfirmation(id, today()))
    setMusterModal(null)
  }

  const availableStaffOptions = [
    { id: 'sco', name: handover.scoName || '', label: 'SCO' },
    { id: 'co1', name: handover.co1Name || '', label: 'CO1' },
    { id: 'co2', name: handover.co2Name || '', label: 'CO2' },
    { id: 'co3', name: handover.co3Name || '', label: 'CO3' },
  ].filter(s => s.name && s.name.trim())

  const handleToggleAlarm = (alarmId: string) => {
    toggleCellAlarm(alarmId)
    setAlarms(getCellAlarms(id))
    addAuditEntry({ action: 'Cell alarm checked', unitId: id })
  }

  const handleGenerateSearches = () => {
    // Check if UnitConfig exists
    if (unitConfig && (unitConfig.cells.length === 0 || unitConfig.facilities.length === 0)) {
      alert('This unit has no cells or facilities configured. Please configure them in Unit Config first.')
      return
    }
    
    // Use config cells/facilities if available, otherwise fall back to prisoner cells
    const searchCells = (unitConfig && unitConfig.cells.length > 0) ? unitConfig.cells : cells
    const searchFacilities = (unitConfig && unitConfig.facilities.length > 0) ? unitConfig.facilities : undefined
    
    const generated = generateSearches(id, today(), searchCells, searchFacilities)
    setSearches(generated)
    addAuditEntry({ action: 'Daily searches generated', detail: `${generated.length} targets (3 cells, 2 facilities)`, unitId: id })
  }

  const handleStripSearchPerformed = (performed: boolean) => {
    const next = { performed, prisonerIds: performed ? (stripSearch?.prisonerIds ?? []) : [] }
    setStripSearch(id, today(), next)
    setStripSearchState(getStripSearch(id, today()))
    addAuditEntry({ action: 'Strip search updated', detail: performed ? 'Yes' : 'No', unitId: id })
  }

  const handleStripSearchPrisonerToggle = (prisonerId: string, selected: boolean) => {
    const current = stripSearch?.prisonerIds ?? []
    const next = selected ? [...current, prisonerId] : current.filter((id) => id !== prisonerId)
    setStripSearch(id, today(), { performed: true, prisonerIds: next })
    setStripSearchState(getStripSearch(id, today()))
    addAuditEntry({ action: 'Strip search prisoner', detail: prisonerId, unitId: id })
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}` : '/'} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← All units</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">{unit.name} Hub</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={prisonId ? `/prison/${prisonId}/unit/${id}/maintenance` : `/unit/${id}/maintenance`} className="btn-outline">
            Unit Maintenance
          </Link>
          <Link to={prisonId ? `/prison/${prisonId}/unit/${id}/pco` : `/unit/${id}/pco`} className="btn-outline">
            PCO Hub
          </Link>
          <Link to={prisonId ? `/prison/${prisonId}/unit/${id}/muster` : `/unit/${id}/muster`} className="btn-corrections">
            View / Edit Muster
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                const { capturePageState } = await import('../usePageCapture');
                const result = await capturePageState({ pageName: 'UnitHub', unitId: id });
                if (result) {
                  alert('Page state saved to audit trail!');
                } else {
                  alert('Failed to save page state');
                }
              } catch (err) {
                alert('Failed to save page state');
              }
            }}
            className="btn-outline"
          >
            Record Page
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Handover */}
        <section className="card">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold flex items-center justify-between">
            <span>Handover information</span>
            <button
              type="button"
              onClick={() => {
                const html = buildHandoverPrintHtml({
                  unitName: unit.name,
                  date: today(),
                  standingOrders: handover.standingOrders,
                  medicalNotes: handover.medicalNotes,
                  peopleOffPrivileges: handover.peopleOffPrivileges,
                  confinement: handover.confinement,
                  scoName: handover.scoName,
                  co1Name: handover.co1Name,
                  co2Name: handover.co2Name,
                  co3Name: handover.co3Name,
                })
                openPrintWindow(html, `${unit.name} Handover`)
              }}
              className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm font-medium"
            >
              Print
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">General Notes</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg p-2 text-sm min-h-[80px]"
                value={handover.standingOrders ?? ''}
                onChange={(e) => saveHandover('standingOrders', e.target.value)}
                placeholder="General notes for this shift..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Medical notes</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg p-2 text-sm min-h-[80px]"
                value={handover.medicalNotes ?? ''}
                onChange={(e) => saveHandover('medicalNotes', e.target.value)}
                placeholder="Medical notes / alerts..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">People off privileges</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg p-2 text-sm min-h-[60px]"
                value={handover.peopleOffPrivileges ?? ''}
                onChange={(e) => saveHandover('peopleOffPrivileges', e.target.value)}
                placeholder="Names / numbers off privileges..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confinement</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg p-2 text-sm min-h-[60px]"
                value={handover.confinement ?? ''}
                onChange={(e) => saveHandover('confinement', e.target.value)}
                placeholder="Confinement details..."
              />
            </div>
          </div>
        </section>

        {/* Unit Muster Total */}
        <section className="card">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Unit Muster Total</div>
          <div className="p-4">
            <div className="text-4xl font-bold text-corrections-charcoal">{prisoners.length}</div>
            <p className="text-sm text-slate-600 mt-1">prisoners in unit</p>
            
            {/* Unit Staff on Duty */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <p className="text-sm font-medium text-slate-700 mb-3">Staff on duty</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-600 mb-1">SCO</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    value={handover.scoName ?? ''}
                    onChange={(e) => saveHandover('scoName', e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">CO1</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    value={handover.co1Name ?? ''}
                    onChange={(e) => saveHandover('co1Name', e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">CO2</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    value={handover.co2Name ?? ''}
                    onChange={(e) => saveHandover('co2Name', e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-600 mb-1">CO3</label>
                  <input
                    type="text"
                    className="w-full border border-slate-300 rounded px-2 py-1 text-sm"
                    value={handover.co3Name ?? ''}
                    onChange={(e) => saveHandover('co3Name', e.target.value)}
                    placeholder="Name"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Daily tasks */}
        <section className="card">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">SCO Checklist</div>
          <div className="p-4">
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id={task.id}
                    checked={task.done}
                    onChange={() => handleToggleTask(task.id)}
                    className="w-5 h-5 rounded border-corrections-blue text-corrections-blue"
                  />
                  <label htmlFor={task.id} className="text-sm font-medium text-slate-700 cursor-pointer">
                    {task.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Muster confirmation */}
        <section className="card">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Muster confirmation</div>
          <div className="p-4">
            <div className="flex flex-wrap gap-6 mb-3">
              {(['unlock', 'random', 'lockup'] as const).map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={muster?.[key] ?? false}
                    onChange={(e) => handleMusterConfirm(key, e.target.checked)}
                    className="w-5 h-5 rounded border-corrections-blue text-corrections-blue"
                  />
                  <span className="font-medium capitalize text-slate-700">{key}</span>
                </label>
              ))}
            </div>
            {/* Display muster details */}
            {(muster?.totalMustered || muster?.musterdBy) && (
              <div className="mt-3 pt-3 border-t border-slate-200 text-sm text-slate-600">
                <p><strong>Total Mustered:</strong> {muster.totalMustered}</p>
                <p><strong>By:</strong> {muster.musterdBy || '—'}</p>
              </div>
            )}
          </div>
        </section>

        {/* Daily Cell and Facilities Check — 5 searches */}
        <section className="card">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">
            Daily Cell and Facilities Check
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-500 mb-3">3 random cells + 2 facilities = 5 searches</p>
            {searches.length === 0 ? (
              <p className="text-sm text-slate-600 mb-3">Generate today’s random searches.</p>
            ) : (
              <ul className="space-y-2 mb-3">
                {searches.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-6 h-6 rounded bg-corrections-blue-pale text-corrections-blue font-medium flex items-center justify-center text-xs">
                      {s.type === 'cell' ? 'C' : 'F'}
                    </span>
                    <span className="font-medium">{s.value}</span>
                    <span className="text-slate-500">({s.type})</span>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={handleGenerateSearches}
              className="btn-outline text-sm"
            >
              {searches.length ? 'Regenerate searches' : 'Generate searches'}
            </button>

            {/* Strip searches — links to prisoners */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={stripSearch?.performed ?? false}
                  onChange={(e) => handleStripSearchPerformed(e.target.checked)}
                  className="w-5 h-5 rounded border-corrections-blue text-corrections-blue"
                />
                <span className="font-medium text-slate-700">Strip search performed</span>
              </label>
              {(stripSearch?.performed ?? false) && (
                <div className="mt-2 pl-7">
                  <p className="text-xs text-slate-600 mb-2">Select prisoner(s) who were strip searched:</p>
                  {prisoners.length === 0 ? (
                    <p className="text-sm text-slate-500">No prisoners in muster. Add prisoners in Muster first.</p>
                  ) : (
                    <ul className="space-y-1.5 max-h-40 overflow-y-auto">
                      {prisoners.map((p) => {
                        const selected = (stripSearch?.prisonerIds ?? []).includes(p.id)
                        return (
                          <li key={p.id}>
                            <label className="flex items-center gap-2 cursor-pointer text-sm">
                              <input
                                type="checkbox"
                                checked={selected}
                                onChange={(e) => handleStripSearchPrisonerToggle(p.id, e.target.checked)}
                                className="rounded border-corrections-blue text-corrections-blue"
                              />
                              <span className="font-medium">{p.name || 'Unnamed'}</span>
                              <span className="text-slate-500 font-mono">({p.cell || '—'})</span>
                            </label>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Weekly cell alarms */}
        <section className="card lg:col-span-2">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Weekly cell alarms</div>
          <div className="p-4">
            {alarms.length === 0 ? (
              <p className="text-sm text-slate-600">No cells in muster. Add prisoners in Muster to see cell alarms.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {alarms.map((a) => (
                  <label
                    key={a.id}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-sm ${
                      a.checked ? 'bg-green-50 border-green-300 text-green-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={a.checked}
                      onChange={() => handleToggleAlarm(a.id)}
                      className="sr-only"
                    />
                    <span className="font-mono font-medium">{a.cell}</span>
                    <span>{a.checked ? '✓' : '—'}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </section>
        {/* Movement log (unit) — placed under weekly cell alarms */}
        <section className="card lg:col-span-2">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Movement log (unit)</div>
          <div className="p-4">
            <p className="text-xs text-slate-500 mb-3">Recent movement and location updates for this unit.</p>
            <UnitMovementList unitId={id} />
          </div>
        </section>
      </div>

      {/* Muster confirmation modal */}
      {musterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="font-semibold text-lg mb-3 capitalize">Confirm {musterModal.key} muster</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Total mustered</label>
                <input
                  type="number"
                  min="0"
                  value={totalMustered}
                  onChange={(e) => setTotalMustered(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  placeholder="Enter number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Staff 1</label>
                <select
                  value={selectedStaff1}
                  onChange={(e) => setSelectedStaff1(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select staff...</option>
                  {availableStaffOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}: {s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Staff 2</label>
                <select
                  value={selectedStaff2}
                  onChange={(e) => setSelectedStaff2(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select staff...</option>
                  {availableStaffOptions.map((s) => (
                    <option key={s.id} value={s.id}>{s.label}: {s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-6">
              <button
                type="button"
                onClick={() => setMusterModal(null)}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleMusterSubmit}
                className="btn-corrections"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function UnitMovementList({ unitId }: { unitId: string }) {
  const [entries, setEntries] = useState(() => getAuditEntries().filter((e) => e.unitId === unitId && isMovementAction(e.action)))

  useEffect(() => {
    let sub: { close: () => void } | null = null
    const refreshFromStorage = () => setEntries(getAuditEntries().filter((e) => e.unitId === unitId && isMovementAction(e.action)))
    window.addEventListener('storage', refreshFromStorage)

    ;(async () => {
      try {
        const { subscribeAudit } = await import('../ws')
        sub = subscribeAudit((entry) => {
          if (entry.unitId === unitId && isMovementAction(entry.action)) {
            setEntries((prev) => [entry, ...prev].slice(0, 200))
          }
        }, () => {})
      } catch (e) {
        // no ws available, rely on storage events
      }
    })()

    return () => {
      window.removeEventListener('storage', refreshFromStorage)
      sub?.close()
    }
  }, [unitId])

  return (
    <div>
      {entries.length === 0 ? (
        <div className="text-sm text-slate-500">No recent movement entries for this unit.</div>
      ) : (
        <ul className="text-sm space-y-2 max-h-48 overflow-y-auto">
          {entries.map((e) => (
            <li key={e.id} className="flex items-start justify-between border-b border-slate-100 pb-2">
              <div className="flex-1">
                <div className="font-medium">{e.action}</div>
                {e.prisonerName && <div className="text-xs font-medium text-corrections-blue">{e.prisonerName}</div>}
                {e.prisonerLocation && <div className="text-xs text-slate-600 capitalize">→ {e.prisonerLocation}</div>}
                {e.detail && <div className="text-xs text-slate-500">{e.detail}</div>}
              </div>
              <div className="text-xs text-slate-400 whitespace-nowrap ml-2">{new Date(e.timestamp).toLocaleTimeString()}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function isMovementAction(a?: string) {
  if (!a) return false
  const s = a.toLowerCase()
  return s.includes('move') || s.includes('moved') || s.includes('location')
}
