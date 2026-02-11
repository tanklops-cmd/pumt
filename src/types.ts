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
}

export interface HandoverSection {
  standingOrders?: string
  medicalNotes?: string
  peopleOffPrivileges?: string
  confinement?: string
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
}

export interface ControlHandover {
  date: string
  general?: string
  visits?: string
  other?: string
}
