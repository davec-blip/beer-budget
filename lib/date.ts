import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { format, subDays } from 'date-fns'

/**
 * Returns the current "log date" for a user — the 8am-bounded day they are in.
 * Before 8am local time, returns yesterday's date.
 */
export function currentLogDate(now: Date, timezone: string): string {
  const zoned = toZonedTime(now, timezone)
  if (zoned.getHours() < 8) {
    return format(subDays(zoned, 1), 'yyyy-MM-dd')
  }
  return format(zoned, 'yyyy-MM-dd')
}

/**
 * Returns the UTC timestamp of 8am on a given log date in the user's timezone.
 * Used to determine if that day's accrual has ticked yet.
 */
export function eightAmUtcForDate(dateStr: string, timezone: string): Date {
  return fromZonedTime(new Date(`${dateStr}T08:00:00`), timezone)
}
