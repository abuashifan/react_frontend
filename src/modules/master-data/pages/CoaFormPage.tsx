import { useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRecordTab } from '@/hooks/useRecordTab'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSaveActions } from '@/components/shared/layout/FormSaveActions'
import { FormSection } from '@/components/shared/form/FormSection'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { FieldError } from '@/components/shared/form/FieldError'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { useCoa, useCoaMutations } from '../hooks/useCoaList'
import { coaApi } from '../services/coaApi'
import { coaSchema, type CoaFormValues } from '../schemas/coaSchema'
import type { Coa } from '../types/coa.types'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'

const COA_TYPES = [
  { value: 'asset', label: 'Aset' },
  { value: 'liability', label: 'Liabilitas' },
  { value: 'equity', label: 'Ekuitas' },
  { value: 'revenue', label: 'Pendapatan' },
  { value: 'expense', label: 'Beban' },
]

export default function CoaFormPage() {
  const { id } = useParams()
  // `/master-data/coa/create` dan `/master-data/coa/:id` merender komponen yang sama,
  // dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <CoaFormPageContent key={id ?? 'create'} />
}

function CoaFormPageContent() {
  const { closeRecordTab } = useRecordTab()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()

  const { data, isLoading } = useCoa(id ? Number(id) : undefined)
  const coa = data?.data

  const { create, update } = useCoaMutations()

  const {
    register,
    handleSubmit, control, getValues,
    setValue,
    setError,
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


  // Form ini di-remount saat tab record/create berpindah (lihat `key` di wrapper
  // default export), jadi isian yang belum tersimpan dipersist ke localStorage agar
  // tidak hilang saat user pindah tab lalu kembali. Didaftarkan setelah efek reset
  // dari data server supaya draft menang atas nilai server (urutan efek = urutan deklarasi).
  const formDraft = usePersistentFormDraft<CoaFormValues>({
    draftKey: `master-data.coa.${id ?? 'new'}`,
    control,
    getValues,
    reset,
  })

  const currentPath = id ? `/master-data/coa/${id}` : '/master-data/coa/create'

  const { saveAndClose, navProps } = useRecordFormNavigation<CoaFormValues, Coa>({
    id,
    basePath: '/master-data/coa',
    createLabel: 'Akun Baru',
    getRecordLabel: (record) => record.account_code,
    sequenceQueryKey: ['master-data-coa', 'sequence'],
    fetchAll: async () => (await coaApi.listAll()).data,
    handleSubmit,
    save: async (values, creating) => {
      if (creating) await create.mutateAsync(values)
      else await update.mutateAsync({ id: Number(id), payload: values })
    },
    onSaved: () => formDraft.clearDraft(),
    successMessage: (creating) => (creating ? 'Akun berhasil dibuat.' : 'Akun berhasil diperbarui.'),
    onError: (error) => {
      // Surface penyebab spesifik dari backend (mis. DUPLICATE_ACCOUNT_CODE atau
      // INVALID_PARENT_ACCOUNT) di field terkait sekaligus di toast.
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan akun.'))
    },
  })

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
      documentNumber={isCreate ? undefined : coa?.account_name}
      breadcrumb={[
        { label: 'Master Data' },
        { label: 'COA', path: '/master-data/coa' },
        { label: isCreate ? 'Tambah Akun' : (coa?.account_code ?? '') },
      ]}
      headerActions={
        <FormSaveActions
          onCancel={() => {
            // Batal berarti membuang isian — draft tidak boleh ikut hidup lagi
            // saat form create dibuka berikutnya.
            formDraft.clearDraft()
            closeRecordTab(currentPath, '/master-data/coa')
          }}
          onSave={saveAndClose}
          isSaving={isSubmitting}
        >
          <RecordNavButtons {...navProps} isBusy={isSubmitting} />
        </FormSaveActions>
      }
    >
      <div className="space-y-3">
        <FormSection title="Informasi Akun">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Kode Akun <span className="text-red-500">*</span>
            </Label>
            <Input {...register('account_code')} placeholder="1-1100" className={cn('h-9 text-[13px]', fieldErrorClass(errors.account_code))} />
            <FieldError message={errors.account_code?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Nama Akun <span className="text-red-500">*</span>
            </Label>
            <Input {...register('account_name')} placeholder="Kas" className={cn('h-9 text-[13px]', fieldErrorClass(errors.account_name))} />
            <FieldError message={errors.account_name?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Tipe Akun <span className="text-red-500">*</span>
            </Label>
            <Select value={watch('account_type')} onValueChange={(v) => setValue('account_type', v as CoaFormValues['account_type'])}>
              <SelectTrigger className={cn('h-9 text-[13px]', fieldErrorClass(errors.account_type))}>
                <SelectValue placeholder="Pilih tipe..." />
              </SelectTrigger>
              <SelectContent>
                {COA_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.account_type?.message} />
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
              error={errors.parent_account_id?.message}
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
              className={cn('text-[13px] resize-none', fieldErrorClass(errors.description))}
              rows={3}
            />
            <FieldError message={errors.description?.message} />
          </div>
        </FormSection>
      </div>
    </FormLayout>
  )
}
