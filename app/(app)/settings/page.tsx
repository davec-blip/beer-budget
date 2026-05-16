'use client'

import { useEffect, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import { Minus, Plus, LogOut } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { SectionHeader } from '@/components/SectionHeader'
import { TimezoneSelect } from '@/components/TimezoneSelect'

interface Settings {
  accrualRate: number
  timezone: string
  resetAt: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const [settings, setSettings] = useState<Settings | null>(null)
  const [rate, setRate] = useState(1.0)
  const [savedRate, setSavedRate] = useState(1.0)
  const [savingRate, setSavingRate] = useState(false)
  const [timezone, setTimezone] = useState('America/New_York')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetting, setResetting] = useState(false)

  useEffect(() => {
    fetch('/api/budget')
      .then((r) => r.json())
      .then((d) => {
        setSettings(d)
        setRate(d.accrualRate)
        setSavedRate(d.accrualRate)
        setTimezone(d.timezone)
      })
  }, [])

  function changeRate(delta: number) {
    const next = Math.max(0, parseFloat((rate + delta).toFixed(2)))
    setRate(next)
  }

  async function saveRate() {
    setSavingRate(true)
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accrualRate: rate }),
    })
    setSavedRate(rate)
    setSavingRate(false)
  }

  function saveTimezone(tz: string) {
    setTimezone(tz)
    fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timezone: tz }),
    })
  }

  async function handleReset() {
    setResetting(true)
    await fetch('/api/reset', { method: 'POST' })
    setResetting(false)
    setShowResetModal(false)
    // Refresh resetAt display
    fetch('/api/budget')
      .then((r) => r.json())
      .then((d) => setSettings(d))
  }

  const rateChanged = rate !== savedRate

  return (
    <div className="px-5 pt-6 relative">
      <h1 className="text-xl font-medium text-gray-900 mb-6">Settings</h1>

      <SectionHeader label="Budget" />

      {/* Daily accrual rate */}
      <div className="flex justify-between items-center py-3 border-b border-gray-100">
        <span className="text-sm text-gray-900">Daily accrual rate</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2 py-1">
            <button
              onClick={() => changeRate(-0.25)}
              className="w-6 h-6 flex items-center justify-center text-gray-500"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-sm font-medium min-w-[32px] text-center">{rate.toFixed(2)}</span>
            <button
              onClick={() => changeRate(0.25)}
              className="w-6 h-6 flex items-center justify-center text-gray-500"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {rateChanged && (
            <button
              onClick={saveRate}
              disabled={savingRate}
              className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg disabled:opacity-60"
            >
              {savingRate ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>

      {/* Budget started — read-only */}
      <div className="flex justify-between items-center py-3 border-b border-gray-100">
        <span className="text-sm text-gray-900">Budget started</span>
        <span className="text-sm text-gray-500">
          {settings?.resetAt ? format(parseISO(settings.resetAt), 'MMM d, yyyy') : '—'}
        </span>
      </div>

      <SectionHeader label="Account" />

      {/* Timezone */}
      <div className="flex justify-between items-center py-3 border-b border-gray-100">
        <span className="text-sm text-gray-900">Timezone</span>
        <TimezoneSelect value={timezone} onChange={saveTimezone} />
      </div>

      {/* Signed in as */}
      <div className="flex justify-between items-center py-3 border-b border-gray-100">
        <span className="text-sm text-gray-900">Signed in as</span>
        <span className="text-sm text-gray-500">{session?.user?.name ?? '—'}</span>
      </div>

      {/* Sign out */}
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex justify-between items-center w-full py-3 border-b border-gray-100"
      >
        <span className="text-sm text-gray-900">Sign out</span>
        <LogOut className="w-4 h-4 text-gray-400" />
      </button>

      {/* Danger zone */}
      <div className="mt-8 mb-6">
        <button
          onClick={() => setShowResetModal(true)}
          className="w-full py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm font-medium"
        >
          Reset budget to 0
        </button>
      </div>

      {/* Reset confirmation modal */}
      {showResetModal && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20 px-6">
          <div className="bg-white rounded-2xl p-6 w-full max-w-[320px]">
            <h2 className="text-base font-medium text-gray-900 mb-2">Reset budget?</h2>
            <p className="text-sm text-gray-500 mb-5">
              This will set your budget to 0 and start a new tracking period from today.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 py-2 border border-gray-200 rounded-lg text-sm text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={resetting}
                className="flex-1 py-2 bg-red-600 rounded-lg text-sm text-white font-medium disabled:opacity-60"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
