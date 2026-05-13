import { cn } from '@/lib/utils'

export type Window = '7d' | '30d' | '90d' | 'All'
const OPTIONS: Window[] = ['7d', '30d', '90d', 'All']

interface Props {
  value: Window
  onChange: (w: Window) => void
}

export function WindowToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-1.5 mt-4 mb-4">
      {OPTIONS.map((w) => (
        <button
          key={w}
          onClick={() => onChange(w)}
          className={cn(
            'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
            value === w
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-500 border-gray-200'
          )}
        >
          {w}
        </button>
      ))}
    </div>
  )
}
