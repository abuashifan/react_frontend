import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FilterSection } from '@/components/shared/layout/FilterSidebar'
import { getDateRangePreset } from './dateRangeUtils'

interface DateRangeFilterSectionProps {
  title?: string
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
  note?: string
}

export function DateRangeFilterSection({
  title = 'Periode',
  from,
  to,
  onChange,
  note,
}: DateRangeFilterSectionProps) {
  const update = (nextFrom: string, nextTo: string) => onChange({ from: nextFrom, to: nextTo })

  return (
    <FilterSection title={title}>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748b]">Dari</span>
          <Input
            type="date"
            value={from}
            onChange={(event) => update(event.target.value, to)}
            className="h-8 text-[12px]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[#64748b]">Sampai</span>
          <Input
            type="date"
            value={to}
            onChange={(event) => update(from, event.target.value)}
            className="h-8 text-[12px]"
          />
        </div>

        <div className="flex flex-wrap gap-1 pt-1">
          {[
            { label: 'Hari ini', preset: 'today' as const },
            { label: 'Minggu ini', preset: 'week' as const },
            { label: 'Bulan ini', preset: 'month' as const },
            { label: 'Tahun ini', preset: 'year' as const },
          ].map((item) => (
            <Button
              key={item.preset}
              type="button"
              variant="outline"
              size="sm"
              className="h-6 rounded px-2 text-[11px] text-[#64748b] hover:border-[#5c9ead] hover:text-[#326273]"
              onClick={() => onChange(getDateRangePreset(item.preset))}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </div>
      {note && <p className="pt-2 text-[11px] leading-4 text-[#94a3b8]">{note}</p>}
    </FilterSection>
  )
}
