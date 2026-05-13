'use client'

import { useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  initialCount: number
  logDate: string
  onBudgetUpdate: (newBudget: number) => void
}

export function DrinkCounter({ initialCount, logDate, onBudgetUpdate }: Props) {
  const [count, setCount] = useState(initialCount)
  const [submittedCount, setSubmittedCount] = useState(initialCount)
  const [submitting, setSubmitting] = useState(false)

  const hasChanged = count !== submittedCount

  async function handleSubmit() {
    if (!hasChanged || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/drinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: logDate, count }),
      })
      const data = await res.json()
      if (data.newBudget !== undefined) onBudgetUpdate(data.newBudget)
      setSubmittedCount(count)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-sm text-gray-500 text-center mb-3">
        {count === 0 ? "Today's drinks" : `${count} drinks so far today`}
      </p>

      <div className="flex items-center justify-center gap-6">
        <button
          onClick={() => setCount((c) => Math.max(0, c - 1))}
          className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-700"
        >
          <Minus className="w-5 h-5" />
        </button>
        <span className="text-[40px] font-medium text-gray-900 min-w-[44px] text-center">
          {count}
        </span>
        <button
          onClick={() => setCount((c) => c + 1)}
          className="w-11 h-11 rounded-full border border-gray-200 flex items-center justify-center text-gray-700"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="flex justify-center mt-5">
        <button
          onClick={handleSubmit}
          disabled={!hasChanged || submitting}
          className={cn(
            'px-9 py-2.5 rounded-lg text-sm font-medium transition-colors',
            hasChanged && !submitting
              ? 'bg-gray-900 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
          )}
        >
          Submit
        </button>
      </div>
    </div>
  )
}
