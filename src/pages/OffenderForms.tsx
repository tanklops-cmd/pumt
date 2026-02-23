import { Link } from 'react-router-dom'
import GlassLayout from '../components/GlassLayout'

export default function OffenderForms() {
  return (
    <GlassLayout>
      <div className="mb-6">
        <Link to="/forms" className="text-corrections-blue hover:underline text-sm mb-2 inline-block">← Forms</Link>
        <h1 className="text-2xl font-bold text-corrections-charcoal">Offender Forms</h1>
        <p className="text-slate-600 mt-1">Access offender-related documentation and forms</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <p className="text-slate-500">Offender forms coming soon...</p>
      </div>
    </GlassLayout>
  )
}
