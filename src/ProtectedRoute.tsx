import { Navigate } from 'react-router-dom'
import React from 'react'

export default function ProtectedRoute({ children, role }: { children: React.ReactNode; role?: string | string[] }) {
  const authRole = typeof window !== 'undefined' ? sessionStorage.getItem('auth_role') : null
  const adminOk = typeof window !== 'undefined' ? sessionStorage.getItem('prison-muster-admin-ok') : null
  const allowed = Array.isArray(role) ? role : role ? [role] : null
  if (allowed) {
    if (authRole && allowed.includes(authRole)) return <>{children}</>
    // allow admin fallback when admin is allowed and legacy admin session exists
    if (allowed.includes('admin') && adminOk) return <>{children}</>
    return <Navigate to="/login" replace />
  }
  if (authRole) return <>{children}</>
  return <Navigate to="/login" replace />
}
