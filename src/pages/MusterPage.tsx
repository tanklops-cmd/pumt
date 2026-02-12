import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../Layout'
import { UNITS, getUnitsForPrison, LOCATION_OPTIONS, JOB_OPTIONS, SECURITY_OPTIONS, JOB_MANUAL_ENTRY, JOB_FIXED_VALUES } from '../constants'
import type { UnitId } from '../types'
import type { Prisoner, SecurityClassification, LocationCode } from '../types'
import {
  getPrisoners,
  savePrisoner,
  deletePrisoner,
  movePrisonerToUnit,
  addAuditEntry,
} from '../store'
import { openPrintPreviewWindow, buildMusterPrintHtml, getOutOfUnitHours } from '../printUtils'

// Coerce legacy string values to boolean for NTDB/OPs/CCs
function isNtdbActive(p: Prisoner): boolean {
  if (p.ntdb === true) return true
  const maybe = (p as any).ntdb
  if (typeof maybe === 'string' && (maybe.toLowerCase() === 'yes' || maybe === '1')) return true
  return false
}
function isOpsActive(p: Prisoner): boolean {
  if (p.ops === true) return true
  const maybe = (p as any).ops
  if (typeof maybe === 'string' && (maybe?.toLowerCase() === 'yes' || maybe === '1')) return true
  return false
}
function isCcsActive(p: Prisoner): boolean {
  if (p.ccs === true) return true
  const maybe = (p as any).ccs
  if (typeof maybe === 'string' && (maybe?.toLowerCase() === 'yes' || maybe === '1')) return true
  return false
}

function getMusterPrintData(unitName: string, prisoners: Prisoner[]): Parameters<typeof buildMusterPrintHtml>[0] {
  const date = new Date().toISOString().slice(0, 10)
  const jobCounts: Record<string, number> = {}
  const prisonerRows = prisoners.map((p) => {
    const job = p.job || '—'
    jobCounts[job] = (jobCounts[job] || 0) + 1
    const { summary: hoursOut, currentLabel } = getOutOfUnitHours(p.locationHistory ?? [], p.location)
    return {
      name: p.name || '—',
      cell: p.cell || '—',
      security: p.security,
      job: p.job || '—',
      notes: p.notes || '—',
      ops: isOpsActive(p) ? 'Yes' : '—',
      ccs: isCcsActive(p) ? 'Yes' : '—',
      ntdb: isNtdbActive(p) ? 'Yes' : '—',
      hoursOut,
      currentLocation: currentLabel,
    }
  })
  const workPartyTotals = Object.entries(jobCounts)
    .filter(([job]) => job !== '—')
    .map(([job, count]) => ({ job, count }))
    .sort((a, b) => b.count - a.count)
  return { unitName, date, total: prisoners.length, prisoners: prisonerRows, workPartyTotals }
}

