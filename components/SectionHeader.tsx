interface Props {
  label: string
}

export function SectionHeader({ label }: Props) {
  return (
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2 mt-5">
      {label}
    </p>
  )
}
