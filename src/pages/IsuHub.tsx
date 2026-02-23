import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import GlassLayout from '../components/GlassLayout'
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
  getPrisonersPendingMoveNotification,
  markPrisonerMoveNotified,
  getSacraReminders,
  dismissSacraReminder,
  dismissAllSacraReminders,
} from '../store'
import { getAuditEntries } from '../store'
import { addAuditEntry } from '../store'
import { openPrintWindow, buildHandoverPrintHtml } from '../printUtils'
import { useDataSync } from '../sync'
import { fetchUnitConfig } from '../api'

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function IsuHub() {
  const { prisonId, unitId } = useParams<{ prisonId?: string; unitId?: string }>()
  // For legacy route (/isu), use 'invercargill-isu' as the unitId
  // For prison routes, use the unitId from params or construct ISU id from prisonId
  const id = unitId 
    ? (unitId as UnitId)
    : prisonId 
      ? `${prisonId}-isu` as UnitId
      : 'invercargill-isu' as UnitId
  
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
  const [pendingMoves, setPendingMoves] = useState<any[]>([])
  const [sacraReminders, setSacraReminders] = useState<any[]>([])
  const [prisoners, setPrisoners] = useState(() => getPrisoners(id))
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

  // Load pending moves
  useEffect(() => {
    setPendingMoves(getPrisonersPendingMoveNotification(id))
    const handleStorage = () => setPendingMoves(getPrisonersPendingMoveNotification(id))
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [id])

  // Load SACRA reminders
  useEffect(() => {
    setSacraReminders(getSacraReminders(id))
    const handleStorage = () => setSacraReminders(getSacraReminders(id))
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [id])

  const handleDismissMove = (prisonerId: string) => {
    markPrisonerMoveNotified(prisonerId, id)
    setPendingMoves(getPrisonersPendingMoveNotification(id))
  }

  const handleDismissSacra = (reminderId: string) => {
    dismissSacraReminder(reminderId)
    setSacraReminders(getSacraReminders(id))
  }

  const handleDismissAllSacra = () => {
    dismissAllSacraReminders(id)
    setSacraReminders(getSacraReminders(id))
  }

  // Listen for sync updates (from other browsers via WebSocket or same-browser localStorage)
  useEffect(() => {
    const handleSync = () => {
      const unitPrisoners = getPrisoners(id)
      const unitCells = [...new Set(unitPrisoners.map((p) => p.cell))].sort()
      setPrisoners(unitPrisoners)
      setTasks(ensureDailyTasks(id, today()))
      setMuster(getMusterConfirmation(id, today()))
      setAlarms(ensureCellAlarms(id, unitCells))
      setSearches(getSearchTargets(id, today()))
      setStripSearchState(getStripSearch(id, today()))
      setHandoverState(getHandover(id, today()))
    }
    // Listen for WebSocket sync events
    window.addEventListener('data-synced', handleSync)
    // Listen for storage events (same-browser tabs)
    window.addEventListener('storage', handleSync)
    return () => {
      window.removeEventListener('data-synced', handleSync)
      window.removeEventListener('storage', handleSync)
    }
  }, [id])

  const saveHandover = (field: keyof typeof handover, value: string) => {
    const next = { ...handover, [field]: value }
    setHandoverState(next)
    setHandover(id, today(), next)
    addAuditEntry({ action: 'ISU Handover updated', detail: field, unitId: id })
  }

  const handleToggleTask = (taskId: string) => {
    toggleDailyTask(taskId)
    setTasks(ensureDailyTasks(id, today()))
    addAuditEntry({ action: 'ISU Daily task toggled', unitId: id })
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
      addAuditEntry({ action: `ISU Muster ${key} confirmed`, detail: 'No', unitId: id })
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
    addAuditEntry({ action: `ISU Muster ${musterModal.key} confirmed`, detail: `${total} prisoners by ${staffStr}`, unitId: id })
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
    addAuditEntry({ action: 'ISU Cell alarm checked', unitId: id })
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
    addAuditEntry({ action: 'ISU Daily searches generated', detail: `${generated.length} targets (3 cells, 2 facilities)`, unitId: id })
  }

  const handleStripSearchPerformed = (performed: boolean) => {
    const next = { performed, prisonerIds: performed ? (stripSearch?.prisonerIds ?? []) : [] }
    setStripSearch(id, today(), next)
    setStripSearchState(getStripSearch(id, today()))
    addAuditEntry({ action: 'ISU Strip search updated', detail: performed ? 'Yes' : 'No', unitId: id })
  }

  const handleStripSearchPrisonerToggle = (prisonerId: string, selected: boolean) => {
    const current = stripSearch?.prisonerIds ?? []
    const next = selected ? [...current, prisonerId] : current.filter((id) => id !== prisonerId)
    setStripSearch(id, today(), { performed: true, prisonerIds: next })
    setStripSearchState(getStripSearch(id, today()))
    addAuditEntry({ action: 'ISU Strip search prisoner', detail: prisonerId, unitId: id })
  }

  return (
<GlassLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}` : '/'} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← All units</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">ISU Hub</h1>
          <p className="text-sm text-slate-600">Intensive Support Unit</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={prisonId ? `/prison/${prisonId}/isu/observations` : `/isu/observations`} className="btn-outline">
            Observations
          </Link>
          <Link to={prisonId ? `/prison/${prisonId}/unit/${id}/maintenance` : `/unit/${id}/maintenance`} className="btn-outline">
            Unit Maintenance
          </Link>
          <Link to={prisonId ? `/prison/${prisonId}/isu/pco` : `/unit/${id}/pco`} className="btn-outline">
            Principal Corrections Officer Hub
          </Link>
          <Link to={prisonId ? `/prison/${prisonId}/unit/${id}/muster` : `/unit/${id}/muster`} className="btn-corrections">
            View / Edit Muster
          </Link>
          <button
            type="button"
            onClick={async () => {
              try {
                const { capturePageState } = await import('../usePageCapture');
                const result = await capturePageState({ pageName: 'IsuHub', unitId: id });
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
            <span>ISU Handover information</span>
            <button
              type="button"
              onClick={() => {
                const html = buildHandoverPrintHtml({
                  unitName: 'ISU',
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
                openPrintWindow(html, `ISU Handover`)
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

        {/* ISU Muster Total */}
        <section className="card">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">ISU Muster Total</div>
          <div className="p-4">
            <div className="text-4xl font-bold text-corrections-charcoal">{prisoners.length}</div>
            <p className="text-sm text-slate-600 mt-1">prisoners in ISU</p>
            
            {/* Category Breakdown */}
            {(() => {
              const categories: Record<string, { label: string; count: number; color: string }> = {}
              prisoners.forEach((p) => {
                if (p.category) {
                  const cat = p.category
                  if (!categories[cat]) {
                    categories[cat] = { label: cat, count: 0, color: cat === 'RMD/ACC' ? 'text-red-600' : cat === 'RMD/CONV' ? 'text-green-600' : 'text-slate-600' }
                  }
                  categories[cat].count++
                }
              })
              const catEntries = Object.entries(categories).filter(([, v]) => v.count > 0)
              if (catEntries.length === 0) return null
              return (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-xs text-slate-500 mb-2">Categories:</p>
                  <div className="flex flex-wrap gap-2">
                    {catEntries.map(([key, v]) => (
                      <span key={key} className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${v.color} bg-slate-100`}>
                        {v.label}: {v.count}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })()}
            
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
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">ISU SCO Checklist</div>
          <div className="p-4">
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li 
                  key={task.id} 
                  className={`flex items-center gap-2 px-2 py-1 rounded border transition-colors ${
                    task.done 
                      ? 'bg-green-100 border-green-300 text-green-800' 
                      : 'bg-red-50 border-red-200 text-red-800'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={task.id}
                    checked={task.done}
                    onChange={() => handleToggleTask(task.id)}
                    className="w-5 h-5 rounded border-corrections-blue text-corrections-blue"
                  />
                  <label htmlFor={task.id} className="text-sm font-medium cursor-pointer flex-1">
                    {task.label}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Muster confirmation */}
        <section className="card">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">ISU Muster confirmation</div>
          <div className="p-4">
            <div className="flex flex-wrap gap-3 mb-3">
              {(['unlock', 'random', 'lockup'] as const).map((key) => {
                const isChecked = muster?.[key] ?? false
                return (
                  <label 
                    key={key} 
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 cursor-pointer transition-colors ${
                      isChecked 
                        ? 'bg-green-50 border-green-300 text-green-800' 
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleMusterConfirm(key, e.target.checked)}
                      className="w-5 h-5 rounded border-corrections-blue text-corrections-blue"
                    />
                    <span className="font-medium capitalize">{key}</span>
                    <span className={`text-xs font-medium ${isChecked ? 'text-green-600' : 'text-red-500'}`}>
                      {isChecked ? '✓ Done' : '○ Pending'}
                    </span>
                  </label>
                )
              })}
            </div>
            {/* Pending Move Notifications */}
            {pendingMoves.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                      <h4 className="font-semibold text-purple-800 text-sm">Prisoners Transferred In</h4>
                    </div>
                    <button type="button" onClick={() => pendingMoves.forEach(p => handleDismissMove(p.id))} className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700">Acknowledge All</button>
                  </div>
                  <ul className="space-y-2">
                    {pendingMoves.map((p) => (
                      <li key={p.id} className="flex items-center justify-between bg-white p-2 rounded border border-purple-200">
                        <div>
                          <div className="text-sm font-medium text-purple-900">{p.name || 'Unnamed'}</div>
                          <div className="text-xs text-purple-700">Cell: {p.cell || '—'}</div>
                        </div>
                        <div className="flex gap-1">
                          <Link
                            to={`/unit/${id}/muster?select=${p.id}&induction=true`}
                            className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                          >
                            Induction
                          </Link>
                          <button type="button" onClick={() => handleDismissMove(p.id)} className="text-xs bg-purple-600 text-white px-2 py-1 rounded hover:bg-purple-700">Acknowledge</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* SACRA Review Reminders - Not dismissable for 3 days */}
            {sacraReminders.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-200">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h4 className="font-semibold text-amber-800 text-sm">Review SACRA - Prisoners</h4>
                  </div>
                  <p className="text-xs text-amber-700 mb-2">These reminders cannot be dismissed for 3 days.</p>
                  <ul className="space-y-2">
                    {sacraReminders.map((r) => {
                      const createdDate = new Date(r.createdAt)
                      const threeDaysLater = new Date(createdDate)
                      threeDaysLater.setDate(threeDaysLater.getDate() + 3)
                      const now = new Date()
                      const diffTime = threeDaysLater.getTime() - now.getTime()
                      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                      const dueText = daysRemaining <= 0 ? 'Due today' : daysRemaining === 1 ? 'Due tomorrow' : `Due in ${daysRemaining} days`
                      return (
                        <li key={r.id} className="bg-white p-2 rounded border border-amber-200">
                          <div className="text-sm font-medium text-amber-900">{r.prisoner1Name} & {r.prisoner2Name}</div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs text-amber-700">Cell: {r.cell}</div>
                            <div className="text-xs font-medium text-amber-800">{dueText}</div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            )}

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
            ISU Daily Cell and Facilities Check
          </div>
          <div className="p-4">
            <p className="text-xs text-slate-500 mb-3">3 random cells + 2 facilities = 5 searches</p>
            {searches.length === 0 ? (
              <p className="text-sm text-slate-600 mb-3">Generate today's random searches.</p>
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
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">ISU Cell alarms</div>
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
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">ISU Movement log</div>
          <div className="p-4">
            <p className="text-xs text-slate-500 mb-3">Recent movement and location updates for ISU.</p>
            <IsuMovementList unitId={id} />
          </div>
        </section>
      </div>

      {/* Muster confirmation modal */}
      {musterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="font-semibold text-lg mb-3 capitalize">Confirm ISU {musterModal.key} muster</h3>
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
</GlassLayout>
  )
}

function IsuMovementList({ unitId }: { unitId: string }) {
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
        <div className="text-sm text-slate-500">No recent movement entries for ISU.</div>
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
  return s.includes('move') || s.includes('moved') || s.includes('location') || s.includes('cell')
}
