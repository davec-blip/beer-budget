'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { format, parseISO, subDays } from 'date-fns'
import { PlusCircle, LineChart as LineChartIcon } from 'lucide-react'
import { cn, budgetColor } from '@/lib/utils'
import { currentLogDate } from '@/lib/date'
import { DeltaPill } from '@/components/DeltaPill'
import { ResetMarker } from '@/components/ResetMarker'
import { BudgetLogChart } from '@/components/BudgetLogChart'
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

  // drinks tab state
  const [logs, setLogs] = useState<DrinkEntry[]>([])
  const [resets, setResets] = useState<ResetEntry[]>([])
  const [timezone, setTimezone] = useState('UTC')
  const [logDate, setLogDate] = useState('')

  // budget tab state
  const [budgetLog, setBudgetLog] = useState<BudgetRow[]>([])
  const [window, setWindow] = useState<Window>('30d')
  const [showChart, setShowChart] = useState(false)
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

  // Build merged + sorted list for drinks tab
  const mergedItems: ListItem[] = [
    ...logs.map((l): ListItem => ({ kind: 'drink', date: l.date, count: l.count })),
    ...resets.map((r): ListItem => ({
      kind: 'reset',
      date: currentLogDate(new Date(r.resetAt), timezone),
      resetAt: r.resetAt,
    })),
  ].sort((a, b) => (a.date < b.date ? 1 : -1))

  const cutoff = logDate ? format(subDays(parseISO(logDate), 6), 'yyyy-MM-dd') : ''
  const recent = mergedItems.filter((i) => i.date >= cutoff)
  const older = mergedItems.filter((i) => i.date < cutoff)

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
          <Link href="/log/new" className="flex items-center gap-1.5 text-sm text-blue-600 mt-4 mb-4">
            <PlusCircle className="w-4 h-4" />
            Add entry
          </Link>

          {mergedItems.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">No entries yet</p>
          )}

          {recent.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
                Past 7 days
              </p>
              {recent.map((item, i) =>
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
            </>
          )}

          {older.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 mt-5">
                Older
              </p>
              {older.map((item, i) =>
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
            </>
          )}
        </div>
      )}

      {/* budget tab */}
      {tab === 'budget' && (
        <div>
          <WindowToggle value={window} onChange={setWindow} />

          <button
            onClick={() => setShowChart((s) => !s)}
            className="flex items-center gap-1.5 text-xs text-gray-500 mb-3"
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            {showChart ? 'Hide chart' : 'Show chart'}
          </button>

          {showChart && <BudgetLogChart data={budgetLog} />}

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
                      {row.budget.toFixed(1)}
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
