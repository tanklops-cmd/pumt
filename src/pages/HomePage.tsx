import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import GlassLayout from '../components/GlassLayout'
import { UNITS } from '../constants'
import { getAllUnitsSummary } from '../store'

export default function HomePage() {
  const [summary, setSummary] = useState(() => getAllUnitsSummary())

  useEffect(() => {
    setSummary(getAllUnitsSummary())
    const onStorage = () => setSummary(getAllUnitsSummary())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])
  return (
<GlassLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-corrections-charcoal">Unit selection</h1>
        <p className="text-corrections-stone mt-1">Select a unit to view muster, handover, daily tasks and confirmations.</p>
      </div>

      <section className="card mb-6">
        <div className="px-4 py-3 bg-corrections-blue text-white font-semibold flex items-center justify-between">
          <span>Control Hub</span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSummary(getAllUnitsSummary())} className="btn-outline text-sm">Refresh</button>
            <Link to="/control" className="btn-corrections text-sm">Open control hub</Link>
          </div>
        </div>
        <div className="p-4">
          <div className="text-xs text-slate-500">Prison muster total</div>
          <div className="text-xl font-bold">{summary.total}</div>
          <div className="text-sm text-slate-600">Offsite: {summary.offSite}</div>
        </div>
      </section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {UNITS.map((unit) => (
          <Link
            key={unit.id}
            to={`/unit/${unit.id}`}
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
</GlassLayout>
  )
}
