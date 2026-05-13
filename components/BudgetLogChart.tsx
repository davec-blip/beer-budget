'use client'

import { format, parseISO } from 'date-fns'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Row {
  date: string
  budget: number
  delta: number
}

interface Props {
  data: Row[]
}

export function BudgetLogChart({ data }: Props) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-4">
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data}>
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), 'M/d')}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            formatter={(v: number) => [v.toFixed(1), 'Budget']}
            labelFormatter={(l) => format(parseISO(l as string), 'MMM d')}
            contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8 }}
          />
          <Line
            type="monotone"
            dataKey="budget"
            stroke="#1D9E75"
            strokeWidth={1.5}
            dot={false}
            activeDot={{ r: 3, fill: '#1D9E75' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
