import { PRISONS, getPrisonsByRegion, type Region } from '../constants'
import { getAllPrisoners, getAllUnitsSummary } from '../store'
import GlassLayout from '../components/GlassLayout'

// Region section component
function RegionSection({ region, prisons }: { region: Region; prisons: typeof PRISONS }) {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold text-corrections-charcoal mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-corrections-blue"></span>
        {region}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {prisons.map((prison) => (
          <a
            key={prison.id}
            href={`/prison/${prison.id}`}
            className="group bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-4 hover:bg-corrections-blue-pale hover:border-corrections-blue/30 transition-all duration-200 shadow-sm block"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-lg bg-corrections-blue-pale flex items-center justify-center">
                <span className="text-corrections-blue font-bold">
                  {prison.shortName.charAt(0)}
                </span>
              </div>
              <span className="text-corrections-blue opacity-0 group-hover:opacity-100 transition-opacity">
                →
              </span>
            </div>
            <h3 className="text-corrections-charcoal font-medium mt-3">{prison.name}</h3>
            <p className="text-corrections-stone text-sm">{prison.shortName}</p>
          </a>
        ))}
      </div>
    </div>
  )
}

// Welcome panel component
function WelcomePanel() {
  const summary = getAllUnitsSummary()
  const prisoners = getAllPrisoners()
  const today = new Date().toLocaleDateString('en-NZ', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="card mb-8">
      <div className="px-4 py-3 bg-corrections-blue text-white font-semibold">
        Welcome, Staff
      </div>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-corrections-charcoal mb-4">{today}</p>
            <p className="text-corrections-charcoal/80 max-w-xl">
              Select a prison from the list below to view units and manage musters.
            </p>
          </div>
          <div className="hidden md:flex gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-corrections-blue">{summary.total}</div>
              <div className="text-xs text-corrections-stone uppercase tracking-wide">Prisoners</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-corrections-blue">{summary.summaries.length}</div>
              <div className="text-xs text-corrections-stone uppercase tracking-wide">Units</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PrisonSelector() {
  const prisonsByRegion = getPrisonsByRegion()

  return (
    <GlassLayout>
      {/* Welcome panel */}
      <WelcomePanel />

      {/* Region sections */}
      <RegionSection region="North Island" prisons={prisonsByRegion['North Island']} />
      <RegionSection region="South Island" prisons={prisonsByRegion['South Island']} />
    </GlassLayout>
  )
}
