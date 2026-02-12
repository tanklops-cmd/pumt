/**
 * Opens a new window with the given HTML and triggers print (A4 portrait).
 */
export function openPrintWindow(html: string, title: string): void {
  const w = window.open('', '_blank')
  if (!w) {
    alert('Please allow pop-ups to print.')
    return
  }
  w.document.write(html)
  w.document.close()
  w.document.title = title
  w.focus()
  w.onload = () => {
    w.print()
    w.onafterprint = () => w.close()
  }
}

/**
 * Opens a new window with the given HTML for print preview. User can review then click Print.
 * Does not auto-trigger print.
 */
export function openPrintPreviewWindow(html: string, title: string): void {
  const w = window.open('', '_blank')
  if (!w) {
    alert('Please allow pop-ups to print.')
    return
  }
  const printBar = '<style>@media print{[data-no-print]{display:none!important}}</style><div data-no-print style="background:#e2e8f0;padding:12px 16px;margin-bottom:16px;border-radius:8px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;"><strong>Print preview — review below, then click Print</strong><button onclick="window.print()" style="padding:8px 20px;background:#197d92;color:white;border:none;border-radius:6px;font-weight:600;cursor:pointer;font-size:14px;">Print</button></div>'
  const withPrintButton = html.replace('<body class="page">', '<body class="page">' + printBar)
  w.document.write(withPrintButton)
  w.document.close()
  w.document.title = title
  w.focus()
}

const A4_STYLE = `
  @media print { @page { size: A4 portrait; margin: 12mm; } }
  * { box-sizing: border-box; }
  body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial; font-size: 9pt; line-height: 1.2; color: #0f172a; margin: 0; padding: 0; }
  .page { max-width: 100%; padding: 0; }
  h1 { font-size: 14pt; margin: 0 0 6pt; color: #0b7470; border-bottom: 1px solid #0b7470; padding-bottom: 3pt; }
  h2 { font-size: 11pt; margin: 8pt 0 4pt; color: #243449; }
  .section { margin-bottom: 10pt; break-inside: avoid; }
  .section-title { font-weight: 700; font-size: 9pt; color: #334155; margin-bottom: 3pt; }
  .section-body { white-space: pre-wrap; margin: 0; padding: 4pt 0; border-bottom: 1px solid #e6eef0; }
  .section-body:empty::after { content: "—"; color: #94a3b8; }
  .muster-total { font-size: 18pt; font-weight: 700; text-align: left; color: #0b7470; margin: 6pt 0 8pt; }
  table { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin: 6pt 0; table-layout: fixed; }
  th, td { border: 1px solid #d2dbe0; padding: 2pt 4pt; text-align: left; overflow-wrap: anywhere; word-wrap: break-word; color: #0f172a; }
  th { background: #0b7470; color: white; font-weight: 600; font-size: 8.5pt; }
  tr:nth-child(even) { background: #fbfcfd; }
  td { min-width: 0; }
  thead { display: table-header-group; }
  tbody { display: table-row-group; }
  .work-party { margin-top: 10pt; padding-top: 6pt; border-top: 1px solid #0b7470; }
  .work-party h2 { margin-top: 0; }
  .work-party-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 6pt 12pt; }
  .work-party-item { font-size: 9pt; }
  .date-line { font-size: 9pt; color: #475569; margin-bottom: 8pt; }
  @media print { h1, h2 { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
`

const LOCATION_LABELS: Record<string, string> = {
  CELL: 'Cell',
  YARD: 'Yard',
  MEDICAL: 'Medical',
  COURT: 'Court',
  VISITS: 'Visits',
  PROGRAMMES: 'Programmes',
  WORK: 'Work',
  OTHER: 'Other',
}

export interface HandoverPrintData {
  unitName: string
  date: string
  standingOrders?: string
  medicalNotes?: string
  peopleOffPrivileges?: string
  confinement?: string
}

