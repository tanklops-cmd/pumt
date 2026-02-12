import type {
  Prisoner,
  HandoverSection,
  DailyTask,
  MusterConfirmation,
  CellAlarm,
  SearchTarget,
  StripSearchRecord,
  AuditEntry,
} from './types'
import { UNITS, DAILY_TASK_LABELS, FACILITY_OPTIONS, getUnitsForPrison } from './constants'
import type { UnitId } from './types'

const STORAGE_KEYS = {
  prisoners: 'prison-muster-prisoners',
  handover: 'prison-muster-handover',
  dailyTasks: 'prison-muster-daily-tasks',
  musterConfirm: 'prison-muster-confirm',
  cellAlarms: 'prison-muster-cell-alarms',
  searchTargets: 'prison-muster-search-targets',
  stripSearch: 'prison-muster-strip-search',
  audit: 'prison-muster-audit',
  controlHandover: 'prison-muster-control-handover',
  hubSnapshots: 'prison-muster-hub-snapshots',
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function weekKey(): string {
  const d = new Date()
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay())
  return start.toISOString().slice(0, 10)
}

// ——— Prisoners ———
export function getPrisoners(unitId: UnitId): Prisoner[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.prisoners)
    if (!raw) return []
    const all: Prisoner[] = JSON.parse(raw)
    return all.filter((p) => p.unitId === unitId)
  } catch {
    return []
  }
}

export function getAllPrisoners(): Prisoner[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.prisoners)
    if (!raw) return []
    const all: Prisoner[] = JSON.parse(raw)
    return all
  } catch {
    return []
  }
}

export function setPrisoners(unitId: UnitId, prisoners: Prisoner[]): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.prisoners)
    const all: Prisoner[] = raw ? JSON.parse(raw) : []
    const rest = all.filter((p) => p.unitId !== unitId)
    const updated = [...rest, ...prisoners]
    localStorage.setItem(STORAGE_KEYS.prisoners, JSON.stringify(updated))
  } catch (e) {
    console.error(e)
  }
}

export function savePrisoner(unitId: UnitId, prisoner: Prisoner): void {
  const list = getPrisoners(unitId)
  const idx = list.findIndex((p) => p.id === prisoner.id)
  const next = idx >= 0 ? list.map((p) => (p.id === prisoner.id ? prisoner : p)) : [...list, prisoner]
  setPrisoners(unitId, next)
  addAuditEntry({ action: 'Prisoner saved', detail: `${prisoner.name || prisoner.cell} (${prisoner.id})`, unitId })
}

export function deletePrisoner(unitId: UnitId, prisonerId: string): void {
  const list = getPrisoners(unitId).filter((p) => p.id !== prisonerId)
  setPrisoners(unitId, list)
  addAuditEntry({ action: 'Prisoner deleted', detail: prisonerId, unitId })
}

/** Replace all prisoners in the system (e.g. for loading mock data). */
export function replaceAllPrisoners(prisoners: Prisoner[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.prisoners, JSON.stringify(prisoners))
  } catch (e) {
    console.error(e)
  }
}

/** Move a prisoner from one unit to another. Returns true if moved. */
export function movePrisonerToUnit(
  fromUnitId: UnitId,
  prisonerId: string,
  toUnitId: UnitId
): boolean {
  if (fromUnitId === toUnitId) return false
  const list = getPrisoners(fromUnitId)
  const prisoner = list.find((p) => p.id === prisonerId)
  if (!prisoner) return false
  deletePrisoner(fromUnitId, prisonerId)
  const updated: Prisoner = { ...prisoner, unitId: toUnitId }
  savePrisoner(toUnitId, updated)
  return true
}

// ——— Handover ———
export function getHandover(unitId: UnitId, date: string): HandoverSection {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.handover)
    if (!raw) return {}
    const byUnit: Record<string, Record<string, HandoverSection>> = JSON.parse(raw)
    return byUnit[unitId]?.[date] ?? {}
  } catch {
    return {}
  }
}

export function setHandover(unitId: UnitId, date: string, data: HandoverSection): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.handover)
    const byUnit: Record<string, Record<string, HandoverSection>> = raw ? JSON.parse(raw) : {}
    if (!byUnit[unitId]) byUnit[unitId] = {}
    byUnit[unitId][date] = data
    localStorage.setItem(STORAGE_KEYS.handover, JSON.stringify(byUnit))
  } catch (e) {
    console.error(e)
  }
}

