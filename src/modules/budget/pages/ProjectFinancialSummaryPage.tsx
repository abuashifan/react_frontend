import { useCallback, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Info } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FormField } from '@/components/shared/form/FormField'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { cn, formatCurrency } from '@/lib/utils'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { BudgetPeriodSelect } from '../components/BudgetPeriodSelect'
import { CashBudgetView } from '../components/CashBudgetView'
import { SECTION_LABELS } from '../constants/cashBudgetSections'
import { FinancialBlock, VarianceItem } from '../components/ProjectFinancialBlocks'
import { ProjectTransactionsTable } from '../components/ProjectTransactionsTable'
import { ReportExportButton } from '@/modules/reports/components/ReportExportButton'
import { toExcelNumber } from '@/lib/exportXlsx'
import { useProjectCashFlow, useProjectFinancials } from '../hooks/useProjectFinancials'
import type { BudgetAnalysisRow, BudgetParams, ProjectFinancialSummary } from '../types/budget.types'

/**
 * Halaman Project — lima entri menu, satu halaman.
 *
 * Empat dari lima tab dilayani endpoint yang sama (`/budget/projects/{id}/summary`).
 * Memecahnya jadi lima halaman berarti lima kali memilih proyek dan periode, dan
 * lima kali memanggil endpoint yang identik. Tab bertukar tanpa fetch ulang.
 *
 * Semua angkanya turunan — Profit dan Margin tidak pernah disimpan, dihitung dari
 * baris anggaran dan ledger yang sama dengan view lain.
 */

const TABS = ['budget', 'actual', 'profitability', 'cash-flow', 'transactions'] as const
type ProjectTab = (typeof TABS)[number]

function resolveTab(value: string | null): ProjectTab {
  // Tab tak dikenal jatuh ke default, bukan error — URL bisa datang dari
  // bookmark lama atau tautan yang salah ketik.
  return TABS.includes(value as ProjectTab) ? (value as ProjectTab) : 'profitability'
}

/**
 * Kelima entri Project mendarat di rute yang sama dan hanya berbeda `?tab=`.
 * React Router tidak me-remount saat query berubah, jadi tanpa `key` berpindah
 * entri menu akan mengubah URL tanpa memindahkan tab yang aktif.
 */
export default function ProjectFinancialSummaryPage() {
  const [searchParams] = useSearchParams()

  return (
    <ProjectFinancialSummaryPageContent
      key={`${searchParams.get('tab') ?? 'default'}|${searchParams.get('project_id') ?? ''}`}
    />
  )
}

