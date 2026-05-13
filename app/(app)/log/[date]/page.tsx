'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EditEntryPage() {
  const router = useRouter()
  const params = useParams()
  const dateParam = params.date as string

  const [count, setCount] = useState(0)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetch('/api/drinks')
      .then((r) => r.json())
      .then((d) => {
        const entry = (d.logs as { date: string; count: number }[]).find(
          (l) => l.date === dateParam
        )
        if (entry) setCount(entry.count)
        setLoaded(true)
      })
  }, [dateParam])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/drinks/${dateParam}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count }),
    })
    window.location.href = '/log'
  }

  if (!loaded) {
    return (
      <div className="px-5">
        <Link href="/log" className="flex items-center gap-1.5 text-sm text-gray-500 mt-5 mb-5">
          <ArrowLeft className="w-4 h-4" />
          Log
        </Link>
        <p className="text-sm text-gray-400">Loading…</p>
      </div>
    )
  }

  return (
    <div className="px-5">
      <Link href="/log" className="flex items-center gap-1.5 text-sm text-gray-500 mt-5 mb-5">
        <ArrowLeft className="w-4 h-4" />
        Log
      </Link>

      <h1 className="text-xl font-medium text-gray-900 mb-6">Edit entry</h1>

      <form onSubmit={handleSave}>
        <label className="text-xs text-gray-500 block mb-1">Date</label>
        <input
          type="date"
          value={dateParam}
          readOnly
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-4 bg-gray-50 cursor-not-allowed"
        />

        <label className="text-xs text-gray-500 block mb-1">Number of drinks</label>
        <input
          type="number"
          min="0"
          value={count}
          onChange={(e) => setCount(Math.max(0, parseInt(e.target.value) || 0))}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-6 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4 text-xs text-amber-800">
          Saving will overwrite the existing entry for this date.
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-gray-900 text-white text-sm font-medium py-2.5 rounded-lg disabled:opacity-60"
        >
          Save entry
        </button>
      </form>
    </div>
  )
}
