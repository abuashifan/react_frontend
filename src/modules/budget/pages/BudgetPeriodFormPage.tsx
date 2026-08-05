import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FieldError } from '@/components/shared/form/FieldError'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
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

export default function BudgetPeriodFormPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { fiscal_year: String(new Date().getFullYear()) },
  })

  const createMut = useMutation({
    mutationFn: (data: FormValues) => budgetApi.createPeriod({ ...data, fiscal_year: Number(data.fiscal_year) }),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: ['budget', 'periods'] })
      navigate(`/budget/periods/${res.data.id}`)
    },
    onError: (error) => {
      // Tandai field penyebabnya, jangan hanya "Gagal menyimpan".
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan periode anggaran.'))
    },
  })

  return (
    <WorkspaceLayout
      title="Buat Periode Anggaran"
      breadcrumb={[{ label: 'Anggaran', path: '/budget' }, { label: 'Buat Periode' }]}
    >
      <form
        onSubmit={handleSubmit((data) => createMut.mutate(data))}
        className="mx-auto max-w-lg space-y-4"
      >
        <div className="rounded-lg border border-[#e2e8f0] bg-white p-5 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="name" className="text-[12px]">Nama Periode</Label>
            <Input id="name" {...register('name')} placeholder="Anggaran 2026" className={cn(fieldErrorClass(errors.name))} />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="fiscal_year" className="text-[12px]">Tahun Fiskal</Label>
            <Input id="fiscal_year" type="number" {...register('fiscal_year')} className={cn(fieldErrorClass(errors.fiscal_year))} />
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

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => navigate('/budget')}>Batal</Button>
          <Button type="submit" disabled={isSubmitting || createMut.isPending}>
            {createMut.isPending ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </div>
      </form>
    </WorkspaceLayout>
  )
}
