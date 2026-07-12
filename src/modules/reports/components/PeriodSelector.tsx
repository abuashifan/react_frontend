import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { MultiPeriodInput } from '../types/reports.types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
const MAX_PERIODS = 12

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

function lastDay(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate()
}

function monthsOfYear(year: number): MultiPeriodInput[] {
  return Array.from({ length: 12 }, (_, i) => {
    const m = i + 1
    return { start_date: `${year}-${pad(m)}-01`, end_date: `${year}-${pad(m)}-${pad(lastDay(year, m))}`, label: MONTHS[i] }
  })
}

function quartersOfYear(year: number): MultiPeriodInput[] {
  return [0, 1, 2, 3].map((q) => {
    const startM = q * 3 + 1
    const endM = startM + 2
    return { start_date: `${year}-${pad(startM)}-01`, end_date: `${year}-${pad(endM)}-${pad(lastDay(year, endM))}`, label: `Q${q + 1}` }
  })
}

interface Props {
  onApply: (periods: MultiPeriodInput[]) => void
  isLoading?: boolean
}

export function PeriodSelector({ onApply, isLoading }: Props) {
  const currentYear = new Date().getFullYear()
  const [periods, setPeriods] = useState<MultiPeriodInput[]>(() => quartersOfYear(currentYear))

  const update = (i: number, patch: Partial<MultiPeriodInput>) => {
    setPeriods((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)))
  }
  const addPeriod = () => {
    if (periods.length >= MAX_PERIODS) return
    const today = new Date().toISOString().slice(0, 10)
    setPeriods((prev) => [...prev, { start_date: today.slice(0, 8) + '01', end_date: today, label: `Periode ${prev.length + 1}` }])
  }
  const removePeriod = (i: number) => setPeriods((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev))

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Preset</span>
        <Button variant="outline" size="sm" className="h-7 px-3 text-[12px]" onClick={() => setPeriods(monthsOfYear(currentYear))}>12 Bulan {currentYear}</Button>
        <Button variant="outline" size="sm" className="h-7 px-3 text-[12px]" onClick={() => setPeriods(quartersOfYear(currentYear))}>Kuartalan {currentYear}</Button>
        <Button variant="outline" size="sm" className="h-7 px-3 text-[12px]" onClick={() => setPeriods([monthsOfYear(currentYear)[new Date().getMonth()], monthsOfYear(currentYear - 1)[new Date().getMonth()]].map((p, i) => ({ ...p, label: i === 0 ? `${currentYear}` : `${currentYear - 1}` })))}>Bulan Ini vs Tahun Lalu</Button>
      </div>

      <div className="space-y-2">
        {periods.map((p, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium text-[#64748b]">Label</Label>
              <Input value={p.label ?? ''} onChange={(e) => update(i, { label: e.target.value })} className="h-8 w-28 text-[13px]" placeholder={`Periode ${i + 1}`} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium text-[#64748b]">Dari</Label>
              <Input type="date" value={p.start_date} onChange={(e) => update(i, { start_date: e.target.value })} className="h-8 w-40 text-[13px]" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-medium text-[#64748b]">Sampai</Label>
              <Input type="date" value={p.end_date} onChange={(e) => update(i, { end_date: e.target.value })} className="h-8 w-40 text-[13px]" />
            </div>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-[12px] text-red-600 hover:text-red-700" onClick={() => removePeriod(i)} disabled={periods.length <= 1}>Hapus</Button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button variant="outline" size="sm" className="h-8 px-3 text-[12px]" onClick={addPeriod} disabled={periods.length >= MAX_PERIODS}>+ Tambah Periode</Button>
        <Button size="sm" className="h-8 bg-[#5c9ead] px-4 text-[12px] hover:bg-[#4a8a9b]" onClick={() => onApply(periods)} disabled={isLoading}>
          {isLoading ? 'Memuat...' : 'Terapkan'}
        </Button>
        <span className="text-[11px] text-[#94a3b8]">Maks {MAX_PERIODS} kolom</span>
      </div>
    </div>
  )
}