export function buildHandoverPrintHtml(data: HandoverPrintData): string {
  const { unitName, date, standingOrders, medicalNotes, peopleOffPrivileges, confinement } = data
  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${A4_STYLE}</style></head><body class="page">
    <h1>${escapeHtml(unitName)} — Handover</h1>
    <p class="date-line">${escapeHtml(dateFormatted)}</p>
    <div class="section">
      <div class="section-title">Standing orders</div>
      <div class="section-body">${escapeHtml(standingOrders ?? '')}</div>
    </div>
    <div class="section">
      <div class="section-title">Medical notes</div>
      <div class="section-body">${escapeHtml(medicalNotes ?? '')}</div>
    </div>
    <div class="section">
      <div class="section-title">People off privileges</div>
      <div class="section-body">${escapeHtml(peopleOffPrivileges ?? '')}</div>
    </div>
    <div class="section">
      <div class="section-title">Confinement</div>
      <div class="section-body">${escapeHtml(confinement ?? '')}</div>
    </div>
  </body></html>`
}

export interface LocationRecord {
  location: string
  from: string
  to?: string
}

/** Returns accumulated hours per location (excluding CELL) for a prisoner, and current location. */
export function getOutOfUnitHours(
  locationHistory: LocationRecord[],
  currentLocation: string
): { summary: string; currentLabel: string } {
  const now = new Date().getTime()
  const byLoc: Record<string, number> = {}
  for (const r of locationHistory || []) {
    if (r.location === 'CELL') continue
    const start = new Date(r.from).getTime()
    const end = r.to ? new Date(r.to).getTime() : now
    const hours = Math.max(0, (end - start) / (1000 * 60 * 60))
    if (hours > 0) byLoc[r.location] = (byLoc[r.location] || 0) + hours
  }
  const parts = Object.entries(byLoc)
    .sort((a, b) => b[1] - a[1])
    .map(([loc, h]) => `${roundHalf(h)}h ${LOCATION_LABELS[loc] || loc}`)
  const summary = parts.length ? parts.join(', ') : '—'
  const currentLabel = LOCATION_LABELS[currentLocation] || currentLocation || '—'
  return { summary, currentLabel }
}

function roundHalf(n: number): number {
  return Math.round(n * 2) / 2
}

export interface PrisonerPrintRow {
  name: string
  cell: string
  security: string
  job: string
  notes: string
  ops: string
  ccs: string
  ntdb: string
  hoursOut: string
  currentLocation: string
}

export interface MusterPrintData {
  unitName: string
  date: string
  total: number
  prisoners: PrisonerPrintRow[]
  workPartyTotals: { job: string; count: number }[]
}
export function buildMusterPrintHtml(data: MusterPrintData, options?: { singlePage?: boolean }): string {
  const { unitName, date, total, prisoners, workPartyTotals } = data
  const single = options?.singlePage ?? false
  const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  // Compact rows: combine flags into a single cell to reduce column count and width
  const rows = prisoners
    .map((p) => {
      const flags = [p.ops ? 'O' : '', p.ccs ? 'C' : '', p.ntdb ? 'N' : '']
        .filter(Boolean)
        .join('')
      if (single) {
        return `<tr>
          <td>${escapeHtml(p.name)}</td>
          <td style="text-align:center">${escapeHtml(p.cell)}</td>
          <td style="text-align:center">${escapeHtml(p.security)}</td>
          <td style="text-align:center">${escapeHtml(flags)}</td>
          <td style="text-align:center">${escapeHtml(p.hoursOut)}</td>
          <td>${escapeHtml(p.currentLocation)}</td>
        </tr>`
      }
      return `<tr>
          <td>${escapeHtml(p.name)}</td>
          <td>${escapeHtml(p.cell)}</td>
          <td>${escapeHtml(p.security)}</td>
          <td>${escapeHtml(p.job)}</td>
          <td style="text-align:center">${escapeHtml(flags)}</td>
          <td>${escapeHtml(p.hoursOut)}</td>
          <td>${escapeHtml(p.currentLocation)}</td>
        </tr>`
    })
    .join('')
  const workPartyHtml =
    workPartyTotals.length > 0
      ? `
    <div class="work-party">
      <h2>Work party totals</h2>
      <div class="work-party-grid">
        ${workPartyTotals
          .map((w) => `<div class="work-party-item"><strong>${escapeHtml(w.job)}</strong>: ${w.count}</div>`)
          .join('')}
      </div>
    </div>`
      : ''
  // If single-page compact requested, use a tighter style override
  const compactStyle = single
    ? `
      @media print { @page { size: A4 portrait; margin: 6mm; } }
      body { font-size: 8pt; }
      th, td { padding: 1pt 3pt; font-size: 7.5pt }
      h1 { font-size: 12pt; }
      .muster-total { font-size: 12pt }
    `
    : ''

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${A4_STYLE}${compactStyle}</style></head><body class="page">
    <h1>${escapeHtml(unitName)} — Muster</h1>
    <p class="date-line">${escapeHtml(dateFormatted)}</p>
    <div class="muster-total">Muster total: ${total}</div>
    <table>
      <colgroup>
        ${single ? '<col style="width:36%"><col style="width:6%"><col style="width:6%"><col style="width:6%"><col style="width:10%"><col style="width:36%">' : '<col style="width:28%"><col style="width:8%"><col style="width:8%"><col style="width:18%"><col style="width:6%"><col style="width:12%"><col style="width:20%">'}
      </colgroup>
      <thead>
        <tr>
          ${single ? '<th>Name</th><th>Cell</th><th>Sec</th><th>F</th><th>Hrs</th><th>Location</th>' : '<th>Name</th><th>Cell</th><th>Sec</th><th>Job</th><th>F</th><th>Hours</th><th>Location</th>'}
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    ${single ? '' : workPartyHtml}
  </body></html>`
}

function escapeHtml(s: string): string {
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