function newPrisoner(unitId: UnitId): Prisoner {
  return {
    id: `p-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name: '',
    cell: '',
    security: 'MED',
    job: '',
    notes: '',
    ops: false,
    ccs: false,
    ntdb: false,
    mealBreakfast: false,
    mealLunch: false,
    mealDinner: false,
    location: 'CELL',
    locationHistory: [],
    unitId,
  }
}

export default function MusterPage() {
  const { prisonId, unitId } = useParams<{ prisonId?: string; unitId?: string }>()
  const id = (unitId ?? 'north') as UnitId
  const unitsToSearch = prisonId ? getUnitsForPrison(prisonId) : UNITS
  const unit = unitsToSearch.find((u) => u.id === id) ?? (UNITS.find((u) => u.id === id) ?? unitsToSearch[0])

  const [prisoners, setPrisonersState] = useState<Prisoner[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [locationModal, setLocationModal] = useState(false)
  const [newLocation, setNewLocation] = useState<LocationCode>('YARD')
  const [moveModal, setMoveModal] = useState<{ prisonerIds: string[] } | null>(null)
  const [moveTargetUnit, setMoveTargetUnit] = useState<UnitId | ''>('')
  const [moveCellByPrisonerId, setMoveCellByPrisonerId] = useState<Record<string, string>>({})

  useEffect(() => {
    setPrisonersState(getPrisoners(id))
  }, [id])

  const save = (p: Prisoner) => {
    savePrisoner(id, p)
    setPrisonersState(getPrisoners(id))
    setEditingId(null)
    addAuditEntry({ action: 'Prisoner saved', detail: p.name || p.cell, unitId: id })
  }

  const remove = (p: Prisoner) => {
    if (confirm(`Remove ${p.name || 'this prisoner'} from muster?`)) {
      deletePrisoner(id, p.id)
      setPrisonersState(getPrisoners(id))
      setEditingId(null)
      addAuditEntry({ action: 'Prisoner removed', detail: p.name, unitId: id })
    }
  }

  const addNew = () => {
    const p = newPrisoner(id)
    savePrisoner(id, p)
    setPrisonersState(getPrisoners(id))
    setEditingId(p.id)
  }

  const toggleSelect = (pid: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(pid)) next.delete(pid)
      else next.add(pid)
      return next
    })
  }

  const selectAll = () => {
    if (selectedIds.size === prisoners.length) setSelectedIds(new Set())
    else setSelectedIds(new Set(prisoners.map((p) => p.id)))
  }

  const otherUnits = UNITS.filter((u) => u.id !== id)

  const applyMove = () => {
    if (!moveTargetUnit || moveTargetUnit === id) return
    const targetId = moveTargetUnit as UnitId
    const ids = moveModal?.prisonerIds ?? []
    ids.forEach((pid) => {
      movePrisonerToUnit(id, pid, targetId)
      const newCell = (moveCellByPrisonerId[pid] ?? '').trim()
      if (newCell) {
        const list = getPrisoners(targetId)
        const p = list.find((x) => x.id === pid)
        if (p) savePrisoner(targetId, { ...p, cell: newCell })
      }
      addAuditEntry({
        action: 'Prisoner moved to unit',
        detail: `${prisoners.find((x) => x.id === pid)?.name || pid} → ${(moveCellByPrisonerId[pid] ?? '').trim() || 'cell TBC'}`,
        unitId: targetId,
      })
    })
    setPrisonersState(getPrisoners(id))
    setMoveModal(null)
    setMoveTargetUnit('')
    setMoveCellByPrisonerId({})
    setSelectedIds(new Set())
  }

  const openMoveModal = (prisonerIds: string[]) => {
    setMoveModal({ prisonerIds })
    setMoveTargetUnit('')
    setMoveCellByPrisonerId(
      prisonerIds.reduce<Record<string, string>>((acc, pid) => {
        acc[pid] = ''
        return acc
      }, {})
    )
  }

  const setMoveCell = (prisonerId: string, value: string) => {
    setMoveCellByPrisonerId((prev) => ({ ...prev, [prisonerId]: value }))
  }

  const moveCanSubmit =
    moveTargetUnit &&
    moveModal?.prisonerIds.every((pid) => (moveCellByPrisonerId[pid] ?? '').trim().length > 0)

  const applyLocation = () => {
    const now = new Date().toISOString()
    selectedIds.forEach((pid) => {
      const p = prisoners.find((x) => x.id === pid)
      if (!p) return
      const prevRecord = p.locationHistory[p.locationHistory.length - 1]
      if (prevRecord && !prevRecord.to) {
        prevRecord.to = now
      }
      const updated: Prisoner = {
        ...p,
        location: newLocation,
        locationHistory: [
          ...p.locationHistory,
          { location: newLocation, from: now },
        ],
      }
      savePrisoner(id, updated)
      // Log each prisoner's location change with their name
      addAuditEntry({
        action: 'Location updated',
        detail: `${p.name || p.cell} moved to`,
        prisonerName: p.name || p.cell,
        prisonerLocation: newLocation,
        unitId: id,
      })
    })
    setPrisonersState(getPrisoners(id))
    setSelectedIds(new Set())
    setLocationModal(false)
  }

  const securityColor = (s: SecurityClassification | string) => {
    switch (s) {
      case 'UNCLASS': return 'bg-slate-100 text-slate-700'
      case 'L1': case 'L2': return 'bg-green-100 text-green-800'
      case 'MIN': case 'LOW': return 'bg-lime-100 text-lime-800'
      case 'L/MED': case 'MED': return 'bg-amber-100 text-amber-800'
      case 'HIGH': return 'bg-orange-100 text-orange-800'
      case 'MAX': return 'bg-red-100 text-red-800'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const locationColor = (loc: LocationCode) => {
    switch (loc) {
      case 'YARD': return 'bg-sky-100 text-sky-800'
      case 'MEDICAL': return 'bg-rose-100 text-rose-800'
      case 'COURT': return 'bg-violet-100 text-violet-800'
      case 'VISITS': return 'bg-teal-100 text-teal-800'
      case 'CELL': return 'bg-slate-100 text-slate-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}/unit/${id}/sco` : `/unit/${id}/sco`} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← {unit.name} Hub</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">{unit.name} — Muster</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.size > 0 && (
            <>
              <button
                type="button"
                onClick={() => setLocationModal(true)}
                className="btn-corrections"
              >
                Set location ({selectedIds.size})
              </button>
              <button
                type="button"
                onClick={() => openMoveModal([...selectedIds])}
                className="btn-outline"
              >
                Move to unit ({selectedIds.size})
              </button>
            </>
          )}
          <button type="button" onClick={addNew} className="btn-corrections">
            Add prisoner
          </button>
          <button
            type="button"
            onClick={() => {
              const data = getMusterPrintData(unit.name, prisoners)
              const html = buildMusterPrintHtml(data)
              openPrintPreviewWindow(html, `${unit.name} Muster`)
            }}
            className="btn-outline"
          >
            Print muster
          </button>
          <button
            type="button"
            onClick={() => {
              const data = getMusterPrintData(unit.name, prisoners)
              const html = buildMusterPrintHtml(data, { singlePage: true })
              openPrintPreviewWindow(html, `${unit.name} Muster (compact)`)
            }}
            className="btn-outline"
          >
            Print compact (single page)
          </button>
        </div>
      </div>

      {/* Move to unit modal */}
      {moveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-semibold text-lg mb-3">Move prisoner(s) to unit</h3>
            <p className="text-sm text-slate-600 mb-3">Select the destination unit and enter the new cell number for each prisoner.</p>
            <label className="block text-sm font-medium text-slate-700 mb-1">Destination unit</label>
            <select
              value={moveTargetUnit}
              onChange={(e) => setMoveTargetUnit(e.target.value as UnitId | '')}
              className="w-full border border-slate-300 rounded-lg p-2 mb-4"
            >
              <option value="">Select unit...</option>
              {otherUnits.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            <label className="block text-sm font-medium text-slate-700 mb-2">New cell number</label>
            <ul className="space-y-2 mb-4">
              {moveModal.prisonerIds.map((pid) => {
                const p = prisoners.find((x) => x.id === pid)
                return (
                  <li key={pid} className="flex items-center gap-2">
                    <span className="text-sm text-slate-700 min-w-[120px] truncate" title={p?.name}>
                      {p?.name || p?.cell || pid}
                    </span>
                    <input
                      type="text"
                      value={moveCellByPrisonerId[pid] ?? ''}
                      onChange={(e) => setMoveCell(pid, e.target.value)}
                      placeholder="e.g. D-102"
                      className="flex-1 border border-slate-300 rounded-lg px-2 py-1.5 text-sm font-mono"
                    />
                  </li>
                )
              })}
            </ul>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => { setMoveModal(null); setMoveTargetUnit(''); setMoveCellByPrisonerId({}) }}
                className="btn-outline"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={applyMove}
                disabled={!moveCanSubmit}
                className="btn-corrections disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Move
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location quick-set modal */}
      {locationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
            <h3 className="font-semibold text-lg mb-3">Set location for selected</h3>
            <select
              value={newLocation}
              onChange={(e) => setNewLocation(e.target.value as LocationCode)}
              className="w-full border border-slate-300 rounded-lg p-2 mb-4"
            >
              {LOCATION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setLocationModal(false)} className="btn-outline">Cancel</button>
              <button type="button" onClick={applyLocation} className="btn-corrections">Apply</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto overflow-y-visible">
        <table className="w-full text-sm" style={{ minWidth: '960px', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '36px' }} />
            <col style={{ width: '36px' }} />
            <col style={{ width: '36px' }} />
            <col style={{ width: '220px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '80px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '140px' }} />
            <col style={{ width: '44px' }} />
            <col style={{ width: '44px' }} />
            <col style={{ width: '44px' }} />
            <col style={{ width: '110px' }} />
            <col style={{ width: '90px' }} />
            <col style={{ width: '154px' }} />
          </colgroup>
          <thead>
            <tr className="bg-corrections-blue text-white">
              <th className="text-left p-2">B</th>
              <th className="text-left p-2">L</th>
              <th className="text-left p-2">D</th>
              <th className="text-left p-2 whitespace-nowrap" style={{ minWidth: '220px' }}>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={prisoners.length > 0 && selectedIds.size === prisoners.length}
                    onChange={selectAll}
                    className="rounded border-white"
                  />
                  <span>Name</span>
                </label>
              </th>
              <th className="text-left p-2 whitespace-nowrap" style={{ minWidth: '72px' }}>Cell</th>
              <th className="text-left p-2 whitespace-nowrap" style={{ minWidth: '72px' }}>Security</th>
              <th className="text-left p-2 whitespace-nowrap" style={{ minWidth: '100px' }}>Job</th>
              <th className="text-left p-2 whitespace-nowrap" style={{ minWidth: '100px' }}>Notes</th>
              <th className="text-left p-2 w-12">OPs</th>
              <th className="text-left p-2 w-12">CCs</th>
              <th className="text-left p-2 w-12">NTDB</th>
              <th className="text-left p-2 w-12">B</th>
              <th className="text-left p-2 w-12">L</th>
              <th className="text-left p-2 w-12">D</th>
              <th className="text-left p-2 whitespace-nowrap" style={{ minWidth: '100px' }}>Hours out of unit</th>
              <th className="text-left p-2 whitespace-nowrap" style={{ minWidth: '80px' }}>Current location</th>
              <th className="text-left p-2 whitespace-nowrap" style={{ minWidth: '140px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {prisoners.map((p) => {
              const ntdbOn = isNtdbActive(p)
              const opsOn = isOpsActive(p)
              const ccsOn = isCcsActive(p)
              const { summary: hoursOut, currentLabel } = getOutOfUnitHours(p.locationHistory ?? [], p.location)
              return (
              <tr
                key={p.id}
                className={`border-t border-slate-200 ${selectedIds.has(p.id) ? 'bg-corrections-blue-pale/50' : ''} ${ntdbOn ? 'bg-amber-50' : ''}`}
              >
                {editingId === p.id ? (
                  <EditRow
                    prisoner={p}
                    onSave={save}
                    onCancel={() => setEditingId(null)}
                    onRemove={() => remove(p)}
                  />
                ) : (
                  <>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <input
                        type="checkbox"
                        checked={!!p.mealBreakfast}
                        onChange={() => {
                          const next = { ...p, mealBreakfast: !p.mealBreakfast }
                          save(next)
                        }}
                        className="rounded border-corrections-blue text-corrections-blue"
                      />
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <input
                        type="checkbox"
                        checked={!!p.mealLunch}
                        onChange={() => {
                          const next = { ...p, mealLunch: !p.mealLunch }
                          save(next)
                        }}
                        className="rounded border-corrections-blue text-corrections-blue"
                      />
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <input
                        type="checkbox"
                        checked={!!p.mealDinner}
                        onChange={() => {
                          const next = { ...p, mealDinner: !p.mealDinner }
                          save(next)
                        }}
                        className="rounded border-corrections-blue text-corrections-blue"
                      />
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-corrections-blue text-corrections-blue"
                        />
                        <span className="block break-words text-slate-900 font-medium">{p.name || '—'}</span>
                      </label>
                    </td>
                    <td className={`p-2 align-top font-mono ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <span className="block break-words text-slate-900">{p.cell || '—'}</span>
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${securityColor(p.security)}`}>
                        {p.security}
                      </span>
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <span className="block break-words text-slate-900">{p.job || '—'}</span>
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`} title={p.notes}>
                      <span className="block break-words text-slate-900">{p.notes || '—'}</span>
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <span className={opsOn ? 'font-semibold text-red-600' : 'text-slate-500'}>{opsOn ? 'Yes' : '—'}</span>
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <span className={ccsOn ? 'font-semibold text-red-600' : 'text-slate-500'}>{ccsOn ? 'Yes' : '—'}</span>
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <span className={ntdbOn ? 'font-semibold text-amber-800' : 'text-slate-500'}>{ntdbOn ? 'Yes' : '—'}</span>
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <span className="block break-words text-slate-900 text-xs">{hoursOut}</span>
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${locationColor(p.location)}`}>
                        {currentLabel}
                      </span>
                    </td>
                    <td className={`p-2 align-top ${ntdbOn ? 'bg-amber-100' : ''}`}>
                      <button
                        type="button"
                        onClick={() => setEditingId(p.id)}
                        className="text-corrections-blue hover:underline mr-1"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => openMoveModal([p.id])}
                        className="text-corrections-blue hover:underline mr-1"
                      >
                        Move
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(p)}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </td>
                  </>
                )}
              </tr>
            )})}
          </tbody>
        </table>
        {prisoners.length === 0 && (
          <div className="p-8 text-center text-slate-500">No prisoners in muster. Add one to get started.</div>
        )}
      </div>
    </Layout>
  )
}

