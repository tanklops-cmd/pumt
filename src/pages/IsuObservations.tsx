import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import GlassLayout from '../components/GlassLayout'
import { UNITS, getUnitsForPrison, PRISONS } from '../constants'
import type { UnitId } from '../types'
import { getPrisoners } from '../store'
import * as api from '../api'

// Calculate time remaining until next observation
function getTimeUntilNextObservation(lastObsTime: string, intervalMinutes: number): { text: string; isOverdue: boolean; isUrgent: boolean } {
  const lastObs = new Date(lastObsTime)
  const nextObsTime = new Date(lastObs.getTime() + intervalMinutes * 60 * 1000)
  const now = new Date()
  const diffMs = nextObsTime.getTime() - now.getTime()
  
  if (diffMs <= 0) {
    // Overdue
    const overdueMinutes = Math.abs(Math.floor(diffMs / 60000))
    if (overdueMinutes >= 60) {
      const overdueHours = Math.floor(overdueMinutes / 60)
      return { text: `${overdueHours}h overdue`, isOverdue: true, isUrgent: true }
    }
    return { text: `${overdueMinutes}m overdue`, isOverdue: true, isUrgent: overdueMinutes > 15 }
  }
  
  // Not overdue yet
  const remainingMinutes = Math.floor(diffMs / 60000)
  if (remainingMinutes >= 60) {
    const remainingHours = Math.floor(remainingMinutes / 60)
    const mins = remainingMinutes % 60
    return { text: `${remainingHours}h ${mins}m`, isOverdue: false, isUrgent: false }
  }
  if (remainingMinutes <= 5) {
    return { text: `${remainingMinutes}m`, isOverdue: false, isUrgent: true }
  }
  return { text: `${remainingMinutes}m`, isOverdue: false, isUrgent: false }
}

interface IsuObservation {
  id: string
  unitId: string
  prisonId: string
  prisonerId: string
  prisonerName: string
  prisonerCell: string
  interval: string
  activity: string
  observation: string
  recordedBy: string
  recordedAt: string
}

