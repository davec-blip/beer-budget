import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function budgetColor(value: number): string {
  if (value > 0) return '#1D9E75'
  if (value === 0) return '#BA7517'
  return '#E24B4A'
}

/** Shows 2 decimal places only when needed (e.g. 4.0 → "4.0", 0.25 → "0.25") */
export function formatBudget(value: number): string {
  return Math.round(value * 100) % 10 !== 0 ? value.toFixed(2) : value.toFixed(1)
}
