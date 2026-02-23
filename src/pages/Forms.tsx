import { Link } from 'react-router-dom'
import GlassLayout from '../components/GlassLayout'

export default function Forms() {
  return (
    <GlassLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-corrections-charcoal">Forms</h1>
        <p className="text-slate-600 mt-1">Select a form type to access</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
        {/* Offender Forms */}
        <Link
          to="/forms/offender"
          className="block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-corrections-blue transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-corrections-blue-pale flex items-center justify-center">
              <svg className="w-6 h-6 text-corrections-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-corrections-charcoal group-hover:text-corrections-blue">
                Offender Forms
              </h2>
              <p className="text-sm text-slate-500">Access offender-related documentation</p>
            </div>
          </div>
        </Link>

        {/* Staff Forms */}
        <Link
          to="/forms/staff"
          className="block p-6 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-corrections-blue transition-all group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-corrections-charcoal group-hover:text-corrections-blue">
                Staff Forms
              </h2>
              <p className="text-sm text-slate-500">Access staff-related documentation</p>
            </div>
          </div>
        </Link>
      </div>
    </GlassLayout>
  )
}
