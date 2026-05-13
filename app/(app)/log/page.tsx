'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { format, parseISO, subDays, addDays } from 'date-fns'
import { PlusCircle, BarChart2, LineChart as LineChartIcon } from 'lucide-react'
import { cn, budgetColor, formatBudget } from '@/lib/utils'
import { currentLogDate } from '@/lib/date'
import { DeltaPill } from '@/components/DeltaPill'
import { ResetMarker } from '@/components/ResetMarker'
import { BudgetLogChart } from '@/components/BudgetLogChart'
import { DrinksChart } from '@/components/DrinksChart'
import { WindowToggle, type Window } from '@/components/WindowToggle'

type Tab = 'drinks' | 'budget'

interface DrinkEntry { date: string; count: number }
interface ResetEntry { resetAt: string }
interface BudgetRow { date: string; budget: number; delta: number }

type ListItem =
  | { kind: 'drink'; date: string; count: number }
  | { kind: 'reset'; date: string; resetAt: string }

const WINDOW_MAP: Record<Window, string> = {
  '7d': '7',
  '30d': '30',
  '90d': '90',
  All: 'all',
}

export default function LogPage() {
  const [tab, setTab] = useState<Tab>('drinks')
  const [window, setWindow] = useState<Window>('30d')

  // drinks tab state
  const [logs, setLogs] = useState<DrinkEntry[]>([])
  const [resets, setResets] = useState<ResetEntry[]>([])
  const [timezone, setTimezone] = useState('UTC')
  const [logDate, setLogDate] = useState('')
  const [showDrinksChart, setShowDrinksChart] = useState(false)

  // budget tab state
  const [budgetLog, setBudgetLog] = useState<BudgetRow[]>([])
  const [showBudgetChart, setShowBudgetChart] = useState(false)
  const [budgetLoading, setBudgetLoading] = useState(false)

  useEffect(() => {
    fetch('/api/budget')
      .then((r) => r.json())
      .then((d) => {
        setTimezone(d.timezone)
        setLogDate(d.logDate)
      })
    fetch('/api/drinks')
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs)
        setResets(d.resets)
      })
  }, [])

  useEffect(() => {
    if (tab !== 'budget') return
    setBudgetLoading(true)
    fetch(`/api/budget-log?window=${WINDOW_MAP[window]}`)
      .then((r) => r.json())
      .then((d) => setBudgetLog(d))
      .finally(() => setBudgetLoading(false))
  }, [tab, window])

  // Build drinks chart data client-side
  const drinksChartData = useMemo(() => {
    if (!logDate || logs.length === 0) return []
    const today = parseISO(logDate)
    const drinkMap = Object.fromEntries(logs.map((l) => [l.date, l.count]))

    let startDate: Date
    if (window === 'All') {
      const sorted = [...logs].sort((a, b) => a.date.localeCompare(b.date))
      startDate = parseISO(sorted[0].date)
    } else {
      const days = window === '7d' ? 7 : window === '30d' ? 30 : 90
      startDate = subDays(today, days - 1)
    }

    const rows: { date: string; count: number }[] = []
    let cursor = startDate
    while (format(cursor, 'yyyy-MM-dd') <= logDate) {
      const dateStr = format(cursor, 'yyyy-MM-dd')
      rows.push({ date: dateStr, count: drinkMap[dateStr] ?? 0 })
      cursor = addDays(cursor, 1)
    }
    return rows
  }, [logs, window, logDate])

  // Build merged + sorted list for drinks tab
  const mergedItems: ListItem[] = [
    ...logs.map((l): ListItem => ({ kind: 'drink', date: l.date, count: l.count })),
    ...resets.map((r): ListItem => ({
      kind: 'reset',
      date: currentLogDate(new Date(r.resetAt), timezone),
      resetAt: r.resetAt,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1))


  // budget log list is descending
  const listRows = [...budgetLog].reverse()

  return (
    <div className="px-5">
      {/* tab bar */}
      <div className="flex border-b border-gray-200 mt-1">
        {(['drinks', 'budget'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-1 text-center py-2.5 text-sm transition-colors capitalize',
              tab === t
                ? 'text-gray-900 font-medium border-b-2 border-gray-900 -mb-px'
                : 'text-gray-400'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* drinks tab */}
      {tab === 'drinks' && (
        <div>
          {/* Add entry — full-width outlined button */}
          <Link
            href="/log/new"
            className="flex items-center justify-center gap-2 w-full mt-4 mb-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-900"
          >
            <PlusCircle className="w-4 h-4" />
            Add entry
          </Link>

          {/* Chart toggle */}
          <button
            onClick={() => setShowDrinksChart((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-gray-500 mb-3"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            {showDrinksChart ? 'Hide chart' : 'Show chart'}
          </button>

          {/* Chart + window toggle */}
          {showDrinksChart && (
            <>
              <WindowToggle value={window} onChange={setWindow} />
              <DrinksChart data={drinksChartData} />
            </>
          )}

          {/* Log list */}
          {mergedItems.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No entries yet</p>
          )}

          {mergedItems.map((item, i) =>
            item.kind === 'drink' ? (
              <Link
                key={`d-${item.date}-${i}`}
                href={`/log/${item.date}`}
                className="flex justify-between items-center py-2.5 border-b border-gray-100"
              >
                <span className="text-sm text-gray-900">
                  {format(parseISO(item.date), 'EEE, MMM d')}
                </span>
                <span className="text-sm text-gray-500">
                  {item.count} {item.count === 1 ? 'drink' : 'drinks'}
                </span>
              </Link>
            ) : (
              <ResetMarker key={`r-${item.resetAt}`} date={item.date} />
            )
          )}
        </div>
      )}

      {/* budget tab */}
      {tab === 'budget' && (
        <div>
          <button
            onClick={() => setShowBudgetChart((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-gray-500 mt-4 mb-3"
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            {showBudgetChart ? 'Hide chart' : 'Show chart'}
          </button>

          {showBudgetChart && (
            <>
              <WindowToggle value={window} onChange={setWindow} />
              <BudgetLogChart data={budgetLog} />
            </>
          )}

          {budgetLoading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading…</p>
          ) : (
            <div>
              {listRows.map((row) => (
                <div
                  key={row.date}
                  className="flex justify-between items-center py-2.5 border-b border-gray-100"
                >
                  <span className="text-sm text-gray-900">
                    {format(parseISO(row.date), 'MMM d')}
                  </span>
                  <div className="flex items-center gap-2">
                    <DeltaPill delta={row.delta} />
                    <span
                      className="text-sm font-medium min-w-[36px] text-right"
                      style={{ color: budgetColor(row.budget) }}
                    >
                      {formatBudget(row.budget)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