// ——— Daily tasks ———
export function getDailyTasks(unitId: UnitId, date: string): DailyTask[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.dailyTasks)
    if (!raw) return []
    const all: DailyTask[] = JSON.parse(raw)
    return all.filter((t) => t.unitId === unitId && t.date === date)
  } catch {
    return []
  }
}

export function ensureDailyTasks(unitId: UnitId, date: string): DailyTask[] {
  let tasks = getDailyTasks(unitId, date)
  if (tasks.length === 0) {
    tasks = DAILY_TASK_LABELS.map((label, i) => ({
      id: `task-${unitId}-${date}-${i}`,
      label,
      done: false,
        unitId: unitId as any,
      date,
    }))
    const raw = localStorage.getItem(STORAGE_KEYS.dailyTasks)
    const all: DailyTask[] = raw ? JSON.parse(raw) : []
    const rest = all.filter((t) => !(t.unitId === unitId && t.date === date))
    localStorage.setItem(STORAGE_KEYS.dailyTasks, JSON.stringify([...rest, ...tasks]))
  }
  return tasks
}

export function toggleDailyTask(taskId: string): void {
  const raw = localStorage.getItem(STORAGE_KEYS.dailyTasks)
  if (!raw) return
  const all: DailyTask[] = JSON.parse(raw)
  const updated = all.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t))
  localStorage.setItem(STORAGE_KEYS.dailyTasks, JSON.stringify(updated))
}

// ——— Muster confirmation ———
export function getMusterConfirmation(unitId: UnitId, date: string): MusterConfirmation | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.musterConfirm)
    if (!raw) return null
    const all: MusterConfirmation[] = JSON.parse(raw)
    return all.find((m) => m.unitId === unitId && m.date === date) ?? null
  } catch {
    return null
  }
}

export function setMusterConfirmation(unitId: UnitId, date: string, data: Partial<MusterConfirmation>): void {
  const raw = localStorage.getItem(STORAGE_KEYS.musterConfirm)
  const all: MusterConfirmation[] = raw ? JSON.parse(raw) : []
  const rest = all.filter((m) => !(m.unitId === unitId && m.date === date))
  const existing = all.find((m) => m.unitId === unitId && m.date === date)
  const next: MusterConfirmation = {
    unitId,
    date,
    unlock: data.unlock ?? existing?.unlock ?? false,
    random: data.random ?? existing?.random ?? false,
    lockup: data.lockup ?? existing?.lockup ?? false,
  }
  localStorage.setItem(STORAGE_KEYS.musterConfirm, JSON.stringify([...rest, next]))
}

// ——— Cell alarms (weekly) ———
export function getCellAlarms(unitId: UnitId): CellAlarm[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.cellAlarms)
    if (!raw) return []
    const all: CellAlarm[] = JSON.parse(raw)
    return all.filter((a) => a.unitId === unitId && a.weekKey === weekKey())
  } catch {
    return []
  }
}

export function ensureCellAlarms(unitId: UnitId, cells: string[]): CellAlarm[] {
  const wk = weekKey()
  let alarms = getCellAlarms(unitId)
  const existingCells = new Set(alarms.map((a) => a.cell))
  for (const cell of cells) {
    if (!existingCells.has(cell)) {
      alarms.push({
        id: `alarm-${unitId}-${wk}-${cell}`,
        cell,
        weekKey: wk,
        checked: false,
        unitId,
      })
      existingCells.add(cell)
    }
  }
  const raw = localStorage.getItem(STORAGE_KEYS.cellAlarms)
  const all: CellAlarm[] = raw ? JSON.parse(raw) : []
  const rest = all.filter((a) => !(a.unitId === unitId && a.weekKey === wk))
  localStorage.setItem(STORAGE_KEYS.cellAlarms, JSON.stringify([...rest, ...alarms]))
  return getCellAlarms(unitId)
}

export function toggleCellAlarm(alarmId: string): void {
  const raw = localStorage.getItem(STORAGE_KEYS.cellAlarms)
  if (!raw) return
  const all: CellAlarm[] = JSON.parse(raw)
  const updated = all.map((a) =>
    a.id === alarmId ? { ...a, checked: !a.checked, checkedAt: new Date().toISOString() } : a
  )
  localStorage.setItem(STORAGE_KEYS.cellAlarms, JSON.stringify(updated))
}

