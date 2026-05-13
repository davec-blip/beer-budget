'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await signIn('credentials', {
      username,
      password,
      redirect: false,
    })
    setLoading(false)
    if (result?.ok) {
      router.push('/')
    } else {
      setError('Invalid username or password')
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center px-6 max-w-[390px] mx-auto">
      <div className="text-4xl text-center mb-1">🍺</div>
      <h1 className="text-2xl font-medium text-center text-gray-900 mb-1">Beer Budget</h1>
      <p className="text-sm text-gray-500 text-center mb-8">Sign in to your account</p>

      <form onSubmit={handleSubmit}>
        <label className="text-xs text-gray-500 mb-1 block">Username</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-4 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />

        <label className="text-xs text-gray-500 mb-1 block">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-6 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      </form>
    </div>
  )
}