export default function IsuObservations() {
  const { prisonId, unitId } = useParams<{ prisonId?: string; unitId?: string }>()
  // For legacy route (/isu), use 'invercargill-isu' as the unitId
  // For prison routes, use the unitId from params or construct ISU id from prisonId
  const id = unitId 
    ? (unitId as UnitId)
    : prisonId 
      ? `${prisonId}-isu` as UnitId
      : 'invercargill-isu' as UnitId
  
  const [observations, setObservations] = useState<IsuObservation[]>([])
  const [selectedPrisoner, setSelectedPrisoner] = useState<string>('')
  const [interval, setInterval] = useState<string>('15')
  const [activity, setActivity] = useState<string>('')
  const [observation, setObservation] = useState<string>('')
  const [recordedBy, setRecordedBy] = useState<string>('')
  const [loading, setLoading] = useState(false)

  // Update current time every minute for timer display
  useEffect(() => {
    const intervalId: number = window.setInterval(() => {
      // Timer update
    }, 60000)
    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  const unitsToSearch = prisonId ? getUnitsForPrison(prisonId) : UNITS
  const unit = unitsToSearch.find((u) => u.id === id) ?? (UNITS.find((u) => u.id === id) ?? unitsToSearch[0])
  const prison = PRISONS.find((p) => p.id === prisonId)

  // Get ISU prisoners
  // For legacy units (invercargill), we need to get prisoners from the store
  // ISU uses the same prisoner data - it just has a different unitId
  const [prisoners, setPrisoners] = useState<any[]>(() => getPrisoners(id))

  // Also listen for data sync to update prisoners
  useEffect(() => {
    const handleSync = () => {
      setPrisoners(getPrisoners(id))
    }
    window.addEventListener('data-synced', handleSync)
    return () => window.removeEventListener('data-synced', handleSync)
  }, [id])

  // Load observations from backend
  useEffect(() => {
    loadObservations()
  }, [id])

  const loadObservations = async () => {
    try {
      const data = await api.fetchIsuObservations(id)
      setObservations(data)
    } catch (e) {
      console.error('Failed to load observations:', e)
    }
  }

  const handleAddObservation = async () => {
    if (!selectedPrisoner || !activity.trim() || !observation.trim() || !recordedBy.trim()) {
      alert('Please fill in all fields')
      return
    }

    const prisoner = prisoners.find(p => p.id === selectedPrisoner)
    if (!prisoner) {
      alert('Please select a prisoner')
      return
    }

    setLoading(true)
    try {
      const newObservation: Partial<IsuObservation> = {
        id: `obs-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        unitId: id,
        prisonId: prisonId,
        prisonerId: selectedPrisoner,
        prisonerName: prisoner.name || 'Unknown',
        prisonerCell: prisoner.cell || '',
        interval,
        activity: activity.trim(),
        observation: observation.trim(),
        recordedBy: recordedBy.trim(),
        recordedAt: new Date().toISOString(),
      }

      await api.saveIsuObservation(newObservation)
      await loadObservations()
      
      // Reset form
      setActivity('')
      setObservation('')
      setSelectedPrisoner('')
      alert('Observation saved!')
    } catch (e) {
      console.error('Failed to save observation:', e)
      alert('Failed to save observation')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteObservation = async (obsId: string) => {
    if (!window.confirm('Delete this observation?')) return
    
    try {
      await api.deleteIsuObservation(obsId)
      await loadObservations()
    } catch (e) {
      console.error('Failed to delete observation:', e)
      alert('Failed to delete observation')
    }
  }

  // Group observations by prisoner
  const observationsByPrisoner = observations.reduce((acc, obs) => {
    if (!acc[obs.prisonerId]) {
      acc[obs.prisonerId] = []
    }
    acc[obs.prisonerId].push(obs)
    return acc
  }, {} as Record<string, IsuObservation[]>)

  return (
    <GlassLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to={prisonId ? `/prison/${prisonId}/isu` : '/'} className="text-corrections-blue hover:underline text-sm mb-1 inline-block">← Back to ISU Hub</Link>
          <h1 className="text-2xl font-bold text-corrections-charcoal">ISU Observations</h1>
          <p className="text-sm text-slate-600">{prison?.name || unit.name}</p>
        </div>
      </div>

      {/* Add Observation Form */}
      <div className="card mb-6">
        <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">
          Add New Observation
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Prisoner</label>
              <select
                value={selectedPrisoner}
                onChange={(e) => setSelectedPrisoner(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Select prisoner...</option>
                {prisoners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name || 'Unnamed'} ({p.cell || 'No cell'})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Interval</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Recorded By</label>
              <input
                type="text"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </div>
            
            <div className="flex items-end">
              <button
                type="button"
                onClick={handleAddObservation}
                disabled={loading}
                className="btn-corrections w-full"
              >
                {loading ? 'Saving...' : 'Add Observation'}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Activity</label>
              <input
                type="text"
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g., Sleeping, Watching TV, In cell"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observation Notes</label>
              <input
                type="text"
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g., Alert, Calm, Restless"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Observations List with Timers */}
      <div className="card">
        <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">
          Observation Status
        </div>
        <div className="p-4">
          {observations.length === 0 ? (
            <p className="text-sm text-slate-500">No observations recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {Object.entries(observationsByPrisoner).map(([prisonerId, obsList]) => {
                const latestObs = obsList[0] // Most recent observation (first in sorted list)
                const intervalMins = parseInt(latestObs.interval, 10) || 15
                const timerInfo = getTimeUntilNextObservation(latestObs.recordedAt, intervalMins)
                
                return (
                  <div key={prisonerId} className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className={`px-4 py-3 border-b border-slate-200 flex items-center justify-between ${
                      timerInfo.isOverdue ? 'bg-red-50' : timerInfo.isUrgent ? 'bg-amber-50' : 'bg-slate-50'
                    }`}>
                      <div>
                        <h3 className="font-semibold text-corrections-charcoal">
                          {latestObs.prisonerName || 'Unknown'} 
                          <span className="text-slate-500 font-normal ml-2">({latestObs.prisonerCell || 'No cell'})</span>
                        </h3>
                      </div>
                      <div className={`text-sm font-medium px-3 py-1 rounded-full ${
                        timerInfo.isOverdue ? 'bg-red-500 text-white' : 
                        timerInfo.isUrgent ? 'bg-amber-500 text-white' : 
                        'bg-green-100 text-green-800'
                      }`}>
                        {timerInfo.text}
                      </div>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {obsList.map((obs) => (
                        <div key={obs.id} className="p-3 flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                                {obs.interval} min
                              </span>
                              <span className="text-xs text-slate-500">
                                {new Date(obs.recordedAt).toLocaleString()}
                              </span>
                              <span className="text-xs text-slate-400">
                                by {obs.recordedBy}
                              </span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-slate-700">Activity:</span>{' '}
                              <span className="text-slate-900">{obs.activity}</span>
                            </div>
                            <div className="text-sm">
                              <span className="font-medium text-slate-700">Observation:</span>{' '}
                              <span className="text-slate-900">{obs.observation}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteObservation(obs.id)}
                            className="text-red-500 hover:text-red-700 text-sm ml-4"
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </GlassLayout>
  )
}