function ProjectFinancialSummaryPageContent() {
  // Query string mengisi state awal saja — satu arah, saat mount. Tab "Anggaran"
  // di form Proyek menautkan ke sini dengan proyek sudah terpilih.
  const [searchParams] = useSearchParams()
  const initialProjectId = Number(searchParams.get('project_id')) || null

  const [periodId, setPeriodId] = useState<number | null>(null)
  const [projectId, setProjectId] = useState<number | null>(initialProjectId)
  const [appliedProjectId, setAppliedProjectId] = useState<number | null>(null)
  const [params, setParams] = useState<BudgetParams>({})
  const [tab, setTab] = useState<ProjectTab>(() => resolveTab(searchParams.get('tab')))

  const searchProject = useCallback((q: string) => proyekApi.search(q), [])

  const { data, isLoading, isError } = useProjectFinancials(appliedProjectId, params)
  const summary = data?.data

  // Arus kas proyek dipanggil hanya saat tabnya dibuka — endpointnya berbeda dari
  // `summary`, jadi memuatnya di muka jadi request yang sering tak terpakai.
  const { data: cashData, isLoading: isCashLoading, isError: isCashError } = useProjectCashFlow(
    tab === 'cash-flow' ? appliedProjectId : null,
    params,
  )

  /**
   * Tombol ekspor mengikuti tab yang sedang dibuka — kelima tab memakai bentuk
   * data berbeda. Tab Transaksi punya tombolnya sendiri di dalam
   * `ProjectTransactionsTable`, karena filter Arah/Akun-nya ada di sana dan
   * file harus ikut filter itu.
   */
  const exportButton = (() => {
    if (!summary || tab === 'transactions') return null
    const slug = `${summary.project.code}-${summary.period.name}`

    if (tab === 'cash-flow') {
      const cash = cashData?.data
      if (!cash) return null
      return (
        <ReportExportButton
          variant="outline"
          filename={`arus-kas-project-${slug}`}
          sheetName="Arus Kas Project"
          headers={['Bagian', 'Keterangan', 'Anggaran', 'Realisasi']}
          rows={() => [
            ['Ringkasan', 'Saldo Awal Kas', toExcelNumber(cash.beginning_cash), toExcelNumber(cash.beginning_cash)],
            ['Ringkasan', 'Kas Masuk', toExcelNumber(cash.budgeted.inflow), toExcelNumber(cash.actual.inflow)],
            ['Ringkasan', 'Kas Keluar', toExcelNumber(cash.budgeted.outflow), toExcelNumber(cash.actual.outflow)],
            ['Ringkasan', 'Arus Kas Bersih', toExcelNumber(cash.budgeted.net), toExcelNumber(cash.actual.net)],
            ['Ringkasan', 'Saldo Akhir Kas', toExcelNumber(cash.budgeted.ending_cash), toExcelNumber(cash.actual.ending_cash)],
            ...cash.sections.flatMap((section) => [
              [SECTION_LABELS[section.section] ?? section.section, 'Kas Masuk', toExcelNumber(section.budgeted_inflow), toExcelNumber(section.actual_inflow)],
              [SECTION_LABELS[section.section] ?? section.section, 'Kas Keluar', toExcelNumber(section.budgeted_outflow), toExcelNumber(section.actual_outflow)],
              [SECTION_LABELS[section.section] ?? section.section, 'Net', toExcelNumber(section.budgeted_net), toExcelNumber(section.actual_net)],
            ]),
          ]}
          formats={['text', 'text', 'currency', 'currency']}
        />
      )
    }

    if (tab === 'profitability') {
      return (
        <ReportExportButton
          variant="outline"
          filename={`profitabilitas-project-${slug}`}
          sheetName="Profitabilitas Project"
          headers={['Keterangan', 'Anggaran', 'Realisasi', 'Selisih']}
          rows={() => [
            ['Pendapatan', toExcelNumber(summary.budget.revenue), toExcelNumber(summary.actual.revenue), toExcelNumber(summary.variance.revenue)],
            ['Biaya', toExcelNumber(summary.budget.cost), toExcelNumber(summary.actual.cost), toExcelNumber(summary.variance.cost)],
            ['Laba', toExcelNumber(summary.budget.profit), toExcelNumber(summary.actual.profit), toExcelNumber(summary.variance.profit)],
            ['Margin %', toExcelNumber(summary.budget.margin_pct), toExcelNumber(summary.actual.margin_pct), null],
            ['Serapan Biaya %', null, toExcelNumber(summary.cost_utilization_pct), null],
          ]}
          formats={['text', 'currency', 'currency', 'currency']}
        />
      )
    }

    // Tab Anggaran & Realisasi memakai baris akun yang sama; yang berbeda hanya
    // kolom mana yang disorot di layar. File membawa keduanya supaya angkanya
    // bisa langsung disandingkan.
    const isBudgetTab = tab === 'budget'
    return (
      <ReportExportButton
        variant="outline"
        filename={`${isBudgetTab ? 'anggaran' : 'realisasi'}-project-${slug}`}
        sheetName={isBudgetTab ? 'Anggaran Project' : 'Realisasi Project'}
        headers={['Kelompok', 'Kode Akun', 'Akun', 'Anggaran', 'Realisasi', 'Selisih']}
        rows={() => [
          ...summary.revenue_rows.map((row) => [
            'Pendapatan',
            row.account_code ?? '',
            row.account_name ?? '',
            toExcelNumber(row.budget_amount),
            toExcelNumber(row.actual_amount),
            toExcelNumber(row.variance),
          ]),
          ...summary.cost_rows.map((row) => [
            'Biaya',
            row.account_code ?? '',
            row.account_name ?? '',
            toExcelNumber(row.budget_amount),
            toExcelNumber(row.actual_amount),
            toExcelNumber(row.variance),
          ]),
          ['Total', '', 'Pendapatan', toExcelNumber(summary.budget.revenue), toExcelNumber(summary.actual.revenue), toExcelNumber(summary.variance.revenue)],
          ['Total', '', 'Biaya', toExcelNumber(summary.budget.cost), toExcelNumber(summary.actual.cost), toExcelNumber(summary.variance.cost)],
          ['Total', '', 'Laba', toExcelNumber(summary.budget.profit), toExcelNumber(summary.actual.profit), toExcelNumber(summary.variance.profit)],
        ]}
        formats={['text', 'text', 'text', 'currency', 'currency', 'currency']}
      />
    )
  })()

  const toolbar = (
    <div className="flex flex-wrap items-end gap-3 px-4 py-2.5 lg:px-6">
      <BudgetPeriodSelect
        id="project-period"
        value={periodId}
        onChange={setPeriodId}
        required
        emptyHint="Belum ada pagu anggaran."
      />

      <FormField label="Proyek" required className="w-56">
        <SearchableSelect value={projectId} onSearch={searchProject} onChange={setProjectId} placeholder="Pilih proyek..." size="sm" />
      </FormField>

      <Button
        size="sm"
        onClick={() => {
          if (!periodId || !projectId) return
          setAppliedProjectId(projectId)
          setParams({ budget_period_id: periodId })
        }}
        disabled={!periodId || !projectId || isLoading}
      >
        {isLoading ? 'Memuat...' : 'Tampilkan'}
      </Button>

      {exportButton}
    </div>
  )

  return (
    <WorkspaceLayout hideHeader toolbar={toolbar}>
      <div className="space-y-4">
        {!summary && !isError && (
          <p className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
            Pilih periode anggaran dan proyek, lalu klik Tampilkan.
          </p>
        )}

        {isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
            Gagal memuat ringkasan finansial proyek.
          </div>
        )}

        {summary && (
          <>
            <div>
              <h2 className="text-[15px] font-semibold text-[#1e293b]">
                {summary.project.code} — {summary.project.name}
              </h2>
              <p className="text-[12px] text-[#64748b]">{summary.period.name}</p>
            </div>

            {/* Keterbatasan ini muncul di UI, bukan hanya di dokumen: menampilkan
                angka yang diam-diam kurang lebih berbahaya daripada tidak
                menampilkan. Ditaruh di luar tab supaya berlaku untuk semuanya. */}
            <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>{summary.meta.limitation}</p>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as ProjectTab)} className="space-y-3">
              <TabsList className="h-9">
                <TabsTrigger value="budget" className="text-[12px]">Anggaran</TabsTrigger>
                <TabsTrigger value="actual" className="text-[12px]">Realisasi</TabsTrigger>
                <TabsTrigger value="profitability" className="text-[12px]">Profitabilitas</TabsTrigger>
                <TabsTrigger value="cash-flow" className="text-[12px]">Arus Kas</TabsTrigger>
                <TabsTrigger value="transactions" className="text-[12px]">Transaksi</TabsTrigger>
              </TabsList>

              <TabsContent value="budget" className="space-y-3">
                <div className="md:max-w-sm">
                  <FinancialBlock title="Anggaran" block={summary.budget} />
                </div>
                <AccountRows title="Anggaran Pendapatan" rows={summary.revenue_rows} column="budget_amount" />
                <AccountRows title="Anggaran Biaya" rows={summary.cost_rows} column="budget_amount" />
              </TabsContent>

              <TabsContent value="actual" className="space-y-3">
                <div className="md:max-w-sm">
                  <FinancialBlock title="Realisasi" block={summary.actual} />
                </div>
                <AccountRows title="Realisasi Pendapatan" rows={summary.revenue_rows} column="actual_amount" />
                <AccountRows title="Realisasi Biaya" rows={summary.cost_rows} column="actual_amount" />
              </TabsContent>

              <TabsContent value="profitability" className="space-y-3">
                <ProfitabilityPanel summary={summary} />
              </TabsContent>

              <TabsContent value="cash-flow">
                {isCashLoading && <p className="py-6 text-center text-[12px] text-[#64748b]">Memuat arus kas...</p>}
                {isCashError && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
                    Gagal memuat arus kas proyek.
                  </div>
                )}
                {cashData?.data && <CashBudgetView cash={cashData.data} />}
              </TabsContent>

              <TabsContent value="transactions">
                <ProjectTransactionsTable projectId={appliedProjectId} params={params} />
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </WorkspaceLayout>
  )
}

