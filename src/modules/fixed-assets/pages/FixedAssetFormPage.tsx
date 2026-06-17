import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useParams } from 'react-router-dom'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FixedBottomBar } from '@/components/shared/layout/FixedBottomBar'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { cn, formatCurrency, formatDate, toDateInputValue } from '@/lib/utils'
import { getApiErrorMessage } from '@/lib/apiError'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { kontakApi } from '@/modules/master-data/services/kontakApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { fixedAssetCategoryApi } from '../services/fixedAssetCategoryApi'
import { useFixedAsset } from '../hooks/useFixedAssetList'
import { useFixedAssetMutations } from '../hooks/useFixedAssetMutations'
import {
  capitalizeFixedAssetSchema,
  disposeFixedAssetSchema,
  fixedAssetSchema,
  type CapitalizeFixedAssetFormValues,
  type DisposeFixedAssetFormValues,
  type FixedAssetFormValues,
} from '../schemas/fixedAssetSchema'
import type { FixedAsset, FixedAssetStatus } from '../types/fixedAsset.types'

const STATUS_LABEL: Record<FixedAssetStatus, string> = {
  draft: 'Draft',
  capitalized: 'Dikapitalisasi',
  active: 'Aktif',
  fully_depreciated: 'Terdepresiasi',
  partially_disposed: 'Sebagian Disposal',
  disposed: 'Disposed',
}

