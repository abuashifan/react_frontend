import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronRight, Download } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { cn, formatCurrency } from '@/lib/utils'
import { exportCsv } from '@/lib/exportCsv'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { budgetApi } from '../services/budgetApi'
import { useBudgetAnalysis } from '../hooks/useBudgetAnalysis'
import { resolvePreset } from '../constants/analysisPresets'
import type {
  BudgetAnalysisParams,
  BudgetAnalysisRow,
  BudgetGroupBy,
  BudgetState,
} from '../types/budget.types'

/**
 * Antarmuka anggaran terpadu — cerminan "one engine, many views" di sisi UI.
 *
 * Sembilan dari enam belas reporting view (Budget by Account/Cost Center/
 * Project/Period, Revenue/Expense Budget, Budget vs Actual, Variance Analysis,
 * Budget Utilization) dilayani halaman ini lewat filter, bukan sembilan halaman
 * terpisah. Yang berbeda antar view hanya `group_by` dan `direction`.
 */

const GROUP_OPTIONS: { value: BudgetGroupBy; label: string }[] = [
  { value: 'department', label: 'Cost Center' },
  { value: 'project', label: 'Proyek' },
  { value: 'account', label: 'Akun' },
  { value: 'period', label: 'Bulan' },
  { value: 'direction', label: 'Arah' },
]

const STATE_STYLES: Record<BudgetState, { label: string; className: string }> = {
  on_budget: { label: 'Sesuai', className: 'bg-slate-100 text-slate-600' },
  // `under_budget` selalu berarti kabar baik: hemat untuk beban, target
  // terlampaui untuk pendapatan. Backend sudah menormalkan tandanya.
  under_budget: { label: 'Favorable', className: 'bg-green-100 text-green-700' },
  over_budget: { label: 'Unfavorable', className: 'bg-red-100 text-red-700' },
  no_budget: { label: 'Tanpa Anggaran', className: 'bg-amber-100 text-amber-700' },
  no_actual: { label: 'Belum Terpakai', className: 'bg-blue-50 text-blue-700' },
}

/** Urutan drill-down default: perusahaan → cost center → proyek → akun. */
const DRILL_ORDER: BudgetGroupBy[] = ['department', 'project', 'account']

interface DrillStep {
  dimension: BudgetGroupBy
  id: number
  label: string
}

/**
 * Keempat entri Monitoring mendarat di rute yang sama (`/budget/analysis`) dan
 * hanya berbeda `?preset=`. React Router tidak me-remount saat query berubah,
 * jadi tanpa `key` di sini berpindah dari Variance ke Utilization akan mengubah
 * URL tapi membiarkan filter tetap milik preset sebelumnya. Pola `key` yang sama
 * dipakai form record di modul lain.
 */
export default function BudgetAnalysisPage() {
  const [searchParams] = useSearchParams()

  return <BudgetAnalysisPageContent key={searchParams.get('preset') ?? 'default'} />
}

