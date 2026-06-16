import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FixedBottomBar } from '@/components/shared/layout/FixedBottomBar'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { useCoa, useCoaMutations } from '../hooks/useCoaList'
import { coaApi } from '../services/coaApi'
import { coaSchema, type CoaFormValues } from '../schemas/coaSchema'

const COA_TYPES = [
  { value: 'asset', label: 'Aset' },
  { value: 'liability', label: 'Liabilitas' },
  { value: 'equity', label: 'Ekuitas' },
  { value: 'revenue', label: 'Pendapatan' },
  { value: 'expense', label: 'Beban' },
]

export default function CoaFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()

  const { data, isLoading } = useCoa(id ? Number(id) : undefined)
  const coa = data?.data

  const { create, update } = useCoaMutations()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CoaFormValues>({
    resolver: zodResolver(coaSchema),
    defaultValues: { account_type: 'asset', parent_account_id: null },
  })

  useEffect(() => {
    if (coa) {
      reset({
        account_code: coa.account_code,
        account_name: coa.account_name,
        account_type: coa.account_type,
        parent_account_id: coa.parent_account_id,
        description: coa.description ?? '',
      })
    }
  }, [coa, reset])

  const onSubmit = async (values: CoaFormValues) => {
    try {
      if (isCreate) {
        const res = await create.mutateAsync(values)
        toast.success('Akun berhasil dibuat.')
        navigate(`/master-data/coa/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload: values })
        toast.success('Akun berhasil diperbarui.')
      }
    } catch {
      toast.error('Gagal menyimpan akun.')
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Chart of Account" breadcrumb={[{ label: 'Master Data' }, { label: 'COA', path: '/master-data/coa' }, { label: 'Loading...' }]}>
        <div className="h-32 flex items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <FormLayout
      title={isCreate ? 'Tambah Akun' : 'Edit Akun'}
      breadcrumb={[
        { label: 'Master Data' },
        { label: 'COA', path: '/master-data/coa' },
        { label: isCreate ? 'Tambah Akun' : (coa?.account_code ?? '') },
      ]}
      bottomBar={
        <FixedBottomBar
          left={<span className="text-[13px] text-[#64748b]">{isCreate ? 'Akun baru' : coa?.account_name}</span>}
        >
          <Button variant="outline" className="h-8 text-[13px]" onClick={() => navigate('/master-data/coa')}>
            Batal
          </Button>
          <Button
            className="bg-[#e39774] hover:bg-[#d4845e] h-8 text-[13px]"
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </FixedBottomBar>
      }
    >
      <div className="space-y-3">
        <FormSection title="Informasi Akun">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Kode Akun <span className="text-red-500">*</span>
            </Label>
            <Input {...register('account_code')} placeholder="1-1100" className="h-9 text-[13px]" />
            {errors.account_code && <p className="text-[11px] text-red-500">{errors.account_code.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Nama Akun <span className="text-red-500">*</span>
            </Label>
            <Input {...register('account_name')} placeholder="Kas" className="h-9 text-[13px]" />
            {errors.account_name && <p className="text-[11px] text-red-500">{errors.account_name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Tipe Akun <span className="text-red-500">*</span>
            </Label>
            <Select value={watch('account_type')} onValueChange={(v) => setValue('account_type', v as CoaFormValues['account_type'])}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Pilih tipe..." />
              </SelectTrigger>
              <SelectContent>
                {COA_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.account_type && <p className="text-[11px] text-red-500">{errors.account_type.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Akun Induk
            </Label>
            <SearchableSelect
              value={watch('parent_account_id') ?? null}
              onChange={(v) => setValue('parent_account_id', v)}
              onSearch={coaApi.search}
              placeholder="Pilih akun induk..."
              selectedOptions={coa?.parent ? [{ value: coa.parent.id, label: coa.parent.account_name, sublabel: coa.parent.account_code }] : []}
            />
          </div>

          <div className="flex flex-col gap-1 md:col-span-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Deskripsi
            </Label>
            <Textarea
              {...register('description')}
              placeholder="Keterangan akun (opsional)"
              className="text-[13px] resize-none"
              rows={3}
            />
          </div>
        </FormSection>
      </div>
    </FormLayout>
  )
}
