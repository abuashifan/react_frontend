import { useState } from 'react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { BudgetPeriodSelect } from '../components/BudgetPeriodSelect'
import { CashBudgetView } from '../components/CashBudgetView'
import { SECTION_LABELS } from '../constants/cashBudgetSections'
import { ReportExportButton } from '@/modules/reports/components/ReportExportButton'
import { toExcelNumber } from '@/lib/exportXlsx'
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

      {/*
        Sheet-nya diratakan jadi Bagian · Keterangan · Anggaran · Realisasi.
        Kas masuk dan keluar realisasi per klasifikasi ikut ditulis meski di
        layar hanya Net-nya yang muat — angkanya sudah ada di respons, dan
        menyembunyikannya di file justru memaksa orang menghitung ulang.
      */}
      {cash && (
        <ReportExportButton
          variant="outline"
          filename={`cash-budget-${cash.period.name}`}
          sheetName="Cash Budget"
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
      )}
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
