import { Routes, Route, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import PrisonSelector from './pages/PrisonSelector'
import UnitSelection from './pages/UnitSelection'
import UnitHub from './pages/UnitHub'
import UnitPcoHub from './pages/UnitPcoHub'
import MusterPage from './pages/MusterPage'
import AdminHub from './pages/AdminHub'
import AuditHub from './pages/AuditHub'
import UnitConfigPage from './pages/UnitConfigPage'
import ControlHub from './pages/ControlHub'
import ScoHub from './pages/ScoHub'
import UnitMaintenance from './pages/UnitMaintenance'
import PrisonerInduction from './pages/PrisonerInduction'
import { useSync } from './sync'
import SplashScreen from './SplashScreen'

export default function App() {
  const { startAutoSync, isOnline, refresh, isSyncing } = useSync()
  const [showSyncBtn, setShowSyncBtn] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const location = useLocation()
  
  // Only show splash on home page
  const showSplashScreen = showSplash && location.pathname === '/'

  useEffect(() => {
    if (isOnline && !showSplash) {
      startAutoSync()
    }
  }, [isOnline, startAutoSync, showSplash])

  // Show sync button if data might be stale
  useEffect(() => {
    const interval = setInterval(() => {
      setShowSyncBtn(true)
    }, 10000)
    return () => clearInterval(interval)
  }, [])

  // Show splash screen only on home page
  if (showSplashScreen) {
return <SplashScreen onComplete={() => setShowSplash(false)} duration={2000} />
  }

  return (
    <Routes>
      <Route path="/" element={<PrisonSelector />} />
      <Route path="/prison/:prisonId" element={<UnitSelection />} />
      <Route path="/prison/:prisonId/control" element={<ControlHub />} />
      <Route path="/prison/:prisonId/unit/:unitId" element={<UnitHub />} />
      <Route path="/prison/:prisonId/unit/:unitId/muster" element={<MusterPage />} />
      <Route path="/prison/:prisonId/unit/:unitId/pco" element={<UnitPcoHub />} />
      <Route path="/prison/:prisonId/unit/:unitId/maintenance" element={<UnitMaintenance />} />
      <Route path="/prison/:prisonId/unit/:unitId/induction" element={<PrisonerInduction />} />
      {/* legacy routes (kept for compatibility) */}
      <Route path="/unit/:unitId" element={<UnitHub />} />
      <Route path="/unit/:unitId/muster" element={<MusterPage />} />
      <Route path="/unit/:unitId/pco" element={<UnitPcoHub />} />
      <Route path="/unit/:unitId/maintenance" element={<UnitMaintenance />} />
      <Route path="/unit/:unitId/induction" element={<PrisonerInduction />} />
      <Route path="/control" element={<ControlHub />} />
      <Route path="/admin" element={<AdminHub />} />
      <Route path="/sco" element={<ScoHub />} />
      <Route path="/prison/:prisonId/sco" element={<ScoHub />} />
      <Route path="/audit" element={<AuditHub />} />
      <Route path="/prison/:prisonId/audit" element={<AuditHub />} />
      <Route path="/unit-config" element={<UnitConfigPage />} />
    </Routes>
  )
}