function EditRow({
  prisoner,
  onSave,
  onCancel,
  onRemove,
}: {
  prisoner: Prisoner
  onSave: (p: Prisoner) => void
  onCancel: () => void
  onRemove: () => void
}) {
  const [p, setP] = useState<Prisoner>({
    ...prisoner,
    ops: isOpsActive(prisoner),
    ccs: isCcsActive(prisoner),
    ntdb: isNtdbActive(prisoner),
  })
  const initialJobIsManual = (prisoner.job ?? '') !== '' && !JOB_FIXED_VALUES.includes((prisoner.job ?? '') as (typeof JOB_FIXED_VALUES)[number])
  const [jobIsManualEntry, setJobIsManualEntry] = useState(initialJobIsManual)
  const jobSelectValue = jobIsManualEntry ? JOB_MANUAL_ENTRY : (p.job ?? '')
  return (
    <>
          <td colSpan={11} className="p-2 bg-slate-50">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <input
            placeholder="Name"
            value={p.name}
            onChange={(e) => setP({ ...p, name: e.target.value })}
            className="border rounded px-2 py-1"
          />
          <input
            placeholder="Cell"
            value={p.cell}
            onChange={(e) => setP({ ...p, cell: e.target.value })}
            className="border rounded px-2 py-1 font-mono"
          />
          <select
            value={p.security}
            onChange={(e) => setP({ ...p, security: e.target.value as SecurityClassification })}
            className="border rounded px-2 py-1"
          >
            {SECURITY_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <div className="col-span-2 space-y-1">
            <select
              value={jobSelectValue}
              onChange={(e) => {
                const v = e.target.value
                const isManual = v === JOB_MANUAL_ENTRY
                setJobIsManualEntry(isManual)
                setP({ ...p, job: isManual ? '' : v })
              }}
              className="border rounded px-2 py-1 w-full"
            >
              {JOB_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {jobSelectValue === JOB_MANUAL_ENTRY && (
              <input
                type="text"
                value={p.job ?? ''}
                onChange={(e) => setP({ ...p, job: e.target.value })}
                placeholder="Type job here..."
                className="border rounded px-2 py-1 w-full text-sm"
              />
            )}
          </div>
          <input
            placeholder="Notes"
            value={p.notes ?? ''}
            onChange={(e) => setP({ ...p, notes: e.target.value })}
            className="border rounded px-2 py-1 col-span-2"
          />
          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={!!p.ops}
              onChange={(e) => setP({ ...p, ops: e.target.checked })}
              className="rounded border-corrections-blue text-corrections-blue"
            />
            <span className="text-sm">OPs</span>
          </label>
          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={!!p.ccs}
              onChange={(e) => setP({ ...p, ccs: e.target.checked })}
              className="rounded border-corrections-blue text-corrections-blue"
            />
            <span className="text-sm">CCs</span>
          </label>
          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={!!p.ntdb}
              onChange={(e) => setP({ ...p, ntdb: e.target.checked })}
              className="rounded border-corrections-blue text-corrections-blue"
            />
            <span className="text-sm">NTDB</span>
          </label>
          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={!!p.mealBreakfast}
              onChange={(e) => setP({ ...p, mealBreakfast: e.target.checked })}
              className="rounded border-corrections-blue text-corrections-blue"
            />
            <span className="text-sm">Breakfast</span>
          </label>
          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={!!p.mealLunch}
              onChange={(e) => setP({ ...p, mealLunch: e.target.checked })}
              className="rounded border-corrections-blue text-corrections-blue"
            />
            <span className="text-sm">Lunch</span>
          </label>
          <label className="flex items-center gap-2 col-span-2">
            <input
              type="checkbox"
              checked={!!p.mealDinner}
              onChange={(e) => setP({ ...p, mealDinner: e.target.checked })}
              className="rounded border-corrections-blue text-corrections-blue"
            />
            <span className="text-sm">Dinner</span>
          </label>
        </div>
      </td>
      <td className="p-2 bg-slate-50 text-slate-500 text-xs">—</td>
      <td className="p-2 bg-slate-50">
        <select
          value={p.location}
          onChange={(e) => setP({ ...p, location: e.target.value as LocationCode })}
          className="border rounded px-2 py-1 w-full"
        >
          {LOCATION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </td>
      <td className="p-2 bg-slate-50">
        <button type="button" onClick={() => onSave(p)} className="text-corrections-blue hover:underline mr-2">Save</button>
        <button type="button" onClick={onCancel} className="text-slate-600 hover:underline mr-2">Cancel</button>
        <button type="button" onClick={onRemove} className="text-red-600 hover:underline">Remove</button>
      </td>
    </>
  )
}
