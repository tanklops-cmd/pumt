// Minimal backend API stubs — replace with real endpoints when available

export async function sendFullMuster(prisonId: string, payload: any): Promise<{ ok: boolean }>{
  try {
    // TODO: implement real POST to backend
    console.warn('sendFullMuster called (stub)', prisonId, payload)
    return { ok: true }
  } catch (e) {
    return { ok: false }
  }
}

export async function ldapAuthenticate(username: string, password: string): Promise<{ ok: boolean; token?: string; role?: string }>{
  try {
    // Stubbed: in production call LDAP-backed auth endpoint
    // Local test users (replace with real LDAP validation in production)
    const USERS: Record<string, { password: string; role: string; token: string }> = {
      admin: { password: 'admin', role: 'admin', token: 'stub-admin-token' },
      user: { password: 'user', role: 'user', token: 'stub-user-token' },
      pco_user: { password: 'PcoTest!23', role: 'pco', token: 'stub-pco-token' },
      total_user: { password: 'TotalTest!23', role: 'total', token: 'stub-total-token' },
      sco_user: { password: 'ScoTest!23', role: 'sco', token: 'stub-sco-token' },
    }

    const record = USERS[username]
    if (record && record.password === password) {
      return { ok: true, token: record.token, role: record.role }
    }
    return { ok: false }
  } catch (e) {
    return { ok: false }
  }
}
