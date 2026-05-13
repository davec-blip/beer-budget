'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { BudgetDisplay } from '@/components/BudgetDisplay'
import { DrinkCounter } from '@/components/DrinkCounter'

interface BudgetData {
  budget: number
  logDate: string
  todayCount: number
  accrualRate: number
  timezone: string
  resetAt: string
}

export default function HomePage() {
  const [data, setData] = useState<BudgetData | null>(null)
  const [budget, setBudget] = useState<number>(0)

  useEffect(() => {
    fetch('/api/budget')
      .then((r) => r.json())
      .then((d: BudgetData) => {
        setData(d)
        setBudget(d.budget)
      })
  }, [])

  if (!data) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-sm text-gray-400">Loading…</span>
      </div>
    )
  }

  return (
    <div className="px-5 pt-0">
      <p className="text-base font-medium text-gray-900 text-center mt-6 mb-5">
        {format(parseISO(data.logDate), 'EEEE, MMM d')}
      </p>

      <BudgetDisplay budget={budget} />

      <div className="border-t border-gray-200 mx-0 my-5" />

      <DrinkCounter
        initialCount={data.todayCount}
        logDate={data.logDate}
        onBudgetUpdate={setBudget}
      />
    </div>
  )
}
