import { useState } from 'react'
import Layout from '../Layout'

// Login page kept for reference but no longer routed in the app
// Authentication removed for demo purposes

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    // Stub: LDAP authentication removed for demo
    setError('Login not available in demo mode')
  }

  return (
    <Layout>
      <div className="max-w-md mx-auto card p-6">
        <h1 className="text-xl font-bold text-corrections-charcoal mb-2">Sign in</h1>
        <p className="text-sm text-slate-600 mb-4">Authentication is not available in demo mode.</p>
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