// ——— Random searches ———
export function getSearchTargets(unitId: UnitId, date: string): SearchTarget[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.searchTargets)
    if (!raw) return []
    const all: SearchTarget[] = JSON.parse(raw)
    return all.filter((s) => s.unitId === unitId && s.date === date)
  } catch {
    return []
  }
}

export function generateSearches(unitId: UnitId, date: string, cells: string[]): SearchTarget[] {
  const cellsCopy = [...cells].filter(Boolean)
  const facilities = [...FACILITY_OPTIONS]
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const threeCells = shuffle(cellsCopy).slice(0, 3)
  const twoFacilities = shuffle(facilities).slice(0, 2)
  const targets: SearchTarget[] = [
    ...threeCells.map((value) => ({ type: 'cell' as const, value, unitId, date })),
    ...twoFacilities.map((value) => ({ type: 'facility' as const, value, unitId, date })),
  ]
  const raw = localStorage.getItem(STORAGE_KEYS.searchTargets)
  const all: SearchTarget[] = raw ? JSON.parse(raw) : []
  const rest = all.filter((s) => !(s.unitId === unitId && s.date === date))
  localStorage.setItem(STORAGE_KEYS.searchTargets, JSON.stringify([...rest, ...targets]))
  return targets
}

// ——— Clear / reset search targets ———
export function clearSearchTargetsForUnitDate(unitId: UnitId, date: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.searchTargets)
    const all: SearchTarget[] = raw ? JSON.parse(raw) : []
    const rest = all.filter((s) => !(s.unitId === unitId && s.date === date))
    localStorage.setItem(STORAGE_KEYS.searchTargets, JSON.stringify(rest))
  } catch (e) {
    console.error('Failed clearing search targets', e)
  }
}

export function clearSearchTargetsForDate(date: string): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.searchTargets)
    const all: SearchTarget[] = raw ? JSON.parse(raw) : []
    const rest = all.filter((s) => s.date !== date)
    localStorage.setItem(STORAGE_KEYS.searchTargets, JSON.stringify(rest))
  } catch (e) {
    console.error('Failed clearing search targets for date', e)
  }
}

// ——— Strip search ———
export function getStripSearch(unitId: UnitId, date: string): StripSearchRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.stripSearch)
    if (!raw) return null
    const byUnit: Record<string, Record<string, StripSearchRecord>> = JSON.parse(raw)
    return byUnit[unitId]?.[date] ?? null
  } catch {
    return null
  }
}

export function setStripSearch(
  unitId: UnitId,
  date: string,
  data: { performed: boolean; prisonerIds: string[] }
): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.stripSearch)
    const byUnit: Record<string, Record<string, StripSearchRecord>> = raw ? JSON.parse(raw) : {}
    if (!byUnit[unitId]) byUnit[unitId] = {}
    byUnit[unitId][date] = { unitId, date, performed: data.performed, prisonerIds: data.prisonerIds || [] }
    localStorage.setItem(STORAGE_KEYS.stripSearch, JSON.stringify(byUnit))
  } catch (e) {
    console.error(e)
  }
}

// ——— Audit ———
export function getAuditEntries(): AuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.audit)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function addAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
  const all = getAuditEntries()
  const newEntry: AuditEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
  }
  localStorage.setItem(STORAGE_KEYS.audit, JSON.stringify([newEntry, ...all]))
}

// ——— Control hub helpers ———
export function getUnitMusterSummary(unitId: UnitId) {
  const prisoners = getPrisoners(unitId)
  const total = prisoners.length
  const byLocation: Record<string, number> = {}
  for (const p of prisoners) {
    byLocation[p.location] = (byLocation[p.location] ?? 0) + 1
  }
  const cellAlarms = getCellAlarms(unitId)
  const allAlarmsChecked = cellAlarms.length > 0 && cellAlarms.every((a) => a.checked)
  const muster = getMusterConfirmation(unitId, today())
  return {
    unitId,
    total,
    byLocation,
    onSite: byLocation['CELL'] ?? 0,
    offSite: total - (byLocation['CELL'] ?? 0),
    allAlarmsChecked,
    musterConfirmed: Boolean(muster && (muster.unlock || muster.random || muster.lockup)),
  }
}

