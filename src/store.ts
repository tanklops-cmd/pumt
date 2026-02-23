import type {
  Prisoner,
  HandoverSection,
  DailyTask,
  MusterConfirmation,
  CellAlarm,
  SearchTarget,
  StripSearchRecord,
  AuditEntry,
  UnitMaintenanceEntry,
  PrisonerInduction,
} from './types'
import { UNITS, DAILY_TASK_LABELS, getUnitsForPrison } from './constants'
import type { UnitId } from './types'
import * as api from './api';
import { getInMemoryData, setInMemoryData } from './sync';

// Get data directly from sync.ts in-memory store
function getDataCache() {
  return getInMemoryData();
}

// Helper to update sync's in-memory store
function updateCache() {
  // Data is already in sync.ts inMemoryData, functions that modify data should call this to trigger any side effects
}

// In-memory audit entries
let auditEntries: AuditEntry[] = [];

// ——— SACRA Review Reminders ———

export interface SacraReminder {
  id: string
  unitId: UnitId
  prisoner1Name: string
  prisoner2Name: string
  prisoner1Id: string
  prisoner2Id: string
  cell: string
  createdAt: string // ISO date string
  dismissed: boolean
}

export async function loadSacraReminders(unitId?: UnitId): Promise<SacraReminder[]> {
  try {
    const reminders = await api.fetchSacraReminders(unitId);
    const mem = getDataCache();
    mem.sacraReminders = reminders;
    return reminders;
  } catch (e) {
    console.error('Failed to load sacra reminders:', e);
    const mem = getDataCache();
    return mem.sacraReminders?.filter((r: SacraReminder) => !unitId || r.unitId === unitId) || [];
  }
}

