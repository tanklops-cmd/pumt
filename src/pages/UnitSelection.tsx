import { Link, useParams } from 'react-router-dom'
import { getUnitsForPrison, PRISONS } from '../constants'
import { initializeTemplateHubsForPrison, getAllPrisoners } from '../store'
import BriefingPanel from '../components/BriefingPanel'
import GlassLayout from '../components/GlassLayout'

export default function UnitSelection() {
  const { prisonId } = useParams<{ prisonId: string }>()
  
  const prison = PRISONS.find((p) => p.id === prisonId) ?? { 
    id: prisonId, 
    name: prisonId, 
    shortName: prisonId,
    region: 'North Island' as const
  }
  
  const units = getUnitsForPrison(prison.id as string)
  const allPrisoners = getAllPrisoners()
  const prisonPrisoners = allPrisoners.filter(p => 
    units.some(u => u.id === p.unitId) || 
    (p.unitId as string)?.startsWith(prison.id as string)
  )

  return (
    <GlassLayout>
      {/* Combined Header Card with Briefing */}
      <div className="card mb-8">
        <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">
          {prison.name}
        </div>
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Prison Info */}
            <div className="flex-1">
              <Link to="/" className="text-corrections-blue text-sm hover:underline mb-1 inline-block">
                ← Back to Prisons
              </Link>
              <p className="text-corrections-stone text-sm mb-4">Select a unit to view muster, handover & daily tasks</p>
              
              <div className="flex flex-wrap gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => {
                    if (!window.confirm(`Initialize template hubs for ${prison.name}? This will create today's tasks and save snapshots for all units.`)) return
                    const ids = initializeTemplateHubsForPrison(prison.id as string)
                    alert(`Initialized ${ids.length} units for ${prison.name}`)
                    window.location.reload()
                  }}
                  className="px-4 py-2 bg-corrections-blue-pale text-corrections-blue border border-corrections-blue/30 rounded-lg hover:bg-corrections-blue/10 transition-colors text-sm font-medium"
                >
                  Initialize template hubs
                </button>
                <Link
                  to={`/prison/${prison.id}/control`}
                  className="px-4 py-2 bg-slate-100 text-corrections-charcoal border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium"
                >
                  Open Control Hub →
                </Link>
              </div>

              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-corrections-blue">{prisonPrisoners.length}</div>
                  <div className="text-xs text-corrections-stone uppercase tracking-wide">Prisoners</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-corrections-blue">{units.length}</div>
                  <div className="text-xs text-corrections-stone uppercase tracking-wide">Units</div>
                </div>
              </div>
            </div>

            {/* Briefing Section - Inline */}
            <div className="flex-1 border-l border-slate-200 lg:pl-6">
              {prisonId && <BriefingPanel prisonId={prisonId} />}
            </div>
          </div>
        </div>
      </div>

      {/* Units grid */}
      <h2 className="text-lg font-semibold text-corrections-charcoal mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-corrections-blue"></span>
        Units
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {units.map((unit) => (
          <Link
            key={unit.id}
            to={`/prison/${prison.id}/unit/${unit.id}`}
            className="group bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-4 hover:bg-corrections-blue-pale hover:border-corrections-blue/30 transition-all duration-200 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-corrections-blue-pale flex items-center justify-center">
                <span className="text-corrections-blue font-bold">
                  {unit.shortName.charAt(0)}
                </span>
              </div>
              <span className="text-corrections-blue opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </div>
            <h3 className="text-corrections-charcoal font-medium mt-3">{unit.name}</h3>
            <p className="text-corrections-stone text-sm">View muster & tasks</p>
          </Link>
        ))}
      </div>
    </GlassLayout>
  )
}
