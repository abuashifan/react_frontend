import { useCallback } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FormSaveActions } from '@/components/shared/layout/FormSaveActions'
import { FormField } from '@/components/shared/form/FormField'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Textarea } from '@/components/ui/textarea'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useToast } from '@/hooks/useToast'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { BudgetPeriodSelect } from '../components/BudgetPeriodSelect'
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

  const {
    control,
    register,
    handleSubmit,
    getValues,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BudgetSubmissionFormValues>({
    resolver: zodResolver(budgetSubmissionSchema),
    defaultValues: { department_id: null, notes: '' },
  })

  // Form ini di-unmount begitu user pindah tab, jadi tanpa draft isian periode/
  // departemen/catatan hilang tanpa peringatan. Hook ini sekaligus mendaftarkan
  // form ke penjaga "ada isian belum tersimpan" (Tutup Database / Keluar).
  const formDraft = usePersistentFormDraft<BudgetSubmissionFormValues, never>({
    draftKey: 'budget.submission.new',
    control,
    getValues,
    reset,
  })

  const onSubmit = async (values: BudgetSubmissionFormValues) => {
    try {
      const res = await create.mutateAsync({
        periodId: values.budget_period_id,
        data: { department_id: values.department_id, notes: values.notes || undefined },
      })
      toast.success('Pengajuan anggaran dibuat.')
      formDraft.clearDraft()
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
        <Controller
          control={control}
          name="budget_period_id"
          render={({ field }) => (
            <BudgetPeriodSelect
              value={field.value ?? null}
              onChange={(v) => field.onChange(v)}
              required
              // Pengajuan hanya boleh masuk ke pagu yang masih terbuka.
              openOnly
              className="w-full"
              error={errors.budget_period_id?.message}
              emptyHint="Tidak ada pagu anggaran yang terbuka. Buat atau buka pagu lebih dulu."
            />
          )}
        />

        <FormField
          label="Departemen"
          error={errors.department_id?.message}
          hint="Kosongkan untuk anggaran tingkat perusahaan — satu per periode."
        >
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
        </FormField>

        <FormField label="Catatan" error={errors.notes?.message} className="md:col-span-2">
          <Textarea {...register('notes')} rows={2} placeholder="Catatan..." className="text-[13px]" />
        </FormField>
      </FormSection>

      <p className="mt-3 text-[12px] text-[#64748b]">
        Baris anggaran diisi setelah pengajuan tersimpan, di halaman detail.
      </p>
    </FormLayout>
  )
}