export function getAllUnitsSummary() {
  try {
    const summaries = UNITS.map((u) => getUnitMusterSummary(u.id as any))
    const total = summaries.reduce((s, cur) => s + (cur.total ?? 0), 0)
    const offSite = summaries.reduce((s, cur) => s + (cur.offSite ?? 0), 0)
    return { summaries, total, offSite }
  } catch {
    return { summaries: [], total: 0, offSite: 0 }
  }
}

/** Return summary for all units belonging to a prison (uses getUnitsForPrison). */
export function getUnitsSummaryForPrison(prisonId: string) {
  try {
    const units = getUnitsForPrison(prisonId)
    const summaries = units.map((u) => getUnitMusterSummary(u.id as any))
    const total = summaries.reduce((s, cur) => s + (cur.total ?? 0), 0)
    const offSite = summaries.reduce((s, cur) => s + (cur.offSite ?? 0), 0)
    return { summaries, total, offSite }
  } catch {
    return { summaries: [], total: 0, offSite: 0 }
  }
}

export function countIncompleteDailyTasks(unitId: UnitId, date: string): number {
  try {
    const tasks = getDailyTasks(unitId, date)
    return tasks.filter((t) => !t.done).length
  } catch {
    return 0
  }
}

export function unitsWithIncompleteTasksForPrison(prisonId: string, date: string) {
  try {
    const units = getUnitsForPrison(prisonId)
    return units.map((u) => ({ unitId: u.id, incomplete: countIncompleteDailyTasks(u.id as any, date) })).filter((x) => x.incomplete > 0)
  } catch {
    return []
  }
}

export function unitsWithIncompleteTasksForAll(date: string) {
  try {
    return UNITS.map((u) => ({ unitId: u.id, incomplete: countIncompleteDailyTasks(u.id as any, date) })).filter((x) => x.incomplete > 0)
  } catch {
    return []
  }
}

/** Reset daily tasks only for units belonging to a given prison (does NOT touch handover). */
export function resetDailyTasksForPrison(prisonId: string, date: string) {
  try {
    const units = getUnitsForPrison(prisonId)
    for (const u of units) {
      saveHubSnapshot(u.id as any, date)
    }
    const raw = localStorage.getItem(STORAGE_KEYS.dailyTasks)
    const all: DailyTask[] = raw ? JSON.parse(raw) : []
    const unitIds = new Set(units.map((u) => u.id))
    const updated = all.map((t) => (t.date === date && unitIds.has(t.unitId) ? { ...t, done: false } : t))
    localStorage.setItem(STORAGE_KEYS.dailyTasks, JSON.stringify(updated))
    // Reset prisoner locations and meals for units in this prison only
    try {
      const rawPr = localStorage.getItem(STORAGE_KEYS.prisoners)
      const allPrisoners: Prisoner[] = rawPr ? JSON.parse(rawPr) : []
      const nextPrisoners = allPrisoners.map((p) =>
        unitIds.has(p.unitId)
          ? { ...p, location: 'CELL', mealBreakfast: false, mealLunch: false, mealDinner: false }
          : p
      )
      localStorage.setItem(STORAGE_KEYS.prisoners, JSON.stringify(nextPrisoners))
    } catch (e) {
      console.error('Failed resetting prisoners for prison', e)
    }

    // Clear muster confirmations for these units for the date
    try {
      for (const u of units) {
        setMusterConfirmation(u.id as any, date, { unlock: false, random: false, lockup: false })
      }
    } catch (e) {
      console.error('Failed clearing muster confirmations for prison reset', e)
    }

    // Clear generated daily searches for these units for the date
    try {
      for (const u of units) {
        clearSearchTargetsForUnitDate(u.id as any, date)
      }
    } catch (e) {
      console.error('Failed clearing search targets for prison reset', e)
    }

    addAuditEntry({ action: 'Daily tasks reset (prison)', detail: `Reset tasks, prisoner locations and meals for ${prisonId} ${date}` })
  } catch (e) {
    console.error(e)
  }
}

