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
import { addAuditEntry } from '../store'
import { openPrintWindow, buildHandoverPrintHtml } from '../printUtils'

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
  const prisoners = getPrisoners(id)
  const cells = [...new Set(prisoners.map((p) => p.cell))].sort()

  useEffect(() => {
    const date = today()
    const unitPrisoners = getPrisoners(id)
    const unitCells = [...new Set(unitPrisoners.map((p) => p.cell))].sort()
    setTasks(ensureDailyTasks(id, date))
    setMuster(getMusterConfirmation(id, date))
    setAlarms(ensureCellAlarms(id, unitCells))
    setSearches(getSearchTargets(id, date))
    setStripSearchState(getStripSearch(id, date))
    setHandoverState(getHandover(id, date))
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
    setMusterConfirmation(id, today(), { [key]: value })
    setMuster(getMusterConfirmation(id, today()))
    addAuditEntry({ action: `Muster ${key} confirmed`, detail: value ? 'Yes' : 'No', unitId: id })
  }

  const handleToggleAlarm = (alarmId: string) => {
    toggleCellAlarm(alarmId)
    setAlarms(getCellAlarms(id))
    addAuditEntry({ action: 'Cell alarm checked', unitId: id })
  }

  const handleGenerateSearches = () => {
    const generated = generateSearches(id, today(), cells)
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
        <Link to={prisonId ? `/prison/${prisonId}/unit/${id}/muster` : `/unit/${id}/muster`} className="btn-corrections">
          View / Edit Muster
        </Link>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Standing orders</label>
              <textarea
                className="w-full border border-slate-300 rounded-lg p-2 text-sm min-h-[80px]"
                value={handover.standingOrders ?? ''}
                onChange={(e) => saveHandover('standingOrders', e.target.value)}
                placeholder="Standing orders for this shift..."
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

        {/* Daily tasks */}
        <section className="card">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Daily tasks</div>
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
          <div className="p-4 flex flex-wrap gap-6">
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
      </div>
    </Layout>
  )
}
