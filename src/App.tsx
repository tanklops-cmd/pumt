import { Routes, Route } from 'react-router-dom'
import PrisonSelector from './pages/PrisonSelector'
import ProtectedRoute from './ProtectedRoute'
import UnitSelection from './pages/UnitSelection'
import UnitHub from './pages/UnitHub'
import MusterPage from './pages/MusterPage'
import AdminHub from './pages/AdminHub'
import PcoHub from './pages/PcoHub'
import ControlHub from './pages/ControlHub'
import Login from './pages/Login'
import ScoHub from './pages/ScoHub'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PrisonSelector />} />
      <Route path="/prison/:prisonId" element={<UnitSelection />} />
        <Route path="/prison/:prisonId/control" element={<ProtectedRoute role={["sco","admin","total"]}><ControlHub /></ProtectedRoute>} />
      <Route path="/prison/:prisonId/unit/:unitId" element={<UnitHub />} />
      <Route path="/prison/:prisonId/unit/:unitId/muster" element={<MusterPage />} />
      {/* legacy routes (kept for compatibility) */}
      <Route path="/unit/:unitId" element={<UnitHub />} />
      <Route path="/unit/:unitId/muster" element={<MusterPage />} />
      <Route path="/control" element={<ProtectedRoute role={["sco","admin","total"]}><ControlHub /></ProtectedRoute>} />
      <Route path="/admin" element={<AdminHub />} />
      <Route path="/sco" element={<ProtectedRoute role={["sco","admin","total"]}><ScoHub /></ProtectedRoute>} />
      <Route path="/prison/:prisonId/sco" element={<ProtectedRoute role={["sco","admin","total"]}><ScoHub /></ProtectedRoute>} />
      <Route path="/prison/:prisonId/unit/:unitId/sco" element={<ProtectedRoute role={["sco","admin","total"]}><ScoHub /></ProtectedRoute>} />
      <Route path="/unit/:unitId/sco" element={<ProtectedRoute role={["sco","admin","total"]}><ScoHub /></ProtectedRoute>} />
      <Route path="/pco" element={<ProtectedRoute role={["pco","admin"]}><PcoHub /></ProtectedRoute>} />
      <Route path="/prison/:prisonId/pco" element={<ProtectedRoute role={["pco","admin"]}><PcoHub /></ProtectedRoute>} />
      <Route path="/login" element={<Login />} />
    </Routes>
  )
}
