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
