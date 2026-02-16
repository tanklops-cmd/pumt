import type { Prisoner, UnitId, SecurityClassification, LocationCode } from './types'

const FIRST_NAMES = [
  'James', 'John', 'Michael', 'David', 'Daniel', 'Matthew', 'Christopher', 'Andrew', 'Joshua', 'William',
  'Thomas', 'Joseph', 'Samuel', 'Benjamin', 'Ryan', 'Nathan', 'Luke', 'Tyler', 'Jacob', 'Ethan',
  'Liam', 'Noah', 'Oliver', 'Jack', 'James', 'William', 'Benjamin', 'Lucas', 'Henry', 'Alexander',
  'Mason', 'Ethan', 'Logan', 'Jackson', 'Aiden', 'Owen', 'Samuel', 'Sebastian', 'Elijah', 'Caleb',
  'Anthony', 'Kevin', 'Jason', 'Brian', 'Mark', 'Paul', 'Steven', 'Timothy', 'Gary', 'Eric',
]

const SURNAMES = [
  'Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Garcia', 'Robinson', 'Clark', 'Lewis', 'Lee', 'Walker', 'Hall',
  'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams', 'Nelson', 'Carter',
  'Mitchell', 'Parker', 'Turner', 'Phillips', 'Campbell', 'Edwards', 'Evans', 'Stewart', 'Bell', 'Murphy',
  'Reed', 'Cook', 'Morgan', 'Cooper', 'Bailey', 'Rivera', 'Richardson', 'Cox', 'Howard', 'Ward',
]

const SECURITY_OPTIONS: SecurityClassification[] = ['UNCLASS', 'L1', 'L2', 'MIN', 'LOW', 'L/MED', 'MED', 'HIGH', 'MAX']
const SECURITY_WEIGHTS = [2, 5, 8, 10, 15, 20, 25, 10, 5]

const JOBS = ['', 'Grounds', 'Horticulture', 'Kitchen', 'Wing Orderly', 'Laundry', 'Sewing Room', 'Workshop', 'Painting'] as const
const JOB_WEIGHTS = [25, 12, 15, 10, 8, 10, 8, 6, 6]

const LOCATIONS: LocationCode[] = ['CELL', 'CELL', 'CELL', 'CELL', 'CELL', 'YARD', 'WORK', 'WORK', 'WORK', 'WORK', 'WORK', 'WORK', 'WORK', 'WORK', 'WORK', 'MEDICAL', 'MEDICAL', 'COURT', 'COURT', 'VISITS', 'PROGRAMMES', 'OTHER']

const SPECIAL_CATEGORIES: string[] = ['NTDB', 'CC', 'OP']

const NOTES_OPTIONS = [
  '', '', '', '', '',
  'Diabetic - insulin required',
  'Heart condition - regular monitoring',
  'Medication - morning/evening',
  'Doctor appointment pending',
  'Physical disability - wheelchair access',
  'Mental health - weekly review',
  'Vegetarian - special diet',
  'Halal diet required',
  'Allergic to penicillin',
  'Epilepsy - seizure risk',
  'Hearing impaired',
]

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

/**
 * Generate 190 mock prisoners:
 * - South: 60
 * - Centre: 60  
 * - North: 35 (remainder after 60+60=120, so 190-120=70... wait that's 70, let me recalculate)
 * - Remand: 35
 * 
 * Actually: 190 total
 * - South: 60
 * - Centre: 60
 * - North: 35
 * - Remand: 35
 * Total: 190 ✓
 */
export function generateMockPrisoners(): Prisoner[] {
  const units: UnitId[] = ['south', 'centre', 'north', 'remand']
  const counts = [60, 60, 35, 35]
  const prisoners: Prisoner[] = []
  let idx = 0

  const usedNames = new Set<string>()

  for (let u = 0; u < units.length; u++) {
    const unitId = units[u]
    const n = counts[u]
    
    // Define blocks for each unit
    const blocks = unitId === 'south' ? ['A', 'B', 'C', 'D'] : 
                   unitId === 'centre' ? ['E', 'F', 'G', 'H'] : 
                   unitId === 'north' ? ['J', 'K'] : ['L', 'M']
    
    const cellsPerBlock = 10 // Cells 1-10 per block
    const cellOccupancy: Record<string, number> = {} // Track occupancy per cell

    for (let i = 0; i < n; i++) {
      // Generate unique name
      let name: string
      do {
        name = `${pick(FIRST_NAMES)} ${pick(SURNAMES)}`
      } while (usedNames.has(name))
      usedNames.add(name)

      // Generate cell - blocks 1-4, cells 1-10, max 2 per cell
      let block: string
      let cellNum: number
      let cell: string
      let attempts = 0
      do {
        block = pick(blocks)
        // Find cells in this block that have less than 2 prisoners
        const cellsInBlock = Array.from({length: 10}, (_, i) => i + 1)
        const availableCells = cellsInBlock.filter(c => !cellOccupancy[`${block}-${c}`] || cellOccupancy[`${block}-${c}`] < 2)
        
        if (availableCells.length > 0) {
          cellNum = pick(availableCells)
        } else {
          cellNum = Math.floor(Math.random() * 10) + 1
        }
        cell = `${block}-${cellNum}`
        attempts++
      } while (cellOccupancy[cell] >= 2 && attempts < 5)
      
      // Increment cell occupancy
      cellOccupancy[cell] = (cellOccupancy[cell] || 0) + 1

      const security = pick(SECURITY_OPTIONS, SECURITY_WEIGHTS)
      const job = pick([...JOBS], JOB_WEIGHTS)
      const notes = pick(NOTES_OPTIONS)
      
      // Special categories: 1-5 prisoners randomly set to NTDB, CC, or OP
      const hasSpecialCategory = i < 5 && Math.random() < 0.3
      const specialCategory = hasSpecialCategory ? pick(SPECIAL_CATEGORIES) : null
      
      const ops = specialCategory === 'OP'
      const ccs = specialCategory === 'CC'
      const ntdb = specialCategory === 'NTDB'

      // Location: up to 10 at workplace, 2-3 at court/medical
      let location: LocationCode
      if (i < 10 && Math.random() < 0.15) {
        location = 'WORK' // Up to ~15% at work (roughly 10 per unit)
      } else if (i < 3 && Math.random() < 0.05) {
        location = 'COURT' // ~3 per unit at court
      } else if (i < 3 && Math.random() < 0.05) {
        location = 'MEDICAL' // ~3 per unit at medical
      } else {
        location = 'CELL'
      }

      const locationHistory: { location: LocationCode; from: string; to?: string }[] = []
      if (location !== 'CELL') {
        const from = addHours(new Date().toISOString(), -Math.random() * 8 - 1)
        locationHistory.push({ location, from })
      } else if (Math.random() < 0.2) {
        // Some prisoners recently moved
        const prevLoc = pick(['YARD', 'WORK', 'MEDICAL'] as LocationCode[])
        const hrs = Math.random() * 3 + 0.5
        const from = addHours(new Date().toISOString(), -hrs)
        const to = new Date().toISOString()
        locationHistory.push({ location: prevLoc, from, to })
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
