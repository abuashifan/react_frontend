import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSaveActions } from '@/components/shared/layout/FormSaveActions'
import { FieldError } from '@/components/shared/form/FieldError'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useToast } from '@/hooks/useToast'
import { useUnsavedFormTracker } from '@/hooks/useUnsavedFormTracker'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass, formatCurrency } from '@/lib/utils'
import { fiscalYearApi } from '@/modules/accounting/services/fiscalYearApi'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { budgetApi } from '../services/budgetApi'
import type { BudgetAllocationInput } from '../types/budget.types'

const schema = z.object({
  name: z.string(),
  fiscal_year: z.string().regex(/^\d{4}$/, 'Tahun tidak valid'),
  period_from: z.string().min(1, 'Tanggal mulai wajib diisi'),
  period_to: z.string().min(1, 'Tanggal selesai wajib diisi'),
})

type FormValues = z.infer<typeof schema>

const FORM_PATH = '/budget/periods/new'

export default function BudgetPeriodFormPage() {
  const { replaceRecordTab, closeRecordTab } = useRecordTab()
  const qc = useQueryClient()
  const { toast } = useToast()

  const { data: fyData } = useQuery({
    queryKey: ['accounting', 'fiscal-year', 'status'],
    queryFn: fiscalYearApi.status,
  })
  const activeFiscalYear = fyData?.data.active_fiscal_year

  const { data: deptData, isLoading: deptLoading } = useQuery({
    queryKey: ['master-data', 'departments', 'all-active'],
    queryFn: () => departemenApi.list({ is_active: true, per_page: 200 }),
  })
  const departments = deptData?.data ?? []

  // department_id -> pagu (string mentah dari input). Departemen yang
  // dikosongkan/nol tidak dikirim — mengisi pagu tidak wajib untuk semua
  // departemen sekaligus, bisa ditambah belakangan lewat tab "Pagu Departemen"
  // di halaman detail.
  const [allocations, setAllocations] = useState<Record<number, string>>({})
  const totalAllocated = Object.values(allocations).reduce((sum, v) => sum + (parseFloat(v) || 0), 0)

  const {
    control,
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', fiscal_year: String(new Date().getFullYear()), period_from: '', period_to: '' },
  })

  // Halaman ini tidak memakai `usePersistentFormDraft`, jadi pelacaknya dipasang
  // langsung — tanpa ini, Tutup Database/Keluar tidak tahu ada isian di sini.
  useUnsavedFormTracker({ control })

  // Prefill sekali saja saat tahun fiskal aktif datang — bukan tiap refetch,
  // supaya tidak menimpa tanggal/nama yang sudah diubah user secara manual.
  const prefilled = useRef(false)
  useEffect(() => {
    if (prefilled.current || !activeFiscalYear) return
    prefilled.current = true
    setValue('name', `Pagu Anggaran ${activeFiscalYear.year}`)
    setValue('fiscal_year', String(activeFiscalYear.year))
    setValue('period_from', activeFiscalYear.start_date)
    setValue('period_to', activeFiscalYear.end_date)
  }, [activeFiscalYear, setValue])

  const createMut = useMutation({
    mutationFn: (data: FormValues) => {
      const department_allocations: BudgetAllocationInput[] = Object.entries(allocations)
        .map(([deptId, amount]) => ({ department_id: Number(deptId), amount: parseFloat(amount) || 0 }))
        .filter((row) => row.amount > 0)

      return budgetApi.createPeriod({
        name: data.name.trim() || undefined,
        fiscal_year: Number(data.fiscal_year),
        fiscal_year_id: activeFiscalYear?.id ?? null,
        period_from: data.period_from,
        period_to: data.period_to,
        department_allocations: department_allocations.length > 0 ? department_allocations : undefined,
      })
    },
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['budget', 'periods'] })
      // Tab "Pagu Baru" berubah jadi tab pagu itu sendiri, bukan menambah
      // tab kedua yang menunjuk record yang sama.
      replaceRecordTab(FORM_PATH, { label: res.data.name, path: `/budget/periods/${res.data.id}` })
    },
    onError: (error) => {
      // Tandai field penyebabnya, jangan hanya "Gagal menyimpan".
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan pagu anggaran.'))
    },
  })

  const submit = handleSubmit((data) => createMut.mutate(data))

  return (
    <FormLayout
      title="Buat Pagu Anggaran"
      breadcrumb={[{ label: 'Anggaran', path: '/budget' }, { label: 'Buat Pagu Anggaran' }]}
      headerActions={
        <FormSaveActions
          onCancel={() => closeRecordTab(FORM_PATH, '/budget')}
          onSave={() => void submit()}
          isSaving={isSubmitting || createMut.isPending}
        />
      }
    >
      <form onSubmit={submit} className="max-w-3xl space-y-4">
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-5 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-[12px]">Nama Pagu Anggaran</Label>
            <Input id="name" {...register('name')} placeholder="Contoh: Pagu Anggaran 2026" className={cn(fieldErrorClass(errors.name))} />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="fiscal_year" className="text-[12px]">Tahun Fiskal</Label>
              <Input id="fiscal_year" type="number" {...register('fiscal_year')} className={cn('tabular-nums', fieldErrorClass(errors.fiscal_year))} />
              <FieldError message={errors.fiscal_year?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="period_from" className="text-[12px]">Dari Tanggal</Label>
              <Input id="period_from" type="date" {...register('period_from')} className={cn(fieldErrorClass(errors.period_from))} />
              <FieldError message={errors.period_from?.message} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="period_to" className="text-[12px]">Sampai Tanggal</Label>
              <Input id="period_to" type="date" {...register('period_to')} className={cn(fieldErrorClass(errors.period_to))} />
              <FieldError message={errors.period_to?.message} />
            </div>
          </div>
          <p className="text-[11px] text-[#64748b]">
            Nama dan tanggal terisi otomatis mengikuti tahun fiskal aktif perusahaan — ubah bila perlu.
          </p>
        </div>

        <div className="rounded-lg border border-[#e2e8f0] bg-white p-5 space-y-3">
          <div>
            <p className="text-[13px] font-semibold text-[#1e293b]">Pagu per Departemen</p>
            <p className="text-[11px] text-[#64748b]">
              Isi pagu langsung per departemen — pagu tingkat perusahaan dihitung otomatis dari jumlah baris di
              bawah, bukan diisi terpisah. Departemen boleh dikosongkan dan ditambah belakangan.
            </p>
          </div>

          {deptLoading && <p className="py-4 text-center text-[12px] text-[#64748b]">Memuat departemen...</p>}

          {!deptLoading && departments.length === 0 && (
            <p className="py-4 text-center text-[12px] text-[#94a3b8]">Belum ada departemen aktif.</p>
          )}

          {!deptLoading && departments.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-[12px]">
                <thead className="bg-[#1e293b]">
                  <tr>
                    <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Departemen</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Pagu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f1f5f9]">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-[#f8fafc]">
                      <td className="px-3 py-1.5 text-[#334155]">
                        {dept.name} <span className="text-[#94a3b8]">({dept.code})</span>
                      </td>
                      <td className="px-3 py-1.5 text-right">
                        <Input
                          type="number"
                          min={0}
                          value={allocations[dept.id] ?? ''}
                          onChange={(e) =>
                            setAllocations((prev) => ({ ...prev, [dept.id]: e.target.value }))
                          }
                          className="h-8 w-40 text-right text-[12px] tabular-nums"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-[#cbd5e1] bg-[#f1f5f9]">
                  <tr>
                    <td className="px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-[#334155]">
                      Total Pagu Perusahaan
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e293b]">
                      {formatCurrency(totalAllocated)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
        {/*
          Rute `/budget/periods/:id` adalah halaman detail, bukan form, jadi
          tidak ada record sebelum/sesudah yang bisa dituju — Prev/Next tidak
          dipasang. Simpan menukar tab ini dengan tab detail pagu.
        */}
      </form>
    </FormLayout>
  )
}