function ProfitabilityPanel({ summary }: { summary: ProjectFinancialSummary }) {
  return (
    <>
      <div className="grid gap-3 md:grid-cols-2">
        <FinancialBlock title="Anggaran" block={summary.budget} />
        <FinancialBlock title="Realisasi" block={summary.actual} />
      </div>

      <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-[#64748b]">Selisih</p>
        <dl className="grid gap-2 text-[12px] md:grid-cols-3">
          <VarianceItem label="Pendapatan" value={summary.variance.revenue} />
          <VarianceItem label="Biaya" value={summary.variance.cost} />
          <VarianceItem label="Laba" value={summary.variance.profit} />
        </dl>
        <p className="mt-3 text-[11px] text-[#64748b]">
          Serapan biaya:{' '}
          <span className="tabular-nums font-medium text-[#334155]">
            {summary.cost_utilization_pct !== null ? `${summary.cost_utilization_pct.toFixed(1)}%` : '—'}
          </span>
        </p>
      </div>
    </>
  )
}

function AccountRows({
  title,
  rows,
  column,
}: {
  title: string
  rows: BudgetAnalysisRow[]
  column: 'budget_amount' | 'actual_amount'
}) {
  if (rows.length === 0) return null

  const total = rows.reduce((sum, row) => sum + parseFloat(row[column]), 0)

  return (
    <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
      <table className="w-full text-[12px]">
        <thead className="bg-[#f8fafc]">
          <tr>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{title}</th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Jumlah</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9]">
          {rows.map((row) => (
            <tr key={row.account_id ?? row.account_code} className="hover:bg-[#f8fafc]">
              <td className="px-3 py-1.5 text-[#334155]">{row.account_code} — {row.account_name}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(row[column]))}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
          <tr>
            <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">Total</td>
            <td className={cn('px-3 py-2 text-right font-bold tabular-nums', total < 0 && 'text-red-600')}>
              {formatCurrency(total)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