export function createSacraReminder(
  unitId: UnitId,
  prisoner1Name: string,
  prisoner2Name: string,
  prisoner1Id: string,
  prisoner2Id: string,
  cell: string
): void {
  const newReminder: SacraReminder = {
    id: `sacra-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    unitId,
    prisoner1Name,
    prisoner2Name,
    prisoner1Id,
    prisoner2Id,
    cell,
    createdAt: new Date().toISOString(),
    dismissed: false,
  }
  const mem = getDataCache();
  if (!mem.sacraReminders) mem.sacraReminders = [];
  mem.sacraReminders.unshift(newReminder);
  // Keep only last 100 reminders
  mem.sacraReminders = mem.sacraReminders.slice(0, 100);
  addAuditEntry({ action: 'SACRA review reminder created', detail: `${prisoner1Name} & ${prisoner2Name} - ${cell}`, unitId })
  // Save to backend
  api.saveSacraReminder(newReminder).catch(e => console.error('Failed to sync sacra reminder:', e));
}

export function getSacraReminders(unitId?: UnitId): SacraReminder[] {
  const mem = getDataCache();
  const all = mem.sacraReminders || [];
  // Filter by unit if provided
  const filtered = unitId ? all.filter((r: SacraReminder) => r.unitId === unitId) : all;
  // Only return active reminders (not dismissed and within 3 days)
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  return filtered.filter((r: SacraReminder) => !r.dismissed && new Date(r.createdAt) > threeDaysAgo);
}

export function dismissSacraReminder(id: string): void {
  const mem = getDataCache();
  const all = mem.sacraReminders || [];
  const updated = all.map((r: SacraReminder) => r.id === id ? { ...r, dismissed: true } : r);
  mem.sacraReminders = updated;
  const reminder = all.find((r: SacraReminder) => r.id === id);
  if (reminder) {
    addAuditEntry({ action: 'SACRA review reminder dismissed', detail: `${reminder.prisoner1Name} & ${reminder.prisoner2Name}`, unitId: reminder.unitId })
  }
  // Sync to backend
  api.dismissSacraReminder(id).catch(e => console.error('Failed to dismiss sacra reminder:', e));
}

export function dismissAllSacraReminders(unitId: UnitId): void {
  const mem = getDataCache();
  const all = mem.sacraReminders || [];
  const updated = all.map((r: SacraReminder) => r.unitId === unitId ? { ...r, dismissed: true } : r);
  mem.sacraReminders = updated;
  addAuditEntry({ action: 'All SACRA review reminders dismissed', detail: unitId, unitId })
  // Sync to backend
  api.dismissAllSacraReminders(unitId).catch(e => console.error('Failed to dismiss all sacra reminders:', e));
}

// ——— Notifications ———

export interface Notification {
  id: string
  type: 'prisoner_moved' | 'induction_complete' | 'info'
  title: string
  message: string
  prisonerName?: string
  prisonerCell?: string
  fromUnit?: string
  toUnit?: string
  timestamp: string
  dismissed: boolean
}

export async function loadNotifications(): Promise<Notification[]> {
  try {
    const notifications = await api.fetchNotifications();
    const mem = getDataCache();
    mem.notifications = notifications;
    return notifications;
  } catch (e) {
    console.error('Failed to load notifications:', e);
    const mem = getDataCache();
    return mem.notifications || [];
  }
}

export function getNotifications(): Notification[] {
  const mem = getDataCache();
  return mem.notifications || [];
}

export function getActiveNotifications(): Notification[] {
  return getNotifications().filter(n => !n.dismissed);
}

export function addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'dismissed'>): void {
  const mem = getDataCache();
  if (!mem.notifications) mem.notifications = [];
  const notifications = mem.notifications;
  const newNotification: Notification = {
    ...notification,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
    dismissed: false,
  }
  notifications.unshift(newNotification);
  // Keep only last 50 notifications
  mem.notifications = notifications.slice(0, 50);
  // Dispatch event for real-time updates
  window.dispatchEvent(new CustomEvent('notification-added', { detail: newNotification }))
  // Save to backend
  api.saveNotification(newNotification).catch(e => console.error('Failed to sync notification:', e));
}

export function dismissNotification(id: string): void {
  const mem = getDataCache();
  const notifications = mem.notifications || [];
  const updated = notifications.map((n: Notification) => n.id === id ? { ...n, dismissed: true } : n);
  mem.notifications = updated;
  // Sync to backend
  api.dismissNotification(id).catch(e => console.error('Failed to dismiss notification:', e));
}

export function clearAllNotifications(): void {
  const mem = getDataCache();
  mem.notifications = [];
  // Sync to backend
  api.clearNotifications().catch(e => console.error('Failed to clear notifications:', e));
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
  const mem = getDataCache();
  return (mem.prisoners || []).filter((p: Prisoner) => p.unitId === unitId)
}

export function getAllPrisoners(): Prisoner[] {
  const mem = getDataCache();
  return mem.prisoners || []
}

export function setPrisoners(unitId: UnitId, prisoners: Prisoner[]): void {
  const mem = getDataCache();
  const rest = (mem.prisoners || []).filter((p: Prisoner) => p.unitId !== unitId)
  mem.prisoners = [...rest, ...prisoners]
  updateCache()
}

export function savePrisoner(unitId: UnitId, prisoner: Prisoner): void {
  const list = getPrisoners(unitId)
  const idx = list.findIndex((p) => p.id === prisoner.id)
  const next = idx >= 0 ? list.map((p) => (p.id === prisoner.id ? prisoner : p)) : [...list, prisoner]
  setPrisoners(unitId, next)
  addAuditEntry({ action: 'Prisoner saved', detail: `${prisoner.name || prisoner.cell} (${prisoner.id})`, unitId })
  // Push to backend
  api.savePrisoner(prisoner).catch(e => console.error('Failed to sync prisoner:', e));
}

export function deletePrisoner(unitId: UnitId, prisonerId: string): void {
  const list = getPrisoners(unitId).filter((p) => p.id !== prisonerId)
  setPrisoners(unitId, list)
  addAuditEntry({ action: 'Prisoner deleted', detail: prisonerId, unitId })
}

/** Replace all prisoners in the system (e.g. for loading mock data). */
export function replaceAllPrisoners(prisoners: Prisoner[]): void {
  const mem = getDataCache();
  mem.prisoners = prisoners
  updateCache()
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
  const mem = getDataCache();
  return mem.handovers?.[unitId]?.[date] ?? {}
}

export function setHandover(unitId: UnitId, date: string, data: HandoverSection): void {
  const mem = getDataCache();
  if (!mem.handovers) mem.handovers = {};
  if (!mem.handovers[unitId]) mem.handovers[unitId] = {};
  mem.handovers[unitId][date] = data
  updateCache()
  // Push to backend
  const payload = { ...data, unitId, date, id: `${unitId}-${date}` };
  api.saveHandover(payload).catch(e => console.error('Failed to sync handover:', e));
}

// ——— Daily tasks ———

export function getDailyTasks(unitId: UnitId, date: string): DailyTask[] {
  const mem = getDataCache();
  return (mem.dailyTasks || []).filter((t: DailyTask) => t.unitId === unitId && t.date === date)
}

export function ensureDailyTasks(unitId: UnitId, date: string): DailyTask[] {
  // First, deduplicate any existing tasks in memory to prevent React key warnings
  const mem = getDataCache();
  if (mem.dailyTasks && mem.dailyTasks.length > 0) {
    const taskMap = new Map();
    for (const t of mem.dailyTasks) {
      if (!taskMap.has(t.id)) {
        taskMap.set(t.id, t);
      }
    }
    mem.dailyTasks = Array.from(taskMap.values());
  }
  
  let tasks = getDailyTasks(unitId, date)
  if (tasks.length === 0) {
    // No tasks exist - create all from scratch
    tasks = DAILY_TASK_LABELS.map((label, i) => ({
      id: `task-${unitId}-${date}-${i}`,
      label,
      done: false,
      unitId: unitId as any,
      date,
    }))
    const rest = (mem.dailyTasks || []).filter((t: DailyTask) => !(t.unitId === unitId && t.date === date))
    mem.dailyTasks = [...rest, ...tasks]
    updateCache()
  } else {
    // Tasks exist - check if any new labels need to be added
    const existingLabels = new Set(tasks.map(t => t.label))
    const existingIds = new Set(tasks.map(t => t.id))
    const newTasks = DAILY_TASK_LABELS
      .filter(label => !existingLabels.has(label))
      .map((label, i) => {
        // Find an unused index
        let idx = 0;
        while (existingIds.has(`task-${unitId}-${date}-${idx}`)) {
          idx++;
        }
        existingIds.add(`task-${unitId}-${date}-${idx}`);
        return {
          id: `task-${unitId}-${date}-${idx}`,
          label,
          done: false,
          unitId: unitId as any,
          date,
        };
      })
    if (newTasks.length > 0) {
      const rest = (mem.dailyTasks || []).filter((t: DailyTask) => !(t.unitId === unitId && t.date === date))
      tasks = [...tasks, ...newTasks]
      mem.dailyTasks = [...rest, ...tasks]
      updateCache()
    }
  }
  return tasks
}

export function toggleDailyTask(taskId: string): void {
  const mem = getDataCache();
  const all = mem.dailyTasks || [];
  const updated = all.map((t: DailyTask) => (t.id === taskId ? { ...t, done: !t.done } : t))
  mem.dailyTasks = updated
  updateCache()
  // Push to backend - save (POST) to create or update
  const task = updated.find((t: DailyTask) => t.id === taskId);
  if (task) {
    // Use saveTask (POST) which works for both create and update
    api.saveTask(task).catch(e => console.error('Failed to save task:', e));
  }
}

// ——— Muster confirmation ———

export function getMusterConfirmation(unitId: UnitId, date: string): MusterConfirmation | null {
  const mem = getDataCache();
  return (mem.musterConfirmations || []).find((m: MusterConfirmation) => m.unitId === unitId && m.date === date) ?? null
}

export function setMusterConfirmation(unitId: UnitId, date: string, data: Partial<MusterConfirmation>): void {
  const mem = getDataCache();
  if (!mem.musterConfirmations) mem.musterConfirmations = [];
  const all = mem.musterConfirmations;
  const rest = all.filter((m: MusterConfirmation) => !(m.unitId === unitId && m.date === date))
  const existing = all.find((m: MusterConfirmation) => m.unitId === unitId && m.date === date)
  const next: MusterConfirmation = {
    unitId,
    date,
    unlock: data.unlock ?? existing?.unlock ?? false,
    random: data.random ?? existing?.random ?? false,
    lockup: data.lockup ?? existing?.lockup ?? false,
    totalMustered: data.totalMustered ?? existing?.totalMustered,
    musterdBy: data.musterdBy ?? existing?.musterdBy,
  }
  mem.musterConfirmations = [...rest, next]
  updateCache()
  // Push to backend
  api.saveMuster(next).catch(e => console.error('Failed to sync muster:', e));
}

// ——— Cell alarms (weekly) ———

export function getCellAlarms(unitId: UnitId): CellAlarm[] {
  const mem = getDataCache();
  return (mem.cellAlarms || []).filter((a: CellAlarm) => a.unitId === unitId && a.weekKey === weekKey())
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
  const mem = getDataCache();
  const rest = (mem.cellAlarms || []).filter((a: CellAlarm) => !(a.unitId === unitId && a.weekKey === wk))
  mem.cellAlarms = [...rest, ...alarms]
  updateCache()
  return getCellAlarms(unitId)
}

export function toggleCellAlarm(alarmId: string): void {
  const mem = getDataCache();
  const all = mem.cellAlarms || [];
  const updated = all.map((a: CellAlarm) =>
    a.id === alarmId ? { ...a, checked: !a.checked, checkedAt: new Date().toISOString() } : a
  )
  mem.cellAlarms = updated
  updateCache()
  // Push to backend
  const alarm = updated.find((a: CellAlarm) => a.id === alarmId);
  if (alarm) {
    api.updateAlarm(alarm.id, alarm).catch(() => {
      api.saveAlarm(alarm).catch(e => console.error('Failed to sync alarm:', e));
    }).catch(e => console.error('Failed to sync alarm:', e));
  }
}

// ——— Random searches ———

export function getSearchTargets(unitId: UnitId, date: string): SearchTarget[] {
  const mem = getDataCache();
  return (mem.searchTargets || []).filter((s: SearchTarget) => s.unitId === unitId && s.date === date)
}

export function generateSearches(unitId: UnitId, date: string, cells: string[], facilities?: string[]): SearchTarget[] {
  const cellsCopy = [...cells].filter(Boolean)
  const facilitiesList = facilities && facilities.length > 0 ? facilities : ['GYM', 'LIBRARY', 'CHAPEL', 'PROGRAMMES', 'VISITS']
  const shuffle = <T,>(arr: T[]): T[] => {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]]
    }
    return a
  }
  const threeCells = shuffle(cellsCopy).slice(0, 3)
  const twoFacilities = shuffle(facilitiesList).slice(0, 2)
  const targets: SearchTarget[] = [
    ...threeCells.map((value) => ({ type: 'cell' as const, value, unitId, date })),
    ...twoFacilities.map((value) => ({ type: 'facility' as const, value, unitId, date })),
  ]
  const mem = getDataCache();
  const rest = (mem.searchTargets || []).filter((s: SearchTarget) => !(s.unitId === unitId && s.date === date))
  mem.searchTargets = [...rest, ...targets]
  updateCache()
  // Push to backend
  api.saveSearches(unitId, date, targets).catch(e => console.error('Failed to sync searches:', e));
  return targets
}

// ——— Clear / reset search targets ———

export function clearSearchTargetsForUnitDate(unitId: UnitId, date: string): void {
  const mem = getDataCache();
  const all = mem.searchTargets || [];
  const rest = all.filter((s: SearchTarget) => !(s.unitId === unitId && s.date === date))
  mem.searchTargets = rest
  updateCache()
  api.deleteSearches(unitId, date).catch(e => console.error('Failed to delete searches:', e));
}

export function clearSearchTargetsForDate(date: string): void {
  const mem = getDataCache();
  const all = mem.searchTargets || [];
  const rest = all.filter((s: SearchTarget) => s.date !== date)
  mem.searchTargets = rest
  updateCache()
}

// ——— Strip search ———

export function getStripSearch(unitId: UnitId, date: string): StripSearchRecord | null {
  const mem = getDataCache();
  return mem.stripSearches?.[unitId]?.[date] ?? null
}

export function setStripSearch(
  unitId: UnitId,
  date: string,
  data: { performed: boolean; prisonerIds: string[] }
): void {
  const mem = getDataCache();
  if (!mem.stripSearches) mem.stripSearches = {};
  if (!mem.stripSearches[unitId]) mem.stripSearches[unitId] = {};
  mem.stripSearches[unitId][date] = { unitId, date, performed: data.performed, prisonerIds: data.prisonerIds || [] }
  updateCache()
  // Push to backend
  api.saveStripSearch({ unitId, date, performed: data.performed, prisonerIds: data.prisonerIds || [] }).catch(e => console.error('Failed to sync strip search:', e));
}

// ——— Audit ———

export function getAuditEntries(): AuditEntry[] {
  return auditEntries
}

export function addAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
  const newEntry: AuditEntry = {
    ...entry,
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    timestamp: new Date().toISOString(),
  }
  auditEntries.unshift(newEntry)
  // Keep only last 1000 entries in memory
  if (auditEntries.length > 1000) {
    auditEntries = auditEntries.slice(0, 1000)
  }
  // Push to backend
  api.saveAuditEntry(entry).catch(e => console.error('Failed to sync audit entry:', e));
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
  const tasks = getDailyTasks(unitId, date)
  return tasks.filter((t) => !t.done).length
}

export function unitsWithIncompleteTasksForPrison(prisonId: string, date: string) {
  const units = getUnitsForPrison(prisonId)
  return units.map((u) => ({ unitId: u.id, incomplete: countIncompleteDailyTasks(u.id as any, date) })).filter((x) => x.incomplete > 0)
}

export function unitsWithIncompleteTasksForAll(date: string) {
  return UNITS.map((u) => ({ unitId: u.id, incomplete: countIncompleteDailyTasks(u.id as any, date) })).filter((x) => x.incomplete > 0)
}

/** Reset daily tasks only for units belonging to a given prison (does NOT touch handover). */
export function resetDailyTasksForPrison(prisonId: string, date: string) {
  const units = getUnitsForPrison(prisonId)
  const unitIds = new Set(units.map((u) => u.id))
  
  const mem = getDataCache();
  
  // Reset daily tasks
  const all = mem.dailyTasks || [];
  const updated = all.map((t: DailyTask) => (t.date === date && unitIds.has(t.unitId) ? { ...t, done: false } : t))
  mem.dailyTasks = updated
  updateCache()
  
  // Reset prisoner locations and meals
  const allPrisoners = (mem.prisoners || []).map((p: Prisoner) =>
    unitIds.has(p.unitId)
      ? { ...p, location: 'CELL' as const, mealBreakfast: false, mealLunch: false, mealDinner: false }
      : p
  )
  mem.prisoners = allPrisoners
  updateCache()
  
  // Clear muster confirmations
  for (const u of units) {
    setMusterConfirmation(u.id as any, date, { unlock: false, random: false, lockup: false })
  }
  
  // Clear generated daily searches
  for (const u of units) {
    clearSearchTargetsForUnitDate(u.id as any, date)
  }
  
  addAuditEntry({ action: 'Daily tasks reset (prison)', detail: `Reset tasks, prisoner locations and meals for ${prisonId} ${date}` })
}

export function runSelfCheck() {
  const issues: string[] = []
  const mem = getDataCache();
  
  // Check data is loaded
  if (!mem.prisoners || mem.prisoners.length === 0) {
    issues.push('No prisoners loaded - data may not be synced')
  }
  
  // Detect duplicate prisoner IDs
  if (mem.prisoners) {
    const ids = new Set<string>()
    for (const p of mem.prisoners) {
      if (ids.has(p.id)) issues.push(`Duplicate prisoner id ${p.id}`)
      ids.add(p.id)
    }
  }
  
  return issues
}

// ——— Control handover (global) ———

export async function loadControlHandover(date: string): Promise<any> {
  try {
    const handover = await api.fetchControlHandover(date);
    const mem = getDataCache();
    if (!mem.controlHandover) mem.controlHandover = {};
    mem.controlHandover[date] = handover;
    return handover;
  } catch (e) {
    console.error('Failed to load control handover:', e);
    const mem = getDataCache();
    return mem.controlHandover?.[date] || { date };
  }
}

export function getControlHandover(date: string) {
  const mem = getDataCache();
  return mem.controlHandover?.[date] ?? { date }
}

export function setControlHandover(date: string, data: { general?: string; visits?: string; other?: string }) {
  const mem = getDataCache();
  if (!mem.controlHandover) mem.controlHandover = {};
  const existing = mem.controlHandover[date] || {}
  const next = { 
    date, 
    general: data.general ?? existing?.general, 
    visits: data.visits ?? existing?.visits, 
    other: data.other ?? existing?.other 
  }
  mem.controlHandover[date] = next
  addAuditEntry({ action: 'Control handover updated', detail: date })
  // Push to backend
  api.saveControlHandover(next).catch(e => console.error('Failed to sync control handover:', e));
}

// ——— Hub snapshots (per-unit, per-date) ———
// Note: Hub snapshots are computed on-demand, not stored persistently

export function saveHubSnapshot(unitId: UnitId, date: string) {
  // Hub snapshots are for export/backup - we compute on demand
  addAuditEntry({ action: 'Hub snapshot saved', detail: `${unitId} ${date}`, unitId })
}

export function getHubSnapshot(unitId: UnitId, date: string) {
  return {
    date,
    tasks: getDailyTasks(unitId, date),
    muster: getMusterConfirmation(unitId, date),
    alarms: getCellAlarms(unitId),
    handover: getHandover(unitId, date),
    stripSearch: getStripSearch(unitId, date),
    searches: getSearchTargets(unitId, date),
    prisoners: getPrisoners(unitId),
  }
}

export function listHubSnapshots(unitId: UnitId): string[] {
  const mem = getDataCache();
  // Return dates that have data
  const dates = new Set<string>()
  for (const t of mem.dailyTasks || []) {
    if (t.unitId === unitId) dates.add(t.date)
  }
  return Array.from(dates).sort((a, b) => (a < b ? 1 : -1))
}

// ——— Reset daily tasks for all units (does NOT touch handover) ———

export function resetDailyTasksForDate(date: string) {
  // Save a snapshot for each unit before resetting
  for (const u of UNITS) {
    saveHubSnapshot(u.id, date)
  }
  
  const mem = getDataCache();
  
  // Reset daily tasks
  const all = mem.dailyTasks || [];
  const updated = all.map((t: DailyTask) => (t.date === date ? { ...t, done: false } : t))
  mem.dailyTasks = updated
  updateCache()
  
  // Reset prisoner locations and meal checkboxes
  const resetPrisoners = (mem.prisoners || []).map((p: Prisoner) => ({
    ...p,
    location: 'CELL' as const,
    mealBreakfast: false,
    mealLunch: false,
    mealDinner: false,
  }))
  mem.prisoners = resetPrisoners
  updateCache()
  
  // Clear muster confirmations for all units
  for (const u of UNITS) {
    setMusterConfirmation(u.id as any, date, { unlock: false, random: false, lockup: false })
  }
  
  // Clear generated daily searches
  clearSearchTargetsForDate(date)
  
  addAuditEntry({ action: 'Daily tasks reset', detail: `Reset tasks, prisoner locations and meals for ${date}` })
}

/**
 * Initialize template hubs for a given prison.
 */
export function initializeTemplateHubsForPrison(prisonId: string, date?: string): string[] {
  const d = date ?? today()
  const units = getUnitsForPrison(prisonId)
  const initialized: string[] = []
  
  for (const u of units) {
    ensureDailyTasks(u.id as any, d)
    initialized.push(u.id)
  }
  
  addAuditEntry({ action: 'Initialized template hubs', detail: `${prisonId} (${initialized.length} units)` })
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

// ——— Unit Maintenance ———

export function getUnitMaintenanceEntries(unitId?: UnitId): UnitMaintenanceEntry[] {
  const mem = getDataCache();
  if (unitId) {
    return (mem.unitMaintenance || []).filter((e: UnitMaintenanceEntry) => e.unitId === unitId)
  }
  return mem.unitMaintenance || []
}

export function addUnitMaintenanceEntry(
  unitId: UnitId,
  prisonId: string | undefined,
  jobDescription: string,
  jobNumber: string,
  priority: 'Routine' | 'Urgent' | 'Other',
  addedBy: string
): UnitMaintenanceEntry {
  const entry: UnitMaintenanceEntry = {
    id: `maint-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    unitId,
    prisonId,
    jobDescription,
    jobNumber,
    priority,
    status: 'Logged',
    addedBy,
    addedAt: new Date().toISOString(),
    date: today(),
  }
  const mem = getDataCache();
  if (!mem.unitMaintenance) mem.unitMaintenance = [];
  mem.unitMaintenance.unshift(entry)
  updateCache()
  addAuditEntry({ action: 'Maintenance entry added', detail: `${jobNumber} - ${jobDescription}`, unitId })
  // Push to backend
  api.saveMaintenance(entry).catch(e => console.error('Failed to sync maintenance entry:', e));
  return entry
}

