'use client'

interface Props {
  value: string
  onChange: (tz: string) => void
}

export function TimezoneSelect({ value, onChange }: Props) {
  const zones = Intl.supportedValuesOf('timeZone')
  return (
    <select
      className="text-sm text-gray-500 bg-transparent border-none focus:outline-none text-right max-w-[180px]"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {zones.map((tz) => (
        <option key={tz} value={tz}>
          {tz}
        </option>
      ))}
    </select>
  )
}
