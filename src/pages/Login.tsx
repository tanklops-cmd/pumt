import { useState } from 'react'
import Layout from '../Layout'
import { ldapAuthenticate } from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const res = await ldapAuthenticate(username.trim(), password)
    if (!res.ok) {
      setError('Login failed')
      return
    }
    // store token and role in session for RBAC checks
    if (res.token) sessionStorage.setItem('auth_token', res.token)
    if (res.role) sessionStorage.setItem('auth_role', res.role)
    // redirect to root
    window.location.href = '/'
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto card p-6">
        <h1 className="text-xl font-bold text-corrections-charcoal mb-2">Sign in</h1>
        <p className="text-sm text-slate-600 mb-4">Sign in using your LDAP credentials (stubbed locally).</p>
        <form onSubmit={submit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3"
            autoFocus
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 mb-3"
          />
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          <button type="submit" className="btn-corrections w-full">Sign in</button>
        </form>
      </div>
    </Layout>
  )
}
