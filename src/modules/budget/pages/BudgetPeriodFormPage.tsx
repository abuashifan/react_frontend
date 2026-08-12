import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSaveActions } from '@/components/shared/layout/FormSaveActions'
import { FieldError } from '@/components/shared/form/FieldError'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useRecordTab } from '@/hooks/useRecordTab'
import { useToast } from '@/hooks/useToast'
import { useUnsavedFormTracker } from '@/hooks/useUnsavedFormTracker'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { budgetApi } from '../services/budgetApi'

const schema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
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

  const {
    control,
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fiscal_year: String(new Date().getFullYear()) },
  })

  // Halaman ini tidak memakai `usePersistentFormDraft`, jadi pelacaknya dipasang
  // langsung — tanpa ini, Tutup Database/Keluar tidak tahu ada isian di sini.
  useUnsavedFormTracker({ control })

  const createMut = useMutation({
    mutationFn: (data: FormValues) => budgetApi.createPeriod({ ...data, fiscal_year: Number(data.fiscal_year) }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['budget', 'periods'] })
      // Tab "Periode Baru" berubah jadi tab periode itu sendiri, bukan menambah
      // tab kedua yang menunjuk record yang sama.
      replaceRecordTab(FORM_PATH, { label: res.data.name, path: `/budget/periods/${res.data.id}` })
    },
    onError: (error) => {
      // Tandai field penyebabnya, jangan hanya "Gagal menyimpan".
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan periode anggaran.'))
    },
  })

  const submit = handleSubmit((data) => createMut.mutate(data))

  return (
    <FormLayout
      title="Buat Periode Anggaran"
      breadcrumb={[{ label: 'Anggaran', path: '/budget' }, { label: 'Buat Periode' }]}
      headerActions={
        <FormSaveActions
          onCancel={() => closeRecordTab(FORM_PATH, '/budget')}
          onSave={() => void submit()}
          isSaving={isSubmitting || createMut.isPending}
        />
      }
    >
      <form onSubmit={submit} className="max-w-lg space-y-4">
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-5 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-[12px]">Nama Anggaran</Label>
            <Input id="name" {...register('name')} placeholder="Contoh: Anggaran Operasional 2026" className={cn(fieldErrorClass(errors.name))} />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="fiscal_year" className="text-[12px]">Tahun Fiskal</Label>
            <Input id="fiscal_year" type="number" {...register('fiscal_year')} className={cn('tabular-nums', fieldErrorClass(errors.fiscal_year))} />
            <FieldError message={errors.fiscal_year?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
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
        </div>
        {/*
          Rute `/budget/periods/:id` adalah halaman detail, bukan form, jadi
          tidak ada record sebelum/sesudah yang bisa dituju — Prev/Next tidak
          dipasang. Simpan menukar tab ini dengan tab detail periode.
        */}
      </form>
    </FormLayout>
  )
}
