import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const isHome = loc.pathname === '/'
  const isAdmin = loc.pathname.startsWith('/admin')

  return (
    <div className="min-h-screen flex flex-col relative">
      <header className="bg-corrections-blue text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-bold text-lg">Invercargill Prison</span>
            <span className="text-corrections-blue-pale/90 text-sm font-medium">Unit Management System</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded ${isHome ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              Units
            </Link>
            <Link
              to="/admin"
              className={`px-3 py-1.5 rounded ${isAdmin ? 'bg-white/20' : 'hover:bg-white/10'}`}
            >
              Admin
            </Link>
            <Link to="/audit" className="px-3 py-1.5 rounded hover:bg-white/10">Audit</Link>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-sm text-slate-500">
        Prison Muster Management — Senior Officer Daily Tasks
      </footer>
      {/* Large centered watermark logo, low opacity */}
      <img
        src="/corrections-logo-large.png"
        alt="Ara Poutama Aotearoa watermark"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '60vw',
          maxWidth: 800,
          minWidth: 320,
          opacity: 0.13,
          pointerEvents: 'none',
          zIndex: 10,
          userSelect: 'none',
        }}
        aria-hidden="true"
      />
    </div>
  )
}
