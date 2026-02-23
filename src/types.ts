export type UnitId = 'north' | 'south' | 'remand' | 'centre'

export interface Unit {
  id: UnitId
  name: string
  shortName: string
}

export type SecurityClassification = 'UNCLASS' | 'L1' | 'L2' | 'MIN' | 'LOW' | 'L/MED' | 'MED' | 'HIGH' | 'MAX'

export type JobType = 'Grounds' | 'Horticulture' | 'Kitchen' | 'Wing Orderly' | 'Laundry' | 'Sewing Room' | ''

export type LocationCode = 'CELL' | 'YARD' | 'MEDICAL' | 'COURT' | 'VISITS' | 'PROGRAMMES' | 'WORK' | 'OTHER'

export interface LocationRecord {
  location: LocationCode
  from: string // ISO time
  to?: string
}

export type PrisonerCategory = 'RMD/ACC' | 'RMD/CONV' | 'CONV' | 'RECALL' | ''

export interface Prisoner {
  id: string
  name: string
  cell: string
  security: SecurityClassification
  job?: JobType | string
  notes?: string
  ops?: boolean   // OPs active – display red when true
  ccs?: boolean   // CCs active – display red when true
  ntdb?: boolean // NTDB – highlight row/cell when true
  mealBreakfast?: boolean
  mealLunch?: boolean
  mealDinner?: boolean
  location: LocationCode
  locationHistory: LocationRecord[]
  unitId: UnitId
  // Category for muster display
  category?: PrisonerCategory
  // Protection flag
  protection?: boolean
  // Induction fields
  laundryNumberAdded?: boolean
  addedToJobsList?: boolean
  sacraCompleted?: boolean
  inductionDocumentName?: string
  inductionNotes?: string
  inductedBy?: string
  inductedAt?: string
  pcoNotified?: boolean
  // Move notification flag - set to false when prisoner arrives at new unit
  moveToUnitNotified?: boolean
}

export interface HandoverSection {
  standingOrders?: string
  medicalNotes?: string
  peopleOffPrivileges?: string
  confinement?: string
  // Unit staff on duty
  scoName?: string
  co1Name?: string
  co2Name?: string
  co3Name?: string
}

export interface DailyTask {
  id: string
  label: string
  done: boolean
  unitId: UnitId
  date: string
}

export interface MusterConfirmation {
  unlock: boolean
  random: boolean
  lockup: boolean
  // Muster details
  totalMustered?: number
  musterdBy?: string // Staff who performed muster (comma-separated from staff on duty)
  unitId: UnitId
  date: string
}

export interface CellAlarm {
  id: string
  cell: string
  weekKey: string
  checked: boolean
  checkedAt?: string
  unitId: UnitId
}

export interface SearchTarget {
  type: 'cell' | 'facility'
  value: string
  unitId: UnitId
  date: string
}

export interface StripSearchRecord {
  unitId: UnitId
  date: string
  performed: boolean
  prisonerIds: string[]
}

export interface AuditEntry {
  id: string
  timestamp: string
  action: string
  detail?: string
  unitId?: UnitId
  user?: string
  prisonerName?: string
  prisonerLocation?: LocationCode
}

export interface ControlHandover {
  date: string
  general?: string
  visits?: string
  other?: string
}

export type MaintenancePriority = 'Routine' | 'Urgent' | 'Other'

export type MaintenanceStatus = 'Logged' | 'Completed'

export interface UnitMaintenanceEntry {
  id: string
  unitId: UnitId
  prisonId?: string
  jobDescription: string
  jobNumber: string
  priority: MaintenancePriority
  status: MaintenanceStatus
  addedBy: string
  addedAt: string // ISO timestamp
  date: string // YYYY-MM-DD
}

export interface PrisonerInduction {
  id: string
  unitId: UnitId
  prisonId?: string
  prisonerName: string
  prisonerCell: string
  laundryNumberAdded: boolean
  addedToJobsList: boolean
  sacraCompleted: boolean
  documentName?: string // uploaded file name
  inductionNotes?: string // free text notes
  inductedBy: string
  inductedAt: string // ISO timestamp
  date: string // YYYY-MM-DD
  pcoNotified: boolean
}
