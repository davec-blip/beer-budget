import { addDays, format, parseISO } from 'date-fns'
import { currentLogDate, eightAmUtcForDate } from './date'

export function calculateBudget(
  resetAt: Date,
  accrualRate: number,
  drinkLogs: { log_date: string; drink_count: number }[],
  timezone: string,
  now: Date = new Date()
): number {
  const resetLogDate = currentLogDate(resetAt, timezone)
  const todayLogDate = currentLogDate(now, timezone)

  // Count 8am boundaries that have passed since the reset day (exclusive of reset day)
  let accruedDays = 0
  let cursor = addDays(parseISO(resetLogDate), 1)

  while (format(cursor, 'yyyy-MM-dd') <= todayLogDate) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    if (now >= eightAmUtcForDate(dateStr, timezone)) accruedDays++
    cursor = addDays(cursor, 1)
  }

  const totalDrinks = drinkLogs
    .filter((l) => l.log_date >= resetLogDate)
    .reduce((sum, l) => sum + l.drink_count, 0)

  // No clamping — budget can go negative
  return accruedDays * accrualRate - totalDrinks
}

/**
 * Builds a day-by-day budget snapshot since the most recent reset.
 * windowDays is undefined for all-time.
 */
export function buildBudgetLog(
  resetAt: Date,
  accrualRate: number,
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
  let cursor = addDays(parseISO(resetLogDate), 1)

  while (format(cursor, 'yyyy-MM-dd') <= todayLogDate) {
    const dateStr = format(cursor, 'yyyy-MM-dd')
    const accrual = now >= eightAmUtcForDate(dateStr, timezone) ? accrualRate : 0
    const drinks = drinkMap[dateStr] ?? 0
    const delta = accrual - drinks
    runningBudget += delta
    rows.push({ date: dateStr, budget: runningBudget, delta })
    cursor = addDays(cursor, 1)
  }

  return windowDays ? rows.slice(-windowDays) : rows
}
