import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import Layout from '../Layout'
import { UNITS, getUnitsForPrison } from '../constants'
import { getUnitMaintenanceEntries, addUnitMaintenanceEntry, deleteUnitMaintenanceEntry, updateMaintenanceStatus } from '../store'
import type { UnitId, MaintenanceStatus } from '../types'

export default function UnitMaintenance() {
  const { prisonId, unitId } = useParams<{ prisonId?: string; unitId?: string }>()
  const id = (unitId ?? 'north') as UnitId
  const unitsToSearch = prisonId ? getUnitsForPrison(prisonId) : UNITS
  const unit = unitsToSearch.find((u) => u.id === id) ?? (UNITS.find((u) => u.id === id) ?? unitsToSearch[0])

  const [entries, setEntries] = useState(() => getUnitMaintenanceEntries(id))
  const [showForm, setShowForm] = useState(false)

  // Listen for sync updates from other browsers
  useEffect(() => {
    const handleSync = () => {
      setEntries(getUnitMaintenanceEntries(id))
    }
    window.addEventListener('data-synced', handleSync)
    // Also listen for storage events (sync between tabs)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'prison-muster-unit-maintenance') {
        setEntries(getUnitMaintenanceEntries(id))
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener('data-synced', handleSync)
      window.removeEventListener('storage', handleStorage)
    }
  }, [id])
  const [jobDescription, setJobDescription] = useState('')
  const [jobNumber, setJobNumber] = useState('')
  const [priority, setPriority] = useState<'Routine' | 'Urgent' | 'Other'>('Routine')
  const [addedBy, setAddedBy] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!jobDescription.trim() || !jobNumber.trim() || !addedBy.trim()) {
      alert('Please fill in all fields')
      return
    }
    addUnitMaintenanceEntry(id, prisonId, jobDescription, jobNumber, priority, addedBy)
    setEntries(getUnitMaintenanceEntries(id))
    // Reset form
    setJobDescription('')
    setJobNumber('')
    setPriority('Routine')
    setAddedBy('')
    setShowForm(false)
  }

  const handleDelete = (entryId: string) => {
    if (confirm('Delete this maintenance entry?')) {
      deleteUnitMaintenanceEntry(entryId)
      setEntries(getUnitMaintenanceEntries(id))
    }
  }

  const handleToggleStatus = (entryId: string, currentStatus: MaintenanceStatus) => {
    const newStatus: MaintenanceStatus = currentStatus === 'Logged' ? 'Completed' : 'Logged'
    updateMaintenanceStatus(entryId, newStatus)
    setEntries(getUnitMaintenanceEntries(id))
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case 'Urgent': return 'bg-red-100 text-red-800 border-red-300'
      case 'Routine': return 'bg-green-100 text-green-800 border-green-300'
      case 'Other': return 'bg-amber-100 text-amber-800 border-amber-300'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'Completed': return 'bg-green-100 text-green-800 border-green-300'
      case 'Logged': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}/unit/${id}` : `/unit/${id}`} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← {unit.name} Hub</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">{unit.name} — Unit Maintenance</h1>
          <p className="text-sm text-slate-600">Track unit maintenance jobs and priorities</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(!showForm)}
          className="btn-corrections"
        >
          {showForm ? 'Cancel' : '➕ Add Entry'}
        </button>
      </div>

      {/* Add Entry Form */}
      {showForm && (
        <div className="card mb-6">
          <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">Add Maintenance Entry</div>
          <form onSubmit={handleSubmit} className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Number</label>
                <input
                  type="text"
                  value={jobNumber}
                  onChange={(e) => setJobNumber(e.target.value)}
                  placeholder="e.g., JOB-001"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as 'Routine' | 'Urgent' | 'Other')}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2"
                >
                  <option value="Routine">Routine</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Describe the maintenance work required..."
                rows={3}
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Your Name</label>
              <input
                type="text"
                value={addedBy}
                onChange={(e) => setAddedBy(e.target.value)}
                placeholder="Enter your name"
                className="w-full border border-slate-300 rounded-lg px-3 py-2"
                required
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="btn-corrections">Save Entry</button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-outline">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Entries List */}
      <div className="card">
        <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">
          Maintenance Entries ({entries.length})
        </div>
        {entries.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            No maintenance entries yet. Click "Add Entry" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="text-left p-3">Status</th>
                  <th className="text-left p-3">Priority</th>
                  <th className="text-left p-3">Job #</th>
                  <th className="text-left p-3">Description</th>
                  <th className="text-left p-3">Added By</th>
                  <th className="text-left p-3">Date/Time</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id} className="border-t border-slate-200 hover:bg-slate-50">
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(entry.id, entry.status)}
                        className={`inline-block px-2 py-1 rounded text-xs font-medium border cursor-pointer ${statusColor(entry.status)}`}
                      >
                        {entry.status}
                      </button>
                    </td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${priorityColor(entry.priority)}`}>
                        {entry.priority}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-medium">{entry.jobNumber}</td>
                    <td className="p-3">{entry.jobDescription}</td>
                    <td className="p-3">{entry.addedBy}</td>
                    <td className="p-3 text-slate-600">
                      <div>{entry.date}</div>
                      <div className="text-xs">{new Date(entry.addedAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
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
