import { RotateCcw } from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Props {
  date: string
}

export function ResetMarker({ date }: Props) {
  return (
    <div className="flex items-center gap-2 py-2.5 border-b border-gray-100">
      <RotateCcw className="w-3.5 h-3.5 text-gray-400 shrink-0" />
      <span className="text-sm text-gray-400">
        Budget reset — {format(parseISO(date), 'MMM d, yyyy')}
      </span>
    </div>
  )
}
