import { Link } from 'react-router-dom'
import Layout from '../Layout'
import { PRISONS } from '../constants'

export default function PrisonSelector() {
  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-corrections-charcoal">Select prison</h1>
        <p className="text-corrections-stone mt-1">Choose a prison to view units and musters.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRISONS.map((prison) => (
          <Link
            key={prison.id}
            to={`/prison/${prison.id}`}
            className="card p-6 block hover:ring-2 hover:ring-corrections-blue hover:ring-offset-2 transition"
          >
            <div className="w-12 h-12 rounded-lg bg-corrections-blue-pale flex items-center justify-center mb-4">
              <span className="text-corrections-blue font-bold text-lg">{prison.shortName.slice(0, 1)}</span>
            </div>
            <h2 className="text-lg font-semibold text-corrections-charcoal">{prison.name}</h2>
            <p className="text-sm text-corrections-stone mt-1">Select this prison</p>
            <span className="inline-block mt-3 text-corrections-blue font-medium text-sm">Open →</span>
          </Link>
        ))}
      </div>
    </Layout>
  )
}
