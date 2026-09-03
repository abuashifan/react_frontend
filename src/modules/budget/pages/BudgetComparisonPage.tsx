import { useState, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FormField } from '@/components/shared/form/FormField'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { formatCurrency } from '@/lib/utils'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { BudgetPeriodSelect } from '../components/BudgetPeriodSelect'
import { ReportExportButton } from '@/modules/reports/components/ReportExportButton'
import { toExcelNumber } from '@/lib/exportXlsx'
import { budgetApi } from '../services/budgetApi'
import type { BudgetParams } from '../types/budget.types'

export default function BudgetComparisonPage() {
  const [periodId, setPeriodId] = useState<number | null>(null)
  const [deptId, setDeptId] = useState<number | null>(null)
  const [projectId, setProjectId] = useState<number | null>(null)
  const [periodFrom, setPeriodFrom] = useState('')
  const [periodTo, setPeriodTo] = useState('')
  const [activeParams, setActiveParams] = useState<BudgetParams | null>(null)

  const searchDept = useCallback((q: string) => departemenApi.search(q), [])
  const searchProject = useCallback((q: string) => proyekApi.search(q), [])

  const { data, isLoading, isError } = useQuery({
    queryKey: ['reports', 'budget-comparison', activeParams],
    queryFn: () => budgetApi.getComparison(activeParams!),
    enabled: !!activeParams?.budget_period_id,
  })
  const result = data?.data

  const handleSubmit = () => {
    if (!periodId) return
    setActiveParams({
      budget_period_id: periodId,
      ...(deptId ? { department_id: deptId } : {}),
      ...(projectId ? { project_id: projectId } : {}),
      ...(periodFrom ? { period_from: periodFrom } : {}),
      ...(periodTo ? { period_to: periodTo } : {}),
    })
  }

  // Filter ditaruh di `toolbar` + `hideHeader`, sama seperti halaman Laporan
  // lain: chrome-nya menempel di bawah baris tab dan tidak ikut scroll bersama
  // tabelnya. Halaman ini belum memakai ReportCompactBar/ReportParameterModal
  // karena parameternya tidak lewat `useReportParams`.
  const toolbar = (
    <div className="flex flex-wrap items-end gap-3 px-4 py-2.5 lg:px-6">
      <BudgetPeriodSelect
        id="period-select"
        value={periodId}
        onChange={setPeriodId}
        required
        emptyHint="Belum ada pagu anggaran."
      />

      <FormField label="Departemen" className="w-44">
        <SearchableSelect value={deptId} onSearch={searchDept} onChange={setDeptId} placeholder="Semua dept" size="sm" />
      </FormField>

      <FormField label="Proyek" className="w-44">
        <SearchableSelect value={projectId} onSearch={searchProject} onChange={setProjectId} placeholder="Semua proyek" size="sm" />
      </FormField>

      <FormField label="Dari" className="w-36">
        <Input type="date" value={periodFrom} onChange={(e) => setPeriodFrom(e.target.value)} className="h-8 text-[12px]" />
      </FormField>

      <FormField label="Sampai" className="w-36">
        <Input type="date" value={periodTo} onChange={(e) => setPeriodTo(e.target.value)} className="h-8 text-[12px]" />
      </FormField>

      <Button size="sm" onClick={handleSubmit} disabled={!periodId || isLoading}>
        {isLoading ? 'Memuat...' : 'Tampilkan'}
      </Button>

      {/*
        `budget_amount`, `actual_amount`, dan `variance` datang sebagai STRING
        dari Laravel (kolom decimal) — di layar sudah di-`parseFloat`, dan
        `toExcelNumber` melakukan hal yang sama untuk selnya.
      */}
      {result && result.rows.length > 0 && (
        <ReportExportButton
          variant="outline"
          filename={`realisasi-vs-anggaran-${result.period.name}`}
          sheetName="Realisasi vs Anggaran"
          headers={['Kode Akun', 'Akun', 'Anggaran', 'Realisasi', 'Selisih', 'Selisih %', 'Over Budget']}
          rows={() => [
            ...result.rows.map((row) => [
              row.account_code ?? '',
              row.account_name ?? '',
              toExcelNumber(row.budget_amount),
              toExcelNumber(row.actual_amount),
              toExcelNumber(row.variance),
              toExcelNumber(row.variance_pct),
              row.over_budget ? 'Ya' : 'Tidak',
            ]),
            [
              '',
              'Total',
              toExcelNumber(result.totals.budget_amount),
              toExcelNumber(result.totals.actual_amount),
              toExcelNumber(result.totals.variance),
              null,
              '',
            ],
          ]}
          formats={['text', 'text', 'currency', 'currency', 'currency', 'number', 'text']}
        />
      )}
    </div>
  )

  return (
    <WorkspaceLayout hideHeader toolbar={toolbar}>
      <div className="space-y-4">
        {!activeParams && !isError && (
          <p className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
            Pilih periode anggaran lalu klik Tampilkan.
          </p>
        )}

        {isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
            Gagal memuat laporan.
          </div>
        )}

        {result && (
          <div className="space-y-3">
            <p className="text-[13px] font-semibold text-[#1e293b]">{result.period.name}</p>
            <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#1e293b]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Akun</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Anggaran</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Realisasi</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Selisih</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {result.rows.map((row) => (
                    <tr key={row.account_id} className={row.over_budget ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-[#f8fafc]'}>
                      <td className="px-3 py-1.5 text-[#334155]">
                        {row.account_code ? `${row.account_code} — ` : ''}{row.account_name ?? '—'}
                        {row.over_budget && <span className="ml-2 text-[10px] font-semibold text-red-600">OVER</span>}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(row.budget_amount))}</td>
                      <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(row.actual_amount))}</td>
                      <td className={`px-3 py-1.5 text-right tabular-nums font-medium ${parseFloat(row.variance) < 0 ? 'text-red-600' : 'text-green-700'}`}>
                        {formatCurrency(parseFloat(row.variance))}
                      </td>
                      <td className="px-3 py-1.5 text-right tabular-nums text-[#64748b]">
                        {row.variance_pct !== null ? `${row.variance_pct.toFixed(1)}%` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <tr>
                    <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(parseFloat(result.totals.budget_amount))}</td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold">{formatCurrency(parseFloat(result.totals.actual_amount))}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-bold ${parseFloat(result.totals.variance) < 0 ? 'text-red-600' : 'text-green-700'}`}>
                      {formatCurrency(parseFloat(result.totals.variance))}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