export function runSelfCheck() {
  const issues: string[] = []
  // Check storage keys exist and parsable
  try {
    Object.values(STORAGE_KEYS).forEach((k) => {
      try {
        const raw = localStorage.getItem(k)
        if (raw) JSON.parse(raw)
      } catch (e) {
        issues.push(`Storage key ${k} contains invalid JSON`)
      }
    })
  } catch (e) {
    issues.push('Unable to access localStorage')
  }

  // Detect duplicate prisoner IDs
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.prisoners)
    if (raw) {
      const all = JSON.parse(raw) as Prisoner[]
      const ids = new Set<string>()
      for (const p of all) {
        if (ids.has(p.id)) issues.push(`Duplicate prisoner id ${p.id}`)
        ids.add(p.id)
      }
    }
  } catch {}

  // Basic alarm/task consistency
  try {
    const summaries = UNITS.map((u) => getUnitMusterSummary(u.id))
    summaries.forEach((s) => {
      if (s.total === 0) issues.push(`${s.unitId} has zero prisoners — check muster entries`)
      if (!Array.isArray(getCellAlarms(s.unitId))) issues.push(`${s.unitId} cell alarms malformed`)
    })
  } catch {}

  return issues
}

// ——— Control handover (global) ———
export function getControlHandover(date: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.controlHandover)
    if (!raw) return { date }
    const byDate: Record<string, { general?: string; visits?: string; other?: string }> = JSON.parse(raw)
    const result = byDate[date] ?? {}
    return { date, general: result.general, visits: result.visits, other: result.other }
  } catch {
    return { date }
  }
}

export function setControlHandover(date: string, data: { general?: string; visits?: string; other?: string }) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.controlHandover)
    const byDate: Record<string, { general?: string; visits?: string; other?: string }> = raw ? JSON.parse(raw) : {}
    byDate[date] = { general: data.general ?? byDate[date]?.general, visits: data.visits ?? byDate[date]?.visits, other: data.other ?? byDate[date]?.other }
    localStorage.setItem(STORAGE_KEYS.controlHandover, JSON.stringify(byDate))
    addAuditEntry({ action: 'Control handover updated', detail: date })
  } catch (e) {
    console.error(e)
  }
}

// ——— Hub snapshots (per-unit, per-date) ———
export function saveHubSnapshot(unitId: UnitId, date: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.hubSnapshots)
    const byUnit: Record<string, Record<string, any>> = raw ? JSON.parse(raw) : {}
    if (!byUnit[unitId]) byUnit[unitId] = {}
    byUnit[unitId][date] = {
      date,
      tasks: getDailyTasks(unitId, date),
      muster: getMusterConfirmation(unitId, date),
      alarms: getCellAlarms(unitId),
      handover: getHandover(unitId, date),
      stripSearch: getStripSearch(unitId, date),
      searches: getSearchTargets(unitId, date),
      prisoners: getPrisoners(unitId),
    }
    localStorage.setItem(STORAGE_KEYS.hubSnapshots, JSON.stringify(byUnit))
    addAuditEntry({ action: 'Hub snapshot saved', detail: `${unitId} ${date}`, unitId })
  } catch (e) {
    console.error(e)
  }
}

export function getHubSnapshot(unitId: UnitId, date: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.hubSnapshots)
    if (!raw) return null
    const byUnit: Record<string, Record<string, any>> = JSON.parse(raw)
    return byUnit[unitId]?.[date] ?? null
  } catch {
    return null
  }
}

export function listHubSnapshots(unitId: UnitId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.hubSnapshots)
    if (!raw) return []
    const byUnit: Record<string, Record<string, any>> = JSON.parse(raw)
    return Object.keys(byUnit[unitId] || {}).sort((a, b) => (a < b ? 1 : -1))
  } catch {
    return []
  }
}

