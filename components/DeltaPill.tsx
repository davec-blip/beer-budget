import { cn } from '@/lib/utils'

interface Props {
  delta: number
}

export function DeltaPill({ delta }: Props) {
  const isPos = delta > 0
  const isNeg = delta < 0
  return (
    <span
      className={cn(
        'text-xs font-medium px-2 py-0.5 rounded-full',
        isPos && 'bg-[#E1F5EE] text-[#0F6E56]',
        isNeg && 'bg-[#FCEBEB] text-[#A32D2D]',
        !isPos && !isNeg && 'bg-[#F1EFE8] text-[#5F5E5A]'
      )}
    >
      {isPos ? '+' : ''}
      {delta.toFixed(1)}
    </span>
  )
}
