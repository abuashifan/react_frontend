import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { budgetApi } from '../services/budgetApi'
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
  const [periodIdStr, setPeriodIdStr] = useState('')
  const [params, setParams] = useState<BudgetParams>({})

  const { data: periodsData } = useQuery({
    queryKey: ['budget', 'periods'],
    queryFn: budgetApi.listPeriods,
  })
  const periods = periodsData?.data ?? []

  const { data, isLoading, isError } = useCashBudget(params)
  const cash = data?.data

  const toolbar = (
    <div className="flex flex-wrap items-end gap-3 px-4 py-2.5 lg:px-6">
      <div>
        <Label htmlFor="cash-period" className="text-[11px] text-[#64748b]">
          Periode Anggaran <span className="text-red-500">*</span>
        </Label>
        <Select value={periodIdStr} onValueChange={setPeriodIdStr}>
          <SelectTrigger id="cash-period" className="h-8 w-52 text-[12px]">
            <SelectValue placeholder="Pilih periode..." />
          </SelectTrigger>
          <SelectContent>
            {periods.map((period) => (
              <SelectItem key={period.id} value={String(period.id)}>{period.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button
        size="sm"
        onClick={() => periodIdStr && setParams({ budget_period_id: Number(periodIdStr) })}
        disabled={!periodIdStr || isLoading}
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