// ——— Reset daily tasks for all units (does NOT touch handover) ———
export function resetDailyTasksForDate(date: string) {
  try {
    // save a snapshot for each unit before resetting
    for (const u of UNITS) {
      saveHubSnapshot(u.id, date)
    }
    const raw = localStorage.getItem(STORAGE_KEYS.dailyTasks)
    const all: DailyTask[] = raw ? JSON.parse(raw) : []
    const updated = all.map((t) => (t.date === date ? { ...t, done: false } : t))
    localStorage.setItem(STORAGE_KEYS.dailyTasks, JSON.stringify(updated))

    // Reset prisoner locations and meal checkboxes for every unit
    try {
      const rawPr = localStorage.getItem(STORAGE_KEYS.prisoners)
      const allPrisoners: Prisoner[] = rawPr ? JSON.parse(rawPr) : []
      const resetPrisoners = allPrisoners.map((p) => ({
        ...p,
        location: 'CELL',
        mealBreakfast: false,
        mealLunch: false,
        mealDinner: false,
      }))
      localStorage.setItem(STORAGE_KEYS.prisoners, JSON.stringify(resetPrisoners))
    } catch (e) {
      console.error('Failed resetting prisoners', e)
    }

    // Clear muster confirmations for all units for the date
    try {
      const units = UNITS
      for (const u of units) {
        setMusterConfirmation(u.id as any, date, { unlock: false, random: false, lockup: false })
      }
    } catch (e) {
      console.error('Failed clearing muster confirmations for date reset', e)
    }

    // Clear generated daily searches for the date across all units
    try {
      clearSearchTargetsForDate(date)
    } catch (e) {
      console.error('Failed clearing search targets for date reset', e)
    }

    addAuditEntry({ action: 'Daily tasks reset', detail: `Reset tasks, prisoner locations and meals for ${date}` })
  } catch (e) {
    console.error(e)
  }
}

/**
 * Initialize template hubs for a given prison.
 * Creates today's daily tasks for each unit and saves an initial hub snapshot.
 * Returns the list of unit ids that were initialized.
 */
export function initializeTemplateHubsForPrison(prisonId: string, date?: string): string[] {
  const d = date ?? today()
  const units = getUnitsForPrison(prisonId)
  const initialized: string[] = []
  try {
    // Batch-create missing daily tasks for all units, then write once.
    const rawTasks = localStorage.getItem(STORAGE_KEYS.dailyTasks)
    const allTasks: DailyTask[] = rawTasks ? JSON.parse(rawTasks) : []
    const additions: DailyTask[] = []
    for (const u of units) {
      const exists = allTasks.some((t) => t.unitId === u.id && t.date === d)
      if (!exists) {
        const tasks = DAILY_TASK_LABELS.map((label, i) => ({
          id: `task-${u.id}-${d}-${i}`,
          label,
          done: false,
          unitId: u.id as any,
          date: d,
        }))
        additions.push(...tasks)
      }
    }
    if (additions.length > 0) {
      localStorage.setItem(STORAGE_KEYS.dailyTasks, JSON.stringify([...allTasks, ...additions]))
    }

    // Batch-save hub snapshots for the prison units
    const rawSnapshots = localStorage.getItem(STORAGE_KEYS.hubSnapshots)
    const byUnit: Record<string, Record<string, any>> = rawSnapshots ? JSON.parse(rawSnapshots) : {}
    for (const u of units) {
      if (!byUnit[u.id]) byUnit[u.id] = {}
      byUnit[u.id][d] = {
        date: d,
        tasks: getDailyTasks(u.id as any, d),
        muster: getMusterConfirmation(u.id as any, d),
        alarms: getCellAlarms(u.id as any),
        handover: getHandover(u.id as any, d),
        stripSearch: getStripSearch(u.id as any, d),
        searches: getSearchTargets(u.id as any, d),
        prisoners: getPrisoners(u.id as any),
      }
      initialized.push(u.id)
    }
    localStorage.setItem(STORAGE_KEYS.hubSnapshots, JSON.stringify(byUnit))

    addAuditEntry({ action: 'Initialized template hubs', detail: `${prisonId} (${initialized.length} units)` })
  } catch (e) {
    console.error(e)
  }
  return initialized
}

/**
 * Collect all relevant data for a prison ready for export/import.
 */
export function getPrisonDataForPrison(prisonId: string, date?: string) {
  const d = date ?? today()
  const units = getUnitsForPrison(prisonId)
  const payload: any = { prisonId, date: d, units: {} }
  for (const u of units) {
    payload.units[u.id] = {
      unit: u,
      prisoners: getPrisoners(u.id as any),
      dailyTasks: getDailyTasks(u.id as any, d),
      muster: getMusterConfirmation(u.id as any, d),
      alarms: getCellAlarms(u.id as any),
      stripSearch: getStripSearch(u.id as any, d),
      searches: getSearchTargets(u.id as any, d),
      snapshots: getHubSnapshot(u.id as any, d),
    }
  }
  return payload
}

export function exportPrisonData(prisonId: string, date?: string) {
  return JSON.stringify(getPrisonDataForPrison(prisonId, date), null, 2)
}
