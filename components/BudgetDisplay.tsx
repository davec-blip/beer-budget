import { budgetColor, formatBudget } from '@/lib/utils'

interface Props {
  budget: number
}

export function BudgetDisplay({ budget }: Props) {
  return (
    <div className="flex flex-col items-center">
      <span
        style={{ color: budgetColor(budget) }}
        className="text-[72px] font-medium leading-none"
      >
        {formatBudget(budget)}
      </span>
      <p className="text-sm text-gray-500 mt-1">beers in budget</p>
    </div>
  )
}
