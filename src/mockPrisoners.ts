import type { Prisoner, UnitId, SecurityClassification, LocationCode } from './types'

const FIRST_NAMES = [
  'James', 'John', 'Michael', 'David', 'Daniel', 'Matthew', 'Christopher', 'Andrew', 'Joshua', 'William',
  'Thomas', 'Joseph', 'Samuel', 'Benjamin', 'Ryan', 'Nathan', 'Luke', 'Tyler', 'Jacob', 'Ethan',
  'Liam', 'Noah', 'Oliver', 'Jack', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
  'Mason', 'Ethan', 'Logan', 'Jackson', 'Aiden', 'Owen', 'Samuel', 'Sebastian', 'Elijah', 'Caleb',
]

const SURNAMES = [
  'Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Garcia', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall',
  'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter',
  'Mitchell', 'Parker', 'Turner', 'Phillips', 'Campbell', 'Edwards', 'Evans', 'Stewart', 'Bell', 'Murphy',
  'Reed', 'Cook', 'Morgan', 'Cooper', 'Bailey', 'Rivera', 'Richardson', 'Cox', 'Howard', 'Ward',
]

const SECURITY_OPTIONS: SecurityClassification[] = ['UNCLASS', 'L1', 'L2', 'MIN', 'LOW', 'L/MED', 'MED', 'HIGH', 'MAX']
const SECURITY_WEIGHTS = [2, 5, 8, 10, 15, 20, 25, 10, 5] // more MED, L/MED, LOW

const JOBS = ['', 'Grounds', 'Horticulture', 'Kitchen', 'Wing Orderly', 'Laundry', 'Sewing Room', 'Workshop', 'Painting'] as const
const JOB_WEIGHTS = [25, 12, 15, 10, 8, 10, 8, 6, 6]

const LOCATIONS: LocationCode[] = ['CELL', 'CELL', 'CELL', 'CELL', 'CELL', 'YARD', 'WORK', 'MEDICAL', 'VISITS', 'PROGRAMMES', 'COURT', 'OTHER']
const NOTES_OPTIONS = ['', '', '', 'Medication', 'GP review', 'Counselling', 'Visits Tue/Thu', 'NTU', 'Seg', 'Release pending']

function pick<T>(arr: T[], weights?: number[]): T {
  if (weights && weights.length === arr.length) {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = Math.random() * total
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i]
      if (r <= 0) return arr[i]
    }
  }
  return arr[Math.floor(Math.random() * arr.length)]
}

function addHours(iso: string, hours: number): string {
  const d = new Date(iso)
  d.setTime(d.getTime() + hours * 60 * 60 * 1000)
  return d.toISOString()
}

/** Generate 190 mock prisoners distributed across units (North ~48, South ~48, Remand ~47, Centre ~47). */
export function generateMockPrisoners(): Prisoner[] {
  const units: UnitId[] = ['north', 'south', 'remand', 'centre']
  const counts = [48, 48, 47, 47]
  const prisoners: Prisoner[] = []
  let idx = 0

  const usedNames = new Set<string>()

  for (let u = 0; u < units.length; u++) {
    const unitId = units[u]
    const n = counts[u]
    const blocks = unitId === 'north' ? ['A', 'B', 'C'] : unitId === 'south' ? ['D', 'E', 'F'] : unitId === 'remand' ? ['G', 'H'] : ['J', 'K', 'L']
    const cellsPerBlock = Math.ceil(n / blocks.length)

    for (let i = 0; i < n; i++) {
      let name: string
      do {
        name = `${pick(FIRST_NAMES)} ${pick(SURNAMES)}`
      } while (usedNames.has(name))
      usedNames.add(name)

      const block = blocks[Math.floor(i / cellsPerBlock)]
      const cellNum = 100 + (i % cellsPerBlock) + Math.floor(i / cellsPerBlock) * 20
      const cell = `${block}-${cellNum}`

      const security = pick(SECURITY_OPTIONS, SECURITY_WEIGHTS)
      const job = pick([...JOBS], JOB_WEIGHTS)
      const notes = pick(NOTES_OPTIONS)
      const ops = Math.random() < 0.12
      const ccs = Math.random() < 0.15
      const ntdb = Math.random() < 0.08

      const location = pick(LOCATIONS)
      const locationHistory: { location: LocationCode; from: string; to?: string }[] = []
      if (location !== 'CELL' && Math.random() < 0.7) {
        const from = addHours(new Date().toISOString(), -Math.random() * 4 - 0.5)
        locationHistory.push({ location, from })
      } else if (location === 'CELL' && Math.random() < 0.25) {
        const loc = pick(['YARD', 'WORK', 'MEDICAL'] as LocationCode[])
        const hrs = Math.random() * 2 + 0.5
        const from = addHours(new Date().toISOString(), -hrs)
        const to = new Date().toISOString()
        locationHistory.push({ location: loc, from, to })
      }

      prisoners.push({
        id: `mock-${unitId}-${idx}`,
        name,
        cell,
        security,
        job: job || undefined,
        notes: notes || undefined,
        ops,
        ccs,
        ntdb,
        location,
        locationHistory,
        unitId,
      })
      idx++
    }
  }

  return prisoners
}
