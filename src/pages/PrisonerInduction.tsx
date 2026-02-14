import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../Layout'
import { UNITS, getUnitsForPrison } from '../constants'
import { getPrisonerInductions, addPrisonerInduction, notifyPCOForInduction } from '../store'
import type { UnitId } from '../types'

export default function PrisonerInduction() {
  const { prisonId, unitId } = useParams<{ prisonId?: string; unitId?: string }>()
  const id = (unitId ?? 'north') as UnitId
  const unitsToSearch = prisonId ? getUnitsForPrison(prisonId) : UNITS
  const unit = unitsToSearch.find((u) => u.id === id) ?? (UNITS.find((u) => u.id === id) ?? unitsToSearch[0])

  const [entries, setEntries] = useState(() => getPrisonerInductions(id))
  const [showForm, setShowForm] = useState(false)
  const [prisonerName, setPrisonerName] = useState('')
  const [prisonerCell, setPrisonerCell] = useState('')
  const [laundryNumberAdded, setLaundryNumberAdded] = useState(false)
  const [addedToJobsList, setAddedToJobsList] = useState(false)
  const [sacraCompleted, setSacraCompleted] = useState(false)
  const [documentName, setDocumentName] = useState('')
  const [inductionNotes, setInductionNotes] = useState('')
  const [useFileUpload, setUseFileUpload] = useState(false)
  const [inductedBy, setInductedBy] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!prisonerName.trim() || !prisonerCell.trim() || !inductedBy.trim()) {
      alert('Please fill in all required fields')
      return
    }
    addPrisonerInduction(
      id,
      prisonId,
      prisonerName,
      prisonerCell,
      laundryNumberAdded,
      addedToJobsList,
      sacraCompleted,
      documentName || undefined,
      inductedBy,
      useFileUpload ? undefined : inductionNotes
    )
    setEntries(getPrisonerInductions(id))
    // Reset form
    setPrisonerName('')
    setPrisonerCell('')
    setLaundryNumberAdded(false)
    setAddedToJobsList(false)
    setSacraCompleted(false)
    setDocumentName('')
    setInductionNotes('')
    setUseFileUpload(false)
    setInductedBy('')
    setShowForm(false)
  }

  const handleNotifyPCO = (entryId: string) => {
    notifyPCOForInduction(entryId)
    setEntries(getPrisonerInductions(id))
  }

  const allComplete = laundryNumberAdded && addedToJobsList

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}/unit/${id}/muster` : `/unit/${id}/muster`} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← {unit.name} Muster</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">{unit.name} — Induct Prisoner</h1>
          <p className="text-sm text-slate-600">Prisoner induction checklist and documentation</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn-corrections"
        >
          {showForm ? 'Cancel' : '➕ Induct Prisoner'}
        </button>
      </div>

      {/* Induction Form */}
      {showForm && (
        <div className="card mb-6">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">New Prisoner Induction</div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prisoner Name *</label>
                <input
                  type="text"
                  value={prisonerName}
                  onChange={(e) => setPrisonerName(e.target.value)}
                  placeholder="Enter prisoner name"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cell Number *</label>
                <input
                  type="text"
                  value={prisonerCell}
                  onChange={(e) => setPrisonerCell(e.target.value)}
                  placeholder="e.g., A-101"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Induction Checklist *</label>
              <div className="space-y-2 bg-slate-50 p-4 rounded-lg">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laundryNumberAdded}
                    onChange={(e) => setLaundryNumberAdded(e.target.checked)}
                    className="w-5 h-5 rounded border-corrections-blue text-corrections-blue"
                  />
                  <span className="font-medium text-slate-700">Laundry Number Added</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addedToJobsList}
                    onChange={(e) => setAddedToJobsList(e.target.checked)}
                    className="w-5 h-5 rounded border-corrections-blue text-corrections-blue"
                  />
                  <span className="font-medium text-slate-700">Added to Jobs List</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sacraCompleted}
                    onChange={(e) => setSacraCompleted(e.target.checked)}
                    className="w-5 h-5 rounded border-corrections-blue text-corrections-blue"
                  />
                  <span className="font-medium text-slate-600">SACRA Completed (optional)</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Induction Document</label>
              <div className="space-y-3">
                <div>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 mb-2">
                    <input
                      type="checkbox"
                      checked={useFileUpload}
                      onChange={(e) => { setUseFileUpload(e.target.checked); setDocumentName(''); setInductionNotes('') }}
                      className="rounded border-slate-300"
                    />
                    <span>Upload existing Word document</span>
                  </label>
                </div>
                {useFileUpload ? (
                  <div>
                    <input
                      type="file"
                      accept=".doc,.docx,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) setDocumentName(file.name)
                      }}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">Upload a pre-written induction booklet (Word/PDF)</p>
                  </div>
                ) : (
                  <div>
                    <textarea
                      value={inductionNotes}
                      onChange={(e) => setInductionNotes(e.target.value)}
                      placeholder="Enter custom induction notes or checklist items..."
                      rows={4}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <p className="text-xs text-slate-500 mt-1">Enter free-form induction notes to be printed</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Inducted By *</label>
              <input
                type="text"
                value={inductedBy}
                onChange={(e) => setInductedBy(e.target.value)}
                placeholder="Your name"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                required
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-corrections" disabled={!allComplete}>
                Save Induction
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
            {!allComplete && (
              <p className="text-sm text-amber-600">Please complete all checklist items before saving</p>
            )}
          </form>
        </div>
      )}

      {/* Inductions List */}
      <div className="card">
        <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">
          Induction Records ({entries.length})
        </div>
        {entries.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No induction records yet. Click "Induct Prisoner" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="text-left p-3">Prisoner</th>
                  <th className="text-left p-3">Cell</th>
                  <th className="text-left p-3">Laundry #</th>
                  <th className="text-left p-3">Jobs List</th>
                  <th className="text-left p-3">SACRA</th>
                  <th className="text-left p-3">Document</th>
                  <th className="text-left p-3">Inducted By</th>
                  <th className="text-left p-3">Date/Time</th>
                  <th className="text-left p-3">PCO</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="p-3 font-medium">{entry.prisonerName}</td>
                    <td className="p-3 font-mono">{entry.prisonerCell}</td>
                    <td className="p-3">
                      {entry.laundryNumberAdded ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">✓ Yes</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {entry.addedToJobsList ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">✓ Yes</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      {entry.sacraCompleted ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">✓ Yes</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-600">{entry.documentName || '—'}</td>
                    <td className="p-3">{entry.inductedBy}</td>
                    <td className="p-3 text-slate-600">
                      <div>{entry.date}</div>
                      <div className="text-xs">{new Date(entry.inductedAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-3">
                      {entry.pcoNotified ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">Notified</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleNotifyPCO(entry.id)}
                          className="text-corrections-blue hover:underline text-sm"
                        >
                          Notify PCO
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  )
}
