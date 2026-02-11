import { Link, useParams } from 'react-router-dom'
import Layout from '../Layout'
import { getUnitsForPrison, PRISONS } from '../constants'
import { initializeTemplateHubsForPrison } from '../store'
import { exportPrisonData } from '../store'

export default function UnitSelection() {
  const { prisonId } = useParams<{ prisonId: string }>()
  const prison = PRISONS.find((p) => p.id === prisonId) ?? { id: prisonId, name: prisonId }

  const units = getUnitsForPrison(prison.id)

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-corrections-charcoal">{prison.name} — Unit selection</h1>
        <p className="text-corrections-stone mt-1">Select a unit to view muster, handover & daily tasks.</p>
        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (!window.confirm(`Initialize template hubs for ${prison.name}? This will create today's tasks and save snapshots for all units.`)) return
              const ids = initializeTemplateHubsForPrison(prison.id)
              alert(`Initialized ${ids.length} units for ${prison.name}`)
              // refresh page to reflect newly created tasks/snapshots
              window.location.reload()
            }}
          >
            Initialize template hubs for this prison
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              try {
                const json = exportPrisonData(prison.id)
                const blob = new Blob([json], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${prison.id}-export-${new Date().toISOString().slice(0,10)}.json`
                document.body.appendChild(a)
                a.click()
                a.remove()
                URL.revokeObjectURL(url)
              } catch (e) {
                alert('Failed to export prison data')
              }
            }}
          >
            Export prison data (JSON)
          </button>
          <Link to={`/prison/${prison.id}/control`} className="btn btn-outline">Open Control Hub for {prison.shortName ?? prison.name}</Link>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {units.map((unit) => (
          <Link
            key={unit.id}
            to={`/prison/${prison.id}/unit/${unit.id}`}
            className="card p-6 block hover:ring-2 hover:ring-corrections-blue hover:ring-offset-2 transition"
          >
            <div className="w-12 h-12 rounded-lg bg-corrections-blue-pale flex items-center justify-center mb-4">
              <span className="text-corrections-blue font-bold text-lg">{unit.shortName.slice(0, 1)}</span>
            </div>
            <h2 className="text-lg font-semibold text-corrections-charcoal">{unit.name}</h2>
            <p className="text-sm text-corrections-stone mt-1">View muster, handover & daily tasks</p>
            <span className="inline-block mt-3 text-corrections-blue font-medium text-sm">Open unit hub →</span>
          </Link>
        ))}
      </div>
    </Layout>
  )
}