export function deleteUnitMaintenanceEntry(entryId: string): void {
  const mem = getDataCache();
  const all = mem.unitMaintenance || [];
  const entry = all.find((e: UnitMaintenanceEntry) => e.id === entryId)
  const updated = all.filter((e: UnitMaintenanceEntry) => e.id !== entryId)
  mem.unitMaintenance = updated
  updateCache()
  if (entry) {
    addAuditEntry({ action: 'Maintenance entry deleted', detail: `${entry.jobNumber} - ${entry.jobDescription}`, unitId: entry.unitId })
  }
  // Push delete to backend
  api.deleteMaintenance(entryId).catch(e => console.error('Failed to sync maintenance delete:', e));
}

export function updateMaintenanceStatus(entryId: string, status: 'Logged' | 'Completed'): void {
  const mem = getDataCache();
  const all = mem.unitMaintenance || [];
  const updated = all.map((e: UnitMaintenanceEntry) => (e.id === entryId ? { ...e, status } : e))
  mem.unitMaintenance = updated
  updateCache()
  const entry = all.find((e: UnitMaintenanceEntry) => e.id === entryId)
  if (entry) {
    addAuditEntry({ action: `Maintenance ${status.toLowerCase()}`, detail: `${entry.jobNumber} - ${entry.jobDescription}`, unitId: entry.unitId })
  }
  // Push update to backend
  const entryToUpdate = all.find((e: UnitMaintenanceEntry) => e.id === entryId);
  if (entryToUpdate) {
    api.updateMaintenance(entryId, { ...entryToUpdate, status }).catch(e => console.error('Failed to sync maintenance update:', e));
  }
}