function statusClass(status: FixedAssetStatus) {
  if (status === 'active') return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  if (status === 'draft') return 'border-slate-200 bg-slate-50 text-slate-700'
  if (status === 'capitalized') return 'border-blue-200 bg-blue-50 text-blue-700'
  if (status === 'disposed' || status === 'partially_disposed') return 'border-red-200 bg-red-50 text-red-700'
  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function StatusBadge({ status }: { status: FixedAssetStatus }) {
  return (
    <span className={cn('rounded-full border px-2 py-0.5 text-[11px] font-semibold', statusClass(status))}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function mapAssetToForm(asset?: FixedAsset | null): FixedAssetFormValues {
  return {
    name: asset?.name ?? '',
    description: asset?.description ?? '',
    fixed_asset_category_id: asset?.fixed_asset_category_id ?? 0,
    acquisition_date: toDateInputValue(asset?.acquisition_date) || new Date().toISOString().slice(0, 10),
    acquisition_cost: Number(asset?.acquisition_cost ?? 0),
    service_start_date: toDateInputValue(asset?.service_start_date),
    useful_life_years: asset?.useful_life_years ?? null,
    quantity: asset?.quantity ? Number(asset.quantity) : 1,
    salvage_value: asset?.salvage_value ? Number(asset.salvage_value) : 0,
    department_id: asset?.department_id ?? null,
    project_id: asset?.project_id ?? null,
    source_type: asset?.source_type ?? '',
    source_id: asset?.source_id ?? null,
  }
}

function cleanForm(values: FixedAssetFormValues): FixedAssetFormValues {
  return {
    ...values,
    description: values.description || null,
    service_start_date: values.service_start_date || null,
    source_type: values.source_type || null,
    source_id: values.source_id ?? null,
    department_id: values.department_id ?? null,
    project_id: values.project_id ?? null,
    useful_life_years: values.useful_life_years ?? null,
    salvage_value: values.salvage_value ?? null,
    quantity: values.quantity ?? null,
  }
}

export default function FixedAssetFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const assetId = id ? Number(id) : undefined
  const { toast } = useToast()
  const { can } = usePermission()
  const { data, isLoading } = useFixedAsset(assetId)
  const asset = data?.data
  const mutations = useFixedAssetMutations()
  const [capitalizeOpen, setCapitalizeOpen] = useState(false)
  const [disposeOpen, setDisposeOpen] = useState(false)

  const formValues = useMemo(() => mapAssetToForm(asset), [asset])
  const status = asset?.status ?? 'draft'
  const isEditable = isCreate || !['disposed', 'partially_disposed', 'fully_depreciated'].includes(status)
  const canCapitalize = !isCreate && status === 'draft'
  const canDispose = !isCreate && ['active', 'capitalized', 'partially_disposed'].includes(status)

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FixedAssetFormValues>({
    resolver: zodResolver(fixedAssetSchema) as unknown as Resolver<FixedAssetFormValues>,
    values: formValues,
  })

  const capitalizeForm = useForm<CapitalizeFixedAssetFormValues>({
    resolver: zodResolver(capitalizeFixedAssetSchema) as unknown as Resolver<CapitalizeFixedAssetFormValues>,
    defaultValues: {
      capitalization_date: new Date().toISOString().slice(0, 10),
      source_type: '',
      source_id: null,
      source_line_id: null,
      vendor_id: null,
      amount: null,
    },
  })

  const disposeForm = useForm<DisposeFixedAssetFormValues>({
    resolver: zodResolver(disposeFixedAssetSchema) as unknown as Resolver<DisposeFixedAssetFormValues>,
    defaultValues: {
      disposal_date: new Date().toISOString().slice(0, 10),
      disposal_type: 'sale',
      disposed_quantity: Number(asset?.remaining_quantity ?? asset?.quantity ?? 1),
      proceeds_amount: null,
      cash_bank_account_id: null,
      receivable_account_id: null,
    },
  })

  const handleSave = handleSubmit(async (values) => {
    try {
      const payload = cleanForm(values)
      if (isCreate) {
        const res = await mutations.create.mutateAsync(payload)
        toast.success('Aktiva tetap berhasil dibuat.')
        navigate(`/fixed-assets/${res.data.id}`)
      } else if (assetId) {
        await mutations.update.mutateAsync({ id: assetId, payload })
        toast.success('Aktiva tetap berhasil diperbarui.')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan aktiva tetap.'))
    }
  })

  const handleCapitalize = async (values: CapitalizeFixedAssetFormValues) => {
    if (!assetId) return
    try {
      await mutations.capitalize.mutateAsync({ id: assetId, payload: values })
      toast.success('Aktiva tetap berhasil dikapitalisasi.')
      setCapitalizeOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal kapitalisasi aktiva tetap.'))
    }
  }

  const handleDispose = async (values: DisposeFixedAssetFormValues) => {
    if (!assetId) return
    try {
      await mutations.dispose.mutateAsync({ id: assetId, payload: values })
      toast.success('Aktiva tetap berhasil didisposal.')
      setDisposeOpen(false)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal disposal aktiva tetap.'))
    }
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Aktiva Tetap" breadcrumb={[{ label: 'Aktiva Tetap', path: '/fixed-assets' }, { label: 'Memuat...' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  const bottomBar = (
    <FixedBottomBar
      left={
        <>
          <span className="font-semibold text-[#24323a]">{asset?.asset_number ?? (isCreate ? 'Aktiva Baru' : `FA-${assetId}`)}</span>
          <span className="text-[#d9e2e5]">·</span>
          <StatusBadge status={status} />
        </>
      }
    >
      {isEditable && can(isCreate ? 'fixed_assets.create' : 'fixed_assets.edit') && (
        <Button type="button" variant="outline" className="h-8 px-4 text-[13px]" disabled={isSubmitting || mutations.create.isPending || mutations.update.isPending} onClick={() => void handleSave()}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan'}
        </Button>
      )}
      {canCapitalize && (
        <PermissionGuard permission="fixed_assets.capitalize">
          <Button type="button" className="h-8 bg-[#e39774] px-4 text-[13px] hover:bg-[#d4845e]" onClick={() => setCapitalizeOpen(true)}>
            Kapitalisasi
          </Button>
        </PermissionGuard>
      )}
      {canDispose && (
        <PermissionGuard permission="fixed_assets.dispose">
          <Button type="button" variant="outline" className="h-8 border-red-200 px-4 text-[13px] text-red-700 hover:bg-red-50" onClick={() => setDisposeOpen(true)}>
            Disposal
          </Button>
        </PermissionGuard>
      )}
    </FixedBottomBar>
  )

  return (
    <>
      <FormLayout
        title={isCreate ? 'Buat Aktiva Tetap' : 'Aktiva Tetap'}
        documentNumber={asset?.asset_number ?? asset?.number}
        readOnly={!isEditable}
        readOnlyReason="Aktiva sudah dilepas/terdepresiasi penuh sehingga hanya dapat dilihat."
        breadcrumb={[{ label: 'Aktiva Tetap', path: '/fixed-assets' }, { label: isCreate ? 'Buat Aktiva' : (asset?.asset_number ?? '') }]}
        bottomBar={bottomBar}
      >
        <div className="space-y-3">
          <FormSection title="Informasi Dasar">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama <span className="text-red-500">*</span></Label>
              <Input {...register('name')} disabled={!isEditable} className="h-9 text-[13px]" />
              {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
            </div>
            <Controller
              control={control}
              name="fixed_asset_category_id"
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kategori <span className="text-red-500">*</span></Label>
                  <SearchableSelect
                    value={field.value || null}
                    onChange={field.onChange}
                    onSearch={fixedAssetCategoryApi.search}
                    placeholder="Pilih kategori aktiva..."
                    disabled={!isEditable}
                    error={errors.fixed_asset_category_id?.message}
                    selectedOptions={asset?.category ? [{ value: asset.category.id, label: asset.category.name, sublabel: asset.category.code }] : []}
                  />
                </div>
              )}
            />
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deskripsi</Label>
              <Textarea {...register('description')} disabled={!isEditable} rows={2} className="resize-none text-[13px]" />
            </div>
          </FormSection>

          <FormSection title="Perolehan">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal Perolehan <span className="text-red-500">*</span></Label>
              <Input {...register('acquisition_date')} type="date" disabled={!isEditable} className="h-9 text-[13px] tabular-nums" />
              {errors.acquisition_date && <p className="text-[11px] text-red-500">{errors.acquisition_date.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nilai Perolehan <span className="text-red-500">*</span></Label>
              <Input {...register('acquisition_cost')} type="number" min="0" disabled={!isEditable} className="h-9 text-[13px] tabular-nums" />
              {errors.acquisition_cost && <p className="text-[11px] text-red-500">{errors.acquisition_cost.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty</Label>
              <Input {...register('quantity')} type="number" min="0" disabled={!isEditable} className="h-9 text-[13px] tabular-nums" />
            </div>
            <Controller
              control={control}
              name="department_id"
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Departemen</Label>
                  <SearchableSelect value={field.value ?? null} onChange={field.onChange} onSearch={departemenApi.search} placeholder="Pilih departemen..." disabled={!isEditable} selectedOptions={asset?.department ? [{ value: asset.department.id, label: asset.department.name, sublabel: asset.department.code ?? undefined }] : []} />
                </div>
              )}
            />
            <Controller
              control={control}
              name="project_id"
              render={({ field }) => (
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Proyek</Label>
                  <SearchableSelect value={field.value ?? null} onChange={field.onChange} onSearch={proyekApi.search} placeholder="Pilih proyek..." disabled={!isEditable} selectedOptions={asset?.project ? [{ value: asset.project.id, label: asset.project.name, sublabel: asset.project.code ?? undefined }] : []} />
                </div>
              )}
            />
          </FormSection>

          <FormSection title="Depresiasi">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal Mulai Pakai</Label>
              <Input {...register('service_start_date')} type="date" disabled={!isEditable} className="h-9 text-[13px] tabular-nums" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Umur Manfaat</Label>
              <select {...register('useful_life_years')} disabled={!isEditable} className="h-9 rounded-md border border-[#d9e2e5] bg-white px-2 text-[13px] tabular-nums">
                <option value="">Default kategori</option>
                <option value="4">4 tahun</option>
                <option value="8">8 tahun</option>
                <option value="10">10 tahun</option>
                <option value="16">16 tahun</option>
                <option value="20">20 tahun</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nilai Residu</Label>
              <Input {...register('salvage_value')} type="number" min="0" disabled={!isEditable} className="h-9 text-[13px] tabular-nums" />
            </div>
            <div className="grid grid-cols-1 gap-2 md:col-span-2 md:grid-cols-3">
              <div className="rounded-lg border border-[#d9e2e5] bg-[#f8fbfc] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akum Dep</p>
                <p className="mt-1 text-[13px] font-semibold tabular-nums text-[#24323a]">{formatCurrency(asset?.accumulated_depreciation)}</p>
              </div>
              <div className="rounded-lg border border-[#d9e2e5] bg-[#f8fbfc] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nilai Buku</p>
                <p className="mt-1 text-[13px] font-semibold tabular-nums text-[#24323a]">{formatCurrency(asset?.net_book_value)}</p>
              </div>
              <div className="rounded-lg border border-[#d9e2e5] bg-[#f8fbfc] p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Mulai Dep</p>
                <p className="mt-1 text-[13px] font-semibold tabular-nums text-[#24323a]">{asset?.first_depreciation_period ?? '-'}</p>
              </div>
            </div>
          </FormSection>

          <FormSection title="Status Saat Ini">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</span>
              <StatusBadge status={status} />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kapitalisasi</span>
              <span className="text-[13px] tabular-nums text-[#24323a]">{asset?.capitalized_at ? formatDate(asset.capitalized_at) : '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Disposal</span>
              <span className="text-[13px] tabular-nums text-[#24323a]">{asset?.disposed_at ? formatDate(asset.disposed_at) : '-'}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Sisa Qty</span>
              <span className="text-[13px] tabular-nums text-[#24323a]">{asset?.remaining_quantity ?? '-'}</span>
            </div>
          </FormSection>
        </div>
      </FormLayout>

      <Dialog open={capitalizeOpen} onOpenChange={setCapitalizeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Kapitalisasi Aktiva</DialogTitle>
          </DialogHeader>
          <form onSubmit={capitalizeForm.handleSubmit(handleCapitalize)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal Kapitalisasi</Label>
                <Input {...capitalizeForm.register('capitalization_date')} type="date" className="h-9 text-[13px] tabular-nums" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Amount</Label>
                <Input {...capitalizeForm.register('amount')} type="number" min="0" className="h-9 text-[13px] tabular-nums" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Source Type</Label>
                <Input {...capitalizeForm.register('source_type')} className="h-9 text-[13px]" placeholder="purchase_bill" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Source ID</Label>
                <Input {...capitalizeForm.register('source_id')} type="number" min="0" className="h-9 text-[13px] tabular-nums" />
              </div>
              <Controller
                control={capitalizeForm.control}
                name="vendor_id"
                render={({ field }) => (
                  <div className="flex flex-col gap-1 md:col-span-2">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Vendor</Label>
                    <SearchableSelect value={field.value ?? null} onChange={field.onChange} onSearch={(query) => kontakApi.search(query, 'supplier')} placeholder="Pilih vendor..." />
                  </div>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={() => setCapitalizeOpen(false)}>Batal</Button>
              <Button type="submit" className="h-8 bg-[#e39774] text-[13px] hover:bg-[#d4845e]" disabled={mutations.capitalize.isPending}>
                {mutations.capitalize.isPending ? 'Memproses...' : 'Kapitalisasi'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={disposeOpen} onOpenChange={setDisposeOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Disposal Aktiva</DialogTitle>
          </DialogHeader>
          <form onSubmit={disposeForm.handleSubmit(handleDispose)} className="space-y-3">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal Disposal <span className="text-red-500">*</span></Label>
                <Input {...disposeForm.register('disposal_date')} type="date" className="h-9 text-[13px] tabular-nums" />
                {disposeForm.formState.errors.disposal_date && <p className="text-[11px] text-red-500">{disposeForm.formState.errors.disposal_date.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tipe Disposal</Label>
                <select {...disposeForm.register('disposal_type')} className="h-9 rounded-md border border-[#d9e2e5] bg-white px-2 text-[13px]">
                  <option value="sale">Sale</option>
                  <option value="write_off">Write Off</option>
                  <option value="scrap">Scrap</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Qty Disposal <span className="text-red-500">*</span></Label>
                <Input {...disposeForm.register('disposed_quantity')} type="number" min="1" className="h-9 text-[13px] tabular-nums" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Proceeds</Label>
                <Input {...disposeForm.register('proceeds_amount')} type="number" min="0" className="h-9 text-[13px] tabular-nums" />
              </div>
              <Controller
                control={disposeForm.control}
                name="cash_bank_account_id"
                render={({ field }) => (
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Kas/Bank</Label>
                    <SearchableSelect value={field.value ?? null} onChange={field.onChange} onSearch={coaApi.search} placeholder="Pilih akun..." />
                  </div>
                )}
              />
              <Controller
                control={disposeForm.control}
                name="receivable_account_id"
                render={({ field }) => (
                  <div className="flex flex-col gap-1">
                    <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Piutang</Label>
                    <SearchableSelect value={field.value ?? null} onChange={field.onChange} onSearch={coaApi.search} placeholder="Pilih akun..." />
                  </div>
                )}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={() => setDisposeOpen(false)}>Batal</Button>
              <Button type="submit" className="h-8 bg-red-600 text-[13px] hover:bg-red-700" disabled={mutations.dispose.isPending}>
                {mutations.dispose.isPending ? 'Memproses...' : 'Disposal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
