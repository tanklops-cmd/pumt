import { Routes, Route } from 'react-router-dom'
import PrisonSelector from './pages/PrisonSelector'
import UnitSelection from './pages/UnitSelection'
import UnitHub from './pages/UnitHub'
import MusterPage from './pages/MusterPage'
import AdminHub from './pages/AdminHub'
import ControlHub from './pages/ControlHub'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PrisonSelector />} />
      <Route path="/prison/:prisonId" element={<UnitSelection />} />
        <Route path="/prison/:prisonId/control" element={<ControlHub />} />
      <Route path="/prison/:prisonId/unit/:unitId" element={<UnitHub />} />
      <Route path="/prison/:prisonId/unit/:unitId/muster" element={<MusterPage />} />
      {/* legacy routes (kept for compatibility) */}
      <Route path="/unit/:unitId" element={<UnitHub />} />
      <Route path="/unit/:unitId/muster" element={<MusterPage />} />
      <Route path="/control" element={<ControlHub />} />
      <Route path="/admin" element={<AdminHub />} />
    </Routes>
  )
}