// ——— Prisoner Induction ———

export function getPrisonerInductions(unitId?: UnitId): PrisonerInduction[] {
  const mem = getDataCache();
  if (unitId) {
    return (mem.prisonerInductions || []).filter((e: PrisonerInduction) => e.unitId === unitId)
  }
  return mem.prisonerInductions || []
}

export function addPrisonerInduction(
  unitId: UnitId,
  prisonId: string | undefined,
  prisonerName: string,
  prisonerCell: string,
  laundryNumberAdded: boolean,
  addedToJobsList: boolean,
  sacraCompleted: boolean,
  documentName: string | undefined,
  inductedBy: string,
  inductionNotes?: string
): PrisonerInduction {
  const entry: PrisonerInduction = {
    id: `induction-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    unitId,
    prisonId,
    prisonerName,
    prisonerCell,
    laundryNumberAdded,
    addedToJobsList,
    sacraCompleted,
    documentName,
    inductionNotes,
    inductedBy,
    inductedAt: new Date().toISOString(),
    date: today(),
    pcoNotified: false,
  }
  const mem = getDataCache();
  if (!mem.prisonerInductions) mem.prisonerInductions = [];
  mem.prisonerInductions.unshift(entry)
  updateCache()
  addAuditEntry({ action: 'Prisoner inducted', detail: `${prisonerName || prisonerCell} - ${unitId}`, unitId })
  // Push to backend
  api.saveInduction(entry).catch(e => console.error('Failed to sync induction:', e));
  return entry
}

export function notifyPCOForInduction(entryId: string): void {
  const mem = getDataCache();
  const all = mem.prisonerInductions || [];
  const entry = all.find((e: PrisonerInduction) => e.id === entryId)
  const updated = all.map((e: PrisonerInduction) => (e.id === entryId ? { ...e, pcoNotified: true } : e))
  mem.prisonerInductions = updated
  updateCache()
  if (entry) {
    addAuditEntry({ action: 'PCO notified of induction', detail: `${entry.prisonerName || entry.prisonerCell} - ${entry.unitId}`, unitId: entry.unitId })
  }
  // Push to backend
  api.updateInduction(entryId, { pcoNotified: true }).catch(e => console.error('Failed to sync induction update:', e));
}

// Get prisoners pending PCO notification (from prisoner data, not induction records)
export function getPrisonersPendingInductionNotification(unitId: UnitId): { prisoner: Prisoner; id: string }[] {
  const prisoners = getPrisoners(unitId)
  return prisoners
    .filter((p) => p.laundryNumberAdded && p.addedToJobsList && !p.pcoNotified)
    .map((p) => ({ prisoner: p, id: p.id }))
}

export function markPrisonerInductionNotified(prisonerId: string, unitId: UnitId): void {
  const mem = getDataCache();
  const prisoners = mem.prisoners || [];
  const updated = prisoners.map((p: Prisoner) => 
    p.id === prisonerId && p.unitId === unitId ? { ...p, pcoNotified: true } : p
  )
  mem.prisoners = updated
  updateCache()
  const p = prisoners.find((p: Prisoner) => p.id === prisonerId)
  if (p) {
    addAuditEntry({ action: 'PCO notified of induction', detail: `${p.name || p.cell} - ${unitId}`, unitId })
  }
  // Push to backend
  api.updatePrisoner(prisonerId, { pcoNotified: true }).catch(e => console.error('Failed to sync prisoner update:', e));
}

// Get prisoners who were just moved to this unit and need move acknowledgment
export function getPrisonersPendingMoveNotification(unitId: UnitId): Prisoner[] {
  const prisoners = getPrisoners(unitId)
  return prisoners.filter((p) => !p.moveToUnitNotified)
}

// Mark a prisoner as having their move acknowledged (notified to unit)
export function markPrisonerMoveNotified(prisonerId: string, unitId: UnitId): void {
  const mem = getDataCache();
  const prisoners = mem.prisoners || [];
  const updated = prisoners.map((p: Prisoner) => 
    p.id === prisonerId && p.unitId === unitId ? { ...p, moveToUnitNotified: true } : p
  )
  mem.prisoners = updated
  updateCache()
  const p = prisoners.find((p: Prisoner) => p.id === prisonerId)
  if (p) {
    addAuditEntry({ action: 'Unit notified of prisoner arrival', detail: `${p.name || p.cell} - ${unitId}`, unitId })
  }
  // Push to backend
  api.updatePrisoner(prisonerId, { moveToUnitNotified: true }).catch(e => console.error('Failed to sync prisoner update:', e));
}

// Export function to load all data from backend
export async function loadAllDataFromBackend() {
  try {
    const data = await api.fetchAllData();
    const mem = getDataCache();
    mem.prisoners = data.prisoners || [];
    // Deduplicate dailyTasks by ID
    const taskMap = new Map();
    for (const t of data.dailyTasks || []) {
      taskMap.set(t.id, t);
    }
    mem.dailyTasks = Array.from(taskMap.values());
    mem.musterConfirmations = data.musterConfirmations || [];
    mem.cellAlarms = data.cellAlarms || [];
    mem.unitMaintenance = data.unitMaintenance || [];
    mem.prisonerInductions = data.prisonerInductions || [];
    
    // Convert handovers array to nested object
    const handoverObj: Record<string, Record<string, any>> = {};
    for (const h of data.handovers || []) {
      if (!handoverObj[h.unitId]) handoverObj[h.unitId] = {};
      handoverObj[h.unitId][h.date] = h;
    }
    mem.handovers = handoverObj;
    
    mem.searchTargets = data.searchTargets || [];
    
    // Convert strip searches
    const stripObj: Record<string, Record<string, any>> = {};
    for (const s of data.stripSearches || []) {
      if (!stripObj[s.unitId]) stripObj[s.unitId] = {};
      stripObj[s.unitId][s.date] = s;
    }
    mem.stripSearches = stripObj;
    
    // Dispatch event to notify components
    window.dispatchEvent(new CustomEvent('data-synced', { detail: data }));
    return true;
  } catch (e) {
    console.error('Failed to load data from backend:', e);
    return false;
  }
}
