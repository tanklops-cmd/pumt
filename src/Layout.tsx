import { Link, useLocation } from 'react-router-dom'

export default function Layout({ children }: { children: React.ReactNode }) {
  const loc = useLocation()
  const isHome = loc.pathname === '/'
  const isAdmin = loc.pathname.startsWith('/admin')
  const role = typeof window !== 'undefined' ? sessionStorage.getItem('auth_role') : null

  const logout = () => {
    sessionStorage.removeItem('auth_token')
    sessionStorage.removeItem('auth_role')
    // if admin fallback session used
    try { sessionStorage.removeItem('prison-muster-admin-ok') } catch {}
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex flex-col">
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
            {(role === 'pco' || role === 'admin') && (
              <Link to="/pco" className="px-3 py-1.5 rounded hover:bg-white/10">PCO</Link>
            )}
            {role ? (
              <button onClick={logout} className="px-3 py-1.5 rounded hover:bg-white/10">Sign out</button>
            ) : (
              <Link to="/login" className="px-3 py-1.5 rounded hover:bg-white/10">Sign in</Link>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">{children}</main>
      <footer className="border-t border-slate-200 bg-white py-3 text-center text-sm text-slate-500">
        Prison Muster Management — Senior Officer Daily Tasks
      </footer>
    </div>
  )
}
