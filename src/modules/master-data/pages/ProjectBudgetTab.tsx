import { Info, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency } from '@/lib/utils'
import { FinancialBlock } from '@/modules/budget/components/ProjectFinancialBlocks'
import { useProjectBudgetForProject } from '@/modules/budget/hooks/useProjectBudgetForProject'
import type { RecordTabInput } from '@/hooks/useRecordTab'

interface ProjectBudgetTabProps {
  projectId: number
  projectName: string
  onOpenBudget: (record: RecordTabInput) => void
}

/**
 * Ringkasan anggaran proyek — **read-only**.
 *
 * Tab ini dulu berisi editor baris anggaran yang tidak pernah tersambung ke
 * backend: state-nya tidak ikut payload, dan tidak ada field anggaran di
 * `StoreProjectRequest` maupun `ProjectService`. Pengguna mengisi, menekan
 * Simpan, dan datanya hilang tanpa pesan kesalahan.
 *
 * Penggantinya membaca dari mesin anggaran (`/budget/projects/{id}/summary`).
 * Menulis tetap satu pintu: `PUT /budget-submissions/{id}/lines` — hanya di
 * sanalah baris anggaran punya periode, departemen pemilik, status approval, dan
 * nomor versi.
 */
export function ProjectBudgetTab({ projectId, projectName, onOpenBudget }: ProjectBudgetTabProps) {
  const { can } = usePermission()
  const { periods, periodId, setPeriodId, hasNoPeriods, summary, isLoading, isError } =
    useProjectBudgetForProject(projectId)

  const openBudgetModule = () =>
    onOpenBudget({
      label: `Anggaran ${projectName || 'Proyek'}`,
      path: `/budget/projects?project_id=${projectId}&tab=profitability`,
    })

  if (hasNoPeriods) {
    return (
      <section className="rounded-lg border border-[#d9e2e5] bg-white p-6 text-center">
        <p className="text-[13px] text-[#64748b]">Belum ada periode anggaran.</p>
        {can('budgets.manage') && (
          <Button
            size="sm"
            variant="outline"
            className="mt-3 text-[12px]"
            onClick={() => onOpenBudget({ label: 'Periode Anggaran', path: '/budget/periods' })}
          >
            Buat Periode Anggaran
          </Button>
        )}
      </section>
    )
  }

  const hasBudget =
    !!summary &&
    (parseFloat(summary.budget.revenue) !== 0 ||
      parseFloat(summary.budget.cost) !== 0 ||
      summary.revenue_rows.length > 0 ||
      summary.cost_rows.length > 0)

  return (
    <section className="space-y-3 rounded-lg border border-[#d9e2e5] bg-white p-3 lg:p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Label htmlFor="project-budget-period" className="text-[11px] text-[#64748b]">
            Periode Anggaran
          </Label>
          <Select
            value={periodId ? String(periodId) : ''}
            onValueChange={(v) => setPeriodId(Number(v))}
          >
            <SelectTrigger id="project-budget-period" className="h-8 w-52 text-[12px]">
              <SelectValue placeholder="Pilih periode..." />
            </SelectTrigger>
            <SelectContent>
              {periods.map((period) => (
                <SelectItem key={period.id} value={String(period.id)}>{period.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button size="sm" variant="outline" className="text-[12px]" onClick={openBudgetModule}>
          Kelola Anggaran <ExternalLink className="ml-1 h-3 w-3" />
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[12px] text-[#475569]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <p>
          Anggaran proyek dikelola di modul Anggaran, di dalam pengajuan yang punya periode
          dan alur persetujuan. Tab ini hanya menampilkan.
        </p>
      </div>

      {isLoading && <p className="py-6 text-center text-[12px] text-[#64748b]">Memuat anggaran...</p>}

      {isError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700">
          Gagal memuat anggaran proyek.
        </div>
      )}

      {/* "Rp 0" terbaca sebagai "dianggarkan nol". Yang sebenarnya terjadi adalah
          "belum dianggarkan" — bedanya penting, jadi empty state, bukan angka. */}
      {!isLoading && !isError && summary && !hasBudget && (
        <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] px-4 py-6 text-center">
          <p className="text-[13px] text-[#64748b]">
            Proyek ini belum punya baris anggaran pada periode {summary.period.name}.
          </p>
          {can('budgets.submit') && (
            <Button size="sm" variant="outline" className="mt-3 text-[12px]" onClick={openBudgetModule}>
              Buat Anggaran
            </Button>
          )}
        </div>
      )}

      {!isLoading && !isError && summary && hasBudget && (
        <>
          {/* Keterbatasan G11 muncul di UI, bukan hanya di dokumen: menampilkan
              angka yang diam-diam kurang lebih berbahaya daripada tidak menampilkan. */}
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p>{summary.meta.limitation}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <FinancialBlock title="Anggaran" block={summary.budget} />
            <FinancialBlock title="Realisasi" block={summary.actual} />
          </div>

          <AccountRows title="Rincian Pendapatan" rows={summary.revenue_rows} />
          <AccountRows title="Rincian Biaya" rows={summary.cost_rows} />
        </>
      )}
    </section>
  )
}

interface AccountRow {
  account_id?: number | null
  account_code?: string | null
  account_name?: string | null
  budget_amount: string
  actual_amount: string
}

function AccountRows({ title, rows }: { title: string; rows: AccountRow[] }) {
  if (rows.length === 0) return null

  return (
    <div className="overflow-auto rounded-md border border-[#e2e8f0]">
      <table className="w-full text-[12px]">
        <thead className="bg-[#f8fafc]">
          <tr>
            <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              {title}
            </th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Anggaran</th>
            <th className="px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Realisasi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9]">
          {rows.map((row) => (
            <tr key={row.account_id ?? row.account_code} className="hover:bg-[#f8fafc]">
              <td className="px-3 py-1.5 text-[#334155]">
                {row.account_code} — {row.account_name}
              </td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(row.budget_amount))}</td>
              <td className="px-3 py-1.5 text-right tabular-nums">{formatCurrency(parseFloat(row.actual_amount))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
