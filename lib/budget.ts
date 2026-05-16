import { addDays, format, parseISO } from 'date-fns'
import { currentLogDate, eightAmUtcForDate } from './date'

export type RateSchedule = { rate: number; effective_from: Date }[]

/**
 * Returns the accrual rate in effect at the 8am start of a given log date.
 * Falls back to 0 if no rate is found (should not happen if seed is correct).
 */
function getRateForDay(dateStr: string, timezone: string, rateChanges: RateSchedule): number {
  const dayStart = eightAmUtcForDate(dateStr, timezone)
  const applicable = rateChanges
    .filter((r) => r.effective_from <= dayStart)
    .sort((a, b) => b.effective_from.getTime() - a.effective_from.getTime())
  return applicable.length > 0 ? applicable[0].rate : 0
}

export function calculateBudget(
  resetAt: Date,
  rateChanges: RateSchedule,
  drinkLogs: { log_date: string; drink_count: number }[],
  timezone: string,
  now: Date = new Date()
): number {
  const resetLogDate = currentLogDate(resetAt, timezone)
  const todayLogDate = currentLogDate(now, timezone)

  let accruedAmount = 0
  let cursor = addDays(parseISO(resetLogDate), 1)

  while (format(cursor, 'yyyy-MM-dd') <= todayLogDate) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    if (now >= eightAmUtcForDate(dateStr, timezone)) {
      accruedAmount += getRateForDay(dateStr, timezone, rateChanges)
    }
    cursor = addDays(cursor, 1)
  }

  const totalDrinks = drinkLogs
    .filter((l) => l.log_date >= resetLogDate)
    .reduce((sum, l) => sum + l.drink_count, 0)

  return accruedAmount - totalDrinks
}

/**
 * Builds a day-by-day budget snapshot since the most recent reset.
 * windowDays is undefined for all-time.
 */
export function buildBudgetLog(
  resetAt: Date,
  rateChanges: RateSchedule,
  drinkLogs: { log_date: string; drink_count: number }[],
  timezone: string,
  now: Date = new Date(),
  windowDays?: number
): { date: string; budget: number; delta: number }[] {
  const resetLogDate = currentLogDate(resetAt, timezone)
  const todayLogDate = currentLogDate(now, timezone)

  const drinkMap = Object.fromEntries(drinkLogs.map((l) => [l.log_date, l.drink_count]))

  const rows: { date: string; budget: number; delta: number }[] = []
  let runningBudget = 0
  let cursor = parseISO(resetLogDate)

  while (format(cursor, 'yyyy-MM-dd') <= todayLogDate) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    const isResetDay = dateStr === resetLogDate
    const accrual =
      isResetDay
        ? 0
        : now >= eightAmUtcForDate(dateStr, timezone)
        ? getRateForDay(dateStr, timezone, rateChanges)
        : 0
    const drinks = drinkMap[dateStr] ?? 0
    const delta = accrual - drinks
    runningBudget += delta
    if (!isResetDay || drinks > 0) {
      rows.push({ date: dateStr, budget: runningBudget, delta })
    }
    cursor = addDays(cursor, 1)
  }

  return windowDays ? rows.slice(-windowDays) : rows
}