function BudgetAnalysisPageContent() {
  // Preset hanya mengisi state awal — satu arah, saat mount. Setelah itu filter
  // milik pengguna dan URL tidak ikut berubah.
  const [searchParams] = useSearchParams()
  const preset = useMemo(() => resolvePreset(searchParams.get('preset')), [searchParams])

  const [periodIdStr, setPeriodIdStr] = useState('')
  const [groupBy, setGroupBy] = useState<BudgetGroupBy[]>(preset?.groupBy ?? ['account'])
  const [deptId, setDeptId] = useState<number | null>(null)
  const [projectId, setProjectId] = useState<number | null>(null)
  const [direction, setDirection] = useState<'all' | 'revenue' | 'expense'>(preset?.direction ?? 'all')
  const [mode, setMode] = useState<NonNullable<BudgetAnalysisParams['mode']>>(preset?.mode ?? 'summary')
  const [version, setVersion] = useState('active')
  const [allocation, setAllocation] = useState<'annual_row' | 'even'>('annual_row')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [applied, setApplied] = useState<BudgetAnalysisParams | null>(null)
  const [drill, setDrill] = useState<DrillStep[]>([])

  const searchDept = useCallback((q: string) => departemenApi.search(q), [])
  const searchProject = useCallback((q: string) => proyekApi.search(q), [])

  const { data: periodsData } = useQuery({
    queryKey: ['budget', 'periods'],
    queryFn: budgetApi.listPeriods,
  })
  const periods = useMemo(() => periodsData?.data ?? [], [periodsData])

  // Drill-down bukan query terpisah: ia panggilan ulang dengan `group_by` lebih
  // panjang dan nilai baris induk sebagai filter. Karena itu angkanya konsisten
  // di tiap level secara konstruksi.
  const effectiveParams = useMemo<BudgetAnalysisParams | null>(() => {
    if (!applied) return null
    if (drill.length === 0) return applied

    const drillFilters = drill.reduce<Record<string, number>>((acc, step) => {
      acc[`${step.dimension}_id`] = step.id
      return acc
    }, {})

    const nextDimension = DRILL_ORDER.find(
      (dimension) => !drill.some((step) => step.dimension === dimension),
    )

    return {
      ...applied,
      ...drillFilters,
      group_by: nextDimension ? [nextDimension] : applied.group_by,
    }
  }, [applied, drill])

  const { data, isLoading, isError } = useBudgetAnalysis(effectiveParams)
  const result = data?.data

  /**
   * Serapan tertinggi lebih dulu. Diurutkan di klien, bukan lewat parameter
   * backend: seluruh baris sudah ada di memori dan `/budget/analysis` sengaja
   * tidak punya opsi sort — menambahkannya berarti dua tempat memutuskan urutan.
   * `null` (anggaran 0) selalu di bawah; ia bukan "serapan 0%".
   */
  const rows = useMemo(() => {
    if (!result) return []
    if (!preset?.sortByUtilization) return result.rows

    return [...result.rows].sort((a, b) => (b.utilization_pct ?? -1) - (a.utilization_pct ?? -1))
  }, [result, preset])

  /**
   * Pada tampilan yang difilter beban, `variance` **adalah** sisa anggaran, jadi
   * kolomnya diberi nama itu. Pada baris pendapatan artinya berbeda — selisih
   * positif berarti target terlampaui, bukan anggaran yang belum terpakai — jadi
   * di luar filter beban namanya tetap "Selisih". Angkanya satu, hanya labelnya
   * yang mengikuti konteks; tidak ada field kedua di backend.
   */
  const varianceLabel = applied?.direction === 'expense' ? 'Sisa Anggaran' : 'Selisih'

  const handleApply = () => {
    if (!periodIdStr) return
    setDrill([])
    setApplied({
      budget_period_id: Number(periodIdStr),
      group_by: groupBy,
      mode,
      version,
      allocation,
      ...(deptId ? { department_id: deptId } : {}),
      ...(projectId ? { project_id: projectId } : {}),
      ...(direction !== 'all' ? { direction } : {}),
      ...(dateFrom ? { date_from: dateFrom } : {}),
      ...(dateTo ? { date_to: dateTo } : {}),
    })
  }

  const toggleGroup = (dimension: BudgetGroupBy) => {
    setGroupBy((prev) =>
      prev.includes(dimension) ? prev.filter((d) => d !== dimension) : [...prev, dimension],
    )
  }

  const rowLabel = (row: BudgetAnalysisRow): string => {
    const parts: string[] = []
    if (row.department_id !== undefined) parts.push(row.department_name ?? 'Tanpa Cost Center')
    if (row.project_id !== undefined) parts.push(row.project_name ?? 'Tanpa Proyek')
    if (row.account_id !== undefined) {
      parts.push(
        row.account_code ? `${row.account_code} — ${row.account_name ?? ''}` : (row.account_name ?? '—'),
      )
    }
    if (row.period_month !== undefined) {
      // Baris tahunan sengaja tidak dipecah jadi angka bulanan palsu.
      parts.push(row.period_month ?? 'Tahunan (belum dialokasikan)')
    }
    return parts.length > 0 ? parts.join(' · ') : 'Total'
  }

  /** Baris bisa di-drill hanya bila dimensinya punya nilai dan masih ada level berikutnya. */
  const drillTargetOf = (row: BudgetAnalysisRow): DrillStep | null => {
    const currentDimension = effectiveParams?.group_by?.[0]
    if (!currentDimension || !DRILL_ORDER.includes(currentDimension)) return null
    if (drill.some((step) => step.dimension === currentDimension)) return null

    const id = row[`${currentDimension}_id` as 'department_id' | 'project_id' | 'account_id']
    if (!id) return null

    const nextDimension = DRILL_ORDER.find(
      (dimension) =>
        dimension !== currentDimension && !drill.some((step) => step.dimension === dimension),
    )
    if (!nextDimension) return null

    return { dimension: currentDimension, id, label: rowLabel(row) }
  }

  const handleExport = () => {
    if (!result) return
    exportCsv(
      `analisis-anggaran-${result.period.name}.csv`,
      ['Keterangan', 'Arah', 'Anggaran', 'Realisasi', varianceLabel, 'Selisih %', 'Serapan %', 'Status'],
      rows.map((row) => [
        rowLabel(row),
        row.direction,
        row.budget_amount,
        row.actual_amount,
        row.variance,
        row.variance_pct ?? '',
        row.utilization_pct ?? '',
        row.state,
      ]),
    )
  }

  const toolbar = (
    <div className="space-y-2 px-4 py-2.5 lg:px-6">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="analysis-period" className="text-[11px] text-[#64748b]">
            Periode Anggaran <span className="text-red-500">*</span>
          </Label>
          <Select value={periodIdStr} onValueChange={setPeriodIdStr}>
            <SelectTrigger id="analysis-period" className="h-8 w-52 text-[12px]">
              <SelectValue placeholder="Pilih periode..." />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={String(period.id)}>{period.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Label className="text-[11px] text-[#64748b]">Cost Center</Label>
          <SearchableSelect value={deptId} onSearch={searchDept} onChange={setDeptId} placeholder="Semua" size="sm" />
        </div>

        <div className="w-40">
          <Label className="text-[11px] text-[#64748b]">Proyek</Label>
          <SearchableSelect value={projectId} onSearch={searchProject} onChange={setProjectId} placeholder="Semua" size="sm" />
        </div>

        <div>
          <Label htmlFor="analysis-direction" className="text-[11px] text-[#64748b]">Arah</Label>
          <Select value={direction} onValueChange={(v) => setDirection(v as typeof direction)}>
            <SelectTrigger id="analysis-direction" className="h-8 w-32 text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              <SelectItem value="revenue">Pendapatan</SelectItem>
              <SelectItem value="expense">Beban</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="analysis-mode" className="text-[11px] text-[#64748b]">Mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
            <SelectTrigger id="analysis-mode" className="h-8 w-32 text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="summary">Ringkas</SelectItem>
              <SelectItem value="variance">Variance</SelectItem>
              <SelectItem value="detail">Rinci</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="analysis-version" className="text-[11px] text-[#64748b]">Versi</Label>
          <Select value={version} onValueChange={setVersion}>
            <SelectTrigger id="analysis-version" className="h-8 w-32 text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Versi Aktif</SelectItem>
              <SelectItem value="all">Semua Versi</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="analysis-allocation" className="text-[11px] text-[#64748b]">Alokasi</Label>
          <Select
            value={allocation}
            onValueChange={(v) => setAllocation(v as typeof allocation)}
            // Parameter ini hanya berpengaruh saat baris dikelompokkan per bulan.
            // Kontrol yang bisa diubah tapi tidak berefek lebih membingungkan
            // daripada kontrol yang jelas dinonaktifkan.
            disabled={!groupBy.includes('period')}
          >
            <SelectTrigger id="analysis-allocation" className="h-8 w-40 text-[12px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="annual_row">Tahunan apa adanya</SelectItem>
              <SelectItem value="even">Ratakan per bulan</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-[11px] text-[#64748b]">Dari</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-36 text-[12px]" />
        </div>

        <div>
          <Label className="text-[11px] text-[#64748b]">Sampai</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-36 text-[12px]" />
        </div>

        <Button size="sm" onClick={handleApply} disabled={!periodIdStr || isLoading}>
          {isLoading ? 'Memuat...' : 'Tampilkan'}
        </Button>

        {result && (
          <PermissionGuard permission="budgets.export" fallback={null}>
            <Button size="sm" variant="outline" onClick={handleExport}>
              <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
            </Button>
          </PermissionGuard>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-[#64748b]">Kelompokkan:</span>
        {GROUP_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => toggleGroup(option.value)}
            className={cn(
              'rounded border px-2 py-0.5 text-[11px] transition-colors',
              groupBy.includes(option.value)
                ? 'border-[#5c9ead] bg-[#e8f2f5] text-[#326273]'
                : 'border-[#d9e2e5] text-[#64748b] hover:border-[#5c9ead]',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <WorkspaceLayout hideHeader toolbar={toolbar}>
      <div className="space-y-3">
        {!applied && !isError && (
          <p className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
            Pilih periode anggaran, tentukan pengelompokan, lalu klik Tampilkan.
          </p>
        )}

        {isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
            Gagal memuat analisis anggaran.
          </div>
        )}

        {result && (
          <>
            <div className="flex flex-wrap items-center gap-1.5 text-[12px]">
              <button
                type="button"
                onClick={() => setDrill([])}
                className="font-medium text-[#5c9ead] hover:text-[#326273]"
              >
                {result.period.name}
              </button>
              {drill.map((step, index) => (
                <span key={`${step.dimension}-${step.id}`} className="flex items-center gap-1.5">
                  <ChevronRight className="h-3 w-3 text-[#94a3b8]" />
                  <button
                    type="button"
                    onClick={() => setDrill((prev) => prev.slice(0, index + 1))}
                    className="text-[#5c9ead] hover:text-[#326273]"
                  >
                    {step.label}
                  </button>
                </span>
              ))}
            </div>

            {result.meta.is_partial_period && (
              <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
                Realisasi dibatasi {result.meta.date_from} s/d {result.meta.date_to}, sedangkan
                anggarannya tetap satu periode penuh. Serapan di bawah ini wajar terlihat lebih
                rendah dari kenyataannya.
              </div>
            )}

            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#1e293b]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Keterangan</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Anggaran</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Realisasi</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">{varianceLabel}</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Serapan</th>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-[#94a3b8]">
                        Tidak ada baris untuk filter ini.
                      </td>
                    </tr>
                  )}
                  {rows.map((row, index) => {
                    const target = drillTargetOf(row)
                    const state = STATE_STYLES[row.state]

                    return (
                      <tr key={index} className="hover:bg-[#f8fafc]">
                        <td className="px-3 py-1.5 text-[#334155]">
                          {target ? (
                            <button
                              type="button"
                              onClick={() => setDrill((prev) => [...prev, target])}
                              className="inline-flex items-center gap-1 text-left text-[#5c9ead] hover:text-[#326273]"
                            >
                              {rowLabel(row)}
                              <ChevronRight className="h-3 w-3" />
                            </button>
                          ) : (
                            rowLabel(row)
                          )}
                          {/* Baris yang mencampur pendapatan dan beban ditandai
                              apa adanya. "Favorable" tidak punya arti tunggal di
                              baris seperti itu, dan mesin sengaja tidak memilih
                              salah satu konvensi diam-diam. */}
                          {row.direction === 'mixed' && (
                            <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600">
                              Campuran
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(row.budget_amount))}</td>
                        <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(row.actual_amount))}</td>
                        <td
                          className={cn(
                            'px-3 py-1.5 text-right font-medium tabular-nums',
                            parseFloat(row.variance) < 0 ? 'text-red-600' : 'text-green-700',
                          )}
                        >
                          {formatCurrency(parseFloat(row.variance))}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">
                          {/* Anggaran 0 → null, bukan 0% (yang terbaca "belum terpakai"). */}
                          {row.utilization_pct !== null ? `${row.utilization_pct.toFixed(1)}%` : '—'}
                        </td>
                        <td className="px-3 py-1.5">
                          <span className={cn('inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium', state.className)}>
                            {state.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <tr>
                    <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">{formatCurrency(parseFloat(result.totals.budget_amount))}</td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums">{formatCurrency(parseFloat(result.totals.actual_amount))}</td>
                    <td
                      className={cn(
                        'px-3 py-2 text-right font-bold tabular-nums',
                        parseFloat(result.totals.variance) < 0 ? 'text-red-600' : 'text-green-700',
                      )}
                    >
                      {formatCurrency(parseFloat(result.totals.variance))}
                    </td>
                    <td className="px-3 py-2 text-right font-bold tabular-nums text-[#64748b]">
                      {result.totals.utilization_pct !== null ? `${result.totals.utilization_pct.toFixed(1)}%` : '—'}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}
