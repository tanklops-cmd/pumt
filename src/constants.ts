import type { Unit } from './types'

export const UNITS: Unit[] = [
  { id: 'north', name: 'North Unit', shortName: 'North' },
  { id: 'south', name: 'South Unit', shortName: 'South' },
  { id: 'remand', name: 'Remand Unit', shortName: 'Remand' },
  { id: 'centre', name: 'Centre Unit', shortName: 'Centre' },
]

export type Region = 'North Island' | 'South Island';

export const PRISONS: { id: string; name: string; shortName: string; region: Region }[] = [
  { id: 'invercargill', name: 'Invercargill Prison', shortName: 'Invercargill', region: 'South Island' },
  { id: 'ocf', name: 'OCF', shortName: 'OCF', region: 'South Island' },
  { id: 'christchurch-mens', name: 'Christchurch Mens Prison', shortName: 'Christchurch M', region: 'South Island' },
  { id: 'rolleston', name: 'Rolleston Prison', shortName: 'Rolleston', region: 'South Island' },
  { id: 'christchurch-womens', name: 'Christchurch Womens Prison', shortName: 'Christchurch W', region: 'South Island' },
  { id: 'rimutaka', name: 'Rimutaka Prison', shortName: 'Rimutaka', region: 'North Island' },
  { id: 'manawatu', name: 'Manawatu Prison', shortName: 'Manawatu', region: 'North Island' },
  { id: 'auckland', name: 'Auckland Prison', shortName: 'Auckland', region: 'North Island' },
  { id: 'mt-eden', name: 'Mt Eden', shortName: 'Mt Eden', region: 'North Island' },
  { id: 'auckland-womens', name: 'Auckland Womens Prison', shortName: 'Auckland W', region: 'North Island' },
  { id: 'spring-hill', name: 'Spring Hill Correctional Facility', shortName: 'Spring Hill', region: 'North Island' },
  { id: 'nrfc', name: 'NRFC', shortName: 'NRFC', region: 'North Island' },
]

export function getPrisonsByRegion() {
  const north = PRISONS.filter(p => p.region === 'North Island');
  const south = PRISONS.filter(p => p.region === 'South Island');
  return { 'North Island': north, 'South Island': south };
}

/**
 * Return a list of units for a given prison. Invercargill uses the legacy UNITS list.
 * Other prisons receive 12 placeholder units named Unit 1..12 with ids namespaced by prison id.
 * Each prison also has an ISU (Intensive Support Unit).
 */
export function getUnitsForPrison(prisonId: string) {
  const base = prisonId
  if (prisonId === 'invercargill') {
    // legacy units used by the app - add ISU at the beginning
    return [{ id: 'invercargill-isu', name: 'ISU', shortName: 'ISU' }, ...UNITS]
  }
  const units = [] as { id: string; name: string; shortName: string }[]
  // Add ISU (Intensive Support Unit) for each prison
  units.push({ id: `${base}-isu`, name: 'ISU', shortName: 'ISU' })
  for (let i = 1; i <= 12; i++) {
    const id = `${base}-unit-${i}`
    units.push({ id, name: `Unit ${i}`, shortName: `U${i}` })
  }
  return units
}

export const DAILY_TASK_LABELS = [
  'PTAT',
  'CARE Stats',
  'Visit Bookings',
  'Medication Rounds',
  'Unit Inspections',
  'Lockdown Check',
  'Handover Complete',
  'Hoffman Knife',
  'Cutdown Scissors',
]

/** Fixed job choices shown in the dropdown. */
export const JOB_OPTIONS = [
  { value: '', label: '—' },
  { value: 'Grounds', label: 'Grounds' },
  { value: 'Horticulture', label: 'Horticulture' },
  { value: 'Kitchen', label: 'Kitchen' },
  { value: 'Wing Orderly', label: 'Wing Orderly' },
  { value: 'Laundry', label: 'Laundry' },
  { value: 'Sewing Room', label: 'Sewing Room' },
  { value: '__OTHER__', label: 'Other (type below)' },
] as const

/** Sentinel value for "manual job entry" – not stored; user's typed text is stored as job. */
export const JOB_MANUAL_ENTRY = '__OTHER__'

/** Job values that are from the fixed list (not custom text). */
export const JOB_FIXED_VALUES = ['', 'Grounds', 'Horticulture', 'Kitchen', 'Wing Orderly', 'Laundry', 'Sewing Room'] as const

export const SECURITY_OPTIONS = ['UNCLASS', 'L1', 'L2', 'MIN', 'LOW', 'L/MED', 'MED', 'HIGH', 'MAX'] as const

export const CATEGORY_OPTIONS = [
  { value: '', label: '—' },
  { value: 'RMD/ACC', label: 'RMD/ACC' },
  { value: 'RMD/CONV', label: 'RMD/CONV' },
  { value: 'CONV', label: 'CONV' },
  { value: 'RECALL', label: 'RECALL' },
] as const

export const LOCATION_OPTIONS = [
  { value: 'CELL', label: 'Cell' },
  { value: 'YARD', label: 'Yard' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'COURT', label: 'Court' },
  { value: 'VISITS', label: 'Visits' },
  { value: 'PROGRAMMES', label: 'Programmes' },
  { value: 'WORK', label: 'Work' },
  { value: 'OTHER', label: 'Other' },
] as const

export const FACILITY_OPTIONS = [
  'Visits Room',
  'Medical Wing',
  'Programmes Block',
  'Kitchen',
  'Workshop A',
  'Workshop B',
  'Gym',
  'Library',
  'Yard Area',
  'Receiving Office',
]

// Admin password is read from the build environment. Do NOT hardcode secrets in source.
// Set `VITE_ADMIN_PASSWORD` when building (e.g. in `.env.production`). If empty, admin access is disabled.
export const ADMIN_PASSWORD = (import.meta.env?.VITE_ADMIN_PASSWORD as string) ?? ''
