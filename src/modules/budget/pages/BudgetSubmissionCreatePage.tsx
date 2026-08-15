import { useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FormSaveActions } from '@/components/shared/layout/FormSaveActions'
import { FieldError } from '@/components/shared/form/FieldError'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useToast } from '@/hooks/useToast'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { budgetApi } from '../services/budgetApi'
import { useBudgetSubmissionMutations } from '../hooks/useBudgetSubmissions'
import { budgetSubmissionSchema, type BudgetSubmissionFormValues } from '../schemas/budgetSubmissionSchema'

const CREATE_PATH = '/budget/submissions/new'

/**
 * Buat pengajuan anggaran — header saja.
 *
 * Baris anggaran **tidak** diisi di sini; itu pekerjaan `BudgetLineEditor` di
 * halaman detail. Memisahkan keduanya menjaga satu pintu tulis: baris hanya
 * masuk lewat `PUT /budget-submissions/{id}/lines`, yang selalu punya submission
 * pemilik lengkap dengan periode, departemen, dan status persetujuannya.
 */
export default function BudgetSubmissionCreatePage() {
  const { toast } = useToast()
  const { closeRecordTab, replaceRecordTab } = useRecordTab()
  const { create } = useBudgetSubmissionMutations()

  const searchDept = useCallback((q: string) => departemenApi.search(q), [])

  const { data: periodsData } = useQuery({
    queryKey: ['budget', 'periods'],
    queryFn: budgetApi.listPeriods,
  })
  // Pengajuan hanya boleh masuk ke periode yang masih terbuka.
  const periods = (periodsData?.data ?? []).filter((p) => p.status === 'open')

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BudgetSubmissionFormValues>({
    resolver: zodResolver(budgetSubmissionSchema),
    defaultValues: { department_id: null, notes: '' },
  })

  const onSubmit = async (values: BudgetSubmissionFormValues) => {
    try {
      const res = await create.mutateAsync({
        periodId: values.budget_period_id,
        data: { department_id: values.department_id, notes: values.notes || undefined },
      })
      toast.success('Pengajuan anggaran dibuat.')
      replaceRecordTab(CREATE_PATH, {
        label: res.data.department_name ?? 'Perusahaan',
        path: `/budget/submissions/${res.data.id}`,
      })
    } catch (error) {
      // Duplikat ditolak backend dengan pesan yang sudah spesifik ("A company-level
      // submission already exists for this period."). Tampilkan apa adanya di
      // field periode, jangan diganti pesan generik.
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal membuat pengajuan anggaran.'))
    }
  }

  return (
    <FormLayout
      title="Buat Budget"
      breadcrumb={[
        { label: 'Anggaran' },
        { label: 'Daftar Budget', path: '/budget/submissions' },
        { label: 'Buat' },
      ]}
      headerActions={
        <FormSaveActions
          onCancel={() => closeRecordTab(CREATE_PATH, '/budget/submissions')}
          onSave={() => void handleSubmit(onSubmit)()}
          isSaving={isSubmitting}
        />
      }
    >
      <FormSection title="Header">
        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            Periode Anggaran <span className="text-red-500">*</span>
          </Label>
          <Controller
            control={control}
            name="budget_period_id"
            render={({ field }) => (
              <Select
                value={field.value ? String(field.value) : ''}
                onValueChange={(v) => field.onChange(Number(v))}
              >
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue placeholder="Pilih periode..." />
                </SelectTrigger>
                <SelectContent>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError message={errors.budget_period_id?.message} />
          {periods.length === 0 && (
            <p className="text-[11px] text-amber-700">
              Tidak ada periode anggaran yang terbuka. Buat atau buka periode lebih dulu.
            </p>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
            Departemen
          </Label>
          <Controller
            control={control}
            name="department_id"
            render={({ field }) => (
              <SearchableSelect
                value={field.value}
                onChange={(v) => field.onChange(v)}
                onSearch={searchDept}
                placeholder="Semua departemen (tingkat perusahaan)"
                error={errors.department_id?.message}
              />
            )}
          />
          <p className="text-[11px] text-[#64748b]">
            Kosongkan untuk anggaran tingkat perusahaan — satu per periode.
          </p>
        </div>

        <div className="flex flex-col gap-1 md:col-span-2">
          <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Catatan</Label>
          <Textarea {...register('notes')} rows={2} placeholder="Catatan..." className="text-[13px]" />
          <FieldError message={errors.notes?.message} />
        </div>
      </FormSection>

      <p className="mt-3 text-[12px] text-[#64748b]">
        Baris anggaran diisi setelah pengajuan tersimpan, di halaman detail.
      </p>
    </FormLayout>
  )
}
