'use client'

import { format, parseISO } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface Row {
  date: string
  count: number
}

interface Props {
  data: Row[]
}

export function DrinksChart({ data }: Props) {
  return (
    <div className="bg-gray-50 rounded-lg p-3 mb-4">
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} barSize={8}>
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), 'M/d')}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis hide allowDecimals={false} />
          <Tooltip
            formatter={(v: number) => [v, 'Drinks']}
            labelFormatter={(l) => format(parseISO(l as string), 'MMM d')}
            contentStyle={{ fontSize: 12, border: '1px solid #E5E7EB', borderRadius: 8 }}
          />
          <Bar dataKey="count" fill="#1D9E75" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
