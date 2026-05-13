'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewEntryPage() {
  const router = useRouter()
  const [defaultDate, setDefaultDate] = useState('')
  const [date, setDate] = useState('')
  const [count, setCount] = useState(0)
  const [existingDates, setExistingDates] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/budget').then((r) => r.json()),
      fetch('/api/drinks').then((r) => r.json()),
    ]).then(([budget, drinks]) => {
      setDefaultDate(budget.logDate)
      setDate(budget.logDate)
      setExistingDates(new Set((drinks.logs as { date: string }[]).map((l) => l.date)))
    })
  }, [])

  const isOverwrite = existingDates.has(date)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/drinks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, count }),
    })
    window.location.href = '/log'
  }

  return (
    <div className="px-5">
      <Link href="/log" className="flex items-center gap-1.5 text-sm text-gray-500 mt-5 mb-5">
        <ArrowLeft className="w-4 h-4" />
        Log
      </Link>

      <h1 className="text-xl font-medium text-gray-900 mb-6">Add entry</h1>

      <form onSubmit={handleSave}>
        <label className="text-xs text-gray-500 block mb-1">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 mb-4 focus:outline-none focus:ring-1 focus:ring-gray-400"
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

        {isOverwrite && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 mb-4 text-xs text-amber-800">
            An entry already exists for this date. Saving will overwrite it.
          </div>
        )}

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
