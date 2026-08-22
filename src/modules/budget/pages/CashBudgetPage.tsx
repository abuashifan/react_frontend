import { useState } from 'react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { BudgetPeriodSelect } from '../components/BudgetPeriodSelect'
import { CashBudgetView } from '../components/CashBudgetView'
import { useCashBudget } from '../hooks/useCashBudget'
import type { BudgetParams } from '../types/budget.types'

/**
 * Cash Budget — lahir dari baris anggaran yang sama dengan Revenue/Expense
 * Budget, bukan angka terpisah. Tidak ada cash ledger baru di belakangnya.
 *
 * Penyajiannya ada di `CashBudgetView`, dipakai bersama tab Arus Kas di halaman
 * Project yang memakai endpoint sama dengan filter proyek.
 */
export default function CashBudgetPage() {
  const [periodId, setPeriodId] = useState<number | null>(null)
  const [params, setParams] = useState<BudgetParams>({})

  const { data, isLoading, isError } = useCashBudget(params)
  const cash = data?.data

  const toolbar = (
    <div className="flex flex-wrap items-end gap-3 px-4 py-2.5 lg:px-6">
      <BudgetPeriodSelect
        id="cash-period"
        value={periodId}
        onChange={setPeriodId}
        required
        emptyHint="Belum ada pagu anggaran."
      />

      <Button
        size="sm"
        onClick={() => periodId && setParams({ budget_period_id: periodId })}
        disabled={!periodId || isLoading}
      >
        {isLoading ? 'Memuat...' : 'Tampilkan'}
      </Button>
    </div>
  )

  return (
    <WorkspaceLayout hideHeader toolbar={toolbar}>
      <div className="space-y-4">
        {!params.budget_period_id && !isError && (
          <p className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
            Pilih periode anggaran lalu klik Tampilkan.
          </p>
        )}

        {isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
            Gagal memuat cash budget.
          </div>
        )}

        {cash && <CashBudgetView cash={cash} />}
      </div>
    </WorkspaceLayout>
  )
}
