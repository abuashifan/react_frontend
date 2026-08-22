import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm, Controller, type Control } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRecordTab } from '@/hooks/useRecordTab'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSaveActions } from '@/components/shared/layout/FormSaveActions'
import { FormSection } from '@/components/shared/form/FormSection'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { FieldError } from '@/components/shared/form/FieldError'
import { RecordNavButtons } from '@/components/shared/form/RecordNavButtons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { usePersistentFormDraft } from '@/hooks/usePersistentFormDraft'
import { useRecordFormNavigation } from '@/hooks/useRecordFormNavigation'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { useProduk, useProdukMutations } from '../hooks/useProdukList'
import { useAccountMappings } from '../hooks/useAccountMappings'
import { coaApi } from '../services/coaApi'
import { satuanApi } from '../services/satuanApi'
import { kategoriProdukApi } from '../services/kategoriProdukApi'
import { produkApi } from '../services/produkApi'
import { produkSchema, type ProdukFormValues } from '../schemas/produkSchema'
import type { AccountMapping } from '../types/accountMapping.types'
import { cn, fieldErrorClass } from '@/lib/utils'

const PRODUCT_TYPE_OPTIONS = [
  { value: 'goods', label: 'Barang' },
  { value: 'service', label: 'Jasa' },
  { value: 'non_inventory', label: 'Non-Inventory' },
]

type AccountMode = 'standard' | 'custom'
type AccountFieldName = 'sales_account_id' | 'sales_discount_account_id' | 'sales_return_account_id' | 'purchase_return_account_id' | 'inventory_account_id' | 'inventory_interim_account_id' | 'cogs_account_id'

function AccountModeToggle({ mode, onChange }: { mode: AccountMode; onChange: (mode: AccountMode) => void }) {
  return (
    <div className="flex gap-1">
      <button
        type="button"
        onClick={() => onChange('standard')}
        className={cn(
          'h-6 rounded px-2 text-[11px] font-medium transition-colors',
          mode === 'standard' ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]',
        )}
      >
        Standar Akun
      </button>
      <button
        type="button"
        onClick={() => onChange('custom')}
        className={cn(
          'h-6 rounded px-2 text-[11px] font-medium transition-colors',
          mode === 'custom' ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]',
        )}
      >
        Custom
      </button>
    </div>
  )
}

function AccountField({
  name,
  label,
  mappingKey,
  placeholder,
  mode,
  control,
  mappings,
  selectedOption,
  error,
}: {
  name: AccountFieldName
  label: string
  mappingKey: string
  placeholder: string
  mode: AccountMode
  control: Control<ProdukFormValues>
  mappings: AccountMapping[]
  selectedOption?: { id: number; account_name: string; account_code: string } | null
  error?: string
}) {
  const mapping = mappings.find((m) => m.mapping_key === mappingKey)

  return (
    <div className="flex flex-col gap-1">
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{label}</Label>
      {mode === 'standard' ? (
        <div
          className={cn(
            'flex h-9 items-center rounded-md border px-2.5 text-[13px]',
            mapping?.account_id ? 'border-[#d9e2e5] bg-[#f8fbfc] text-[#64748b]' : 'border-amber-300 bg-amber-50 text-amber-700',
          )}
        >
          {mapping?.account_id ? `${mapping.account_code} - ${mapping.account_name}` : 'Belum diatur di Pengaturan > Pemetaan Akun'}
        </div>
      ) : (
        <Controller
          name={name}
          control={control}
          render={({ field }) => (
            <SearchableSelect
              value={field.value ?? null}
              onChange={field.onChange}
              onSearch={coaApi.search}
              placeholder={placeholder}
              error={error}
              selectedOptions={selectedOption ? [{ value: selectedOption.id, label: selectedOption.account_name, sublabel: selectedOption.account_code }] : []}
            />
          )}
        />
      )}
      {mode === 'standard' && <FieldError message={error} />}
    </div>
  )
}

export default function ProdukFormPage() {
  const { id } = useParams()
  // `/master-data/products/create` dan `/master-data/products/:id` merender komponen yang sama,
  // dan React Router tidak me-remount otomatis saat berpindah di antara keduanya (hanya
  // param yang berubah) — tanpa `key` di sini, state react-hook-form dari record yang
  // sebelumnya dibuka akan "bocor" ke tab form kosong lain. `key` memaksa instance baru
  // setiap kali id record (atau mode create) berubah.
  return <ProdukFormPageContent key={id ?? 'create'} />
}

function ProdukFormPageContent() {
  const { closeRecordTab } = useRecordTab()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()

  const { data, isLoading } = useProduk(id ? Number(id) : undefined)
  const produk = data?.data

  const { create, update } = useProdukMutations()
  const { data: mappingData } = useAccountMappings()
  const mappings = mappingData?.data ?? []

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProdukFormValues>({
    resolver: zodResolver(produkSchema),
    defaultValues: { is_stock_item: true as boolean, product_type: 'goods' },
  })

  const [accountMode, setAccountMode] = useState<AccountMode>('standard')

  const isStockItem = watch('is_stock_item')
  const productType = watch('product_type')
  const canBeStockItem = productType === 'goods' || productType === 'non_inventory'
  const isEffectivelyStockItem = canBeStockItem && isStockItem
  const showInventoryAccount = isEffectivelyStockItem

  useEffect(() => {
    if (!canBeStockItem && isStockItem) {
      setValue('is_stock_item', false)
    }
  }, [canBeStockItem, isStockItem, setValue])

  useEffect(() => {
    if (accountMode === 'standard') {
      setValue('sales_account_id', null)
      setValue('sales_discount_account_id', null)
      setValue('sales_return_account_id', null)
      setValue('purchase_return_account_id', null)
      setValue('inventory_account_id', null)
      setValue('inventory_interim_account_id', null)
      setValue('cogs_account_id', null)
    }
  }, [accountMode, setValue])

  useEffect(() => {
    if (!showInventoryAccount) {
      setValue('purchase_return_account_id', null)
      setValue('inventory_account_id', null)
      setValue('inventory_interim_account_id', null)
      setValue('cogs_account_id', null)
    }
  }, [showInventoryAccount, setValue])

  useEffect(() => {
    if (produk) {
      const hasCustomAccount = [
        produk.sales_account_id,
        produk.sales_discount_account_id,
        produk.sales_return_account_id,
        produk.purchase_return_account_id,
        produk.inventory_account_id,
        produk.inventory_interim_account_id,
        produk.cogs_account_id,
      ].some((value) => value !== null && value !== undefined)
      setAccountMode(hasCustomAccount ? 'custom' : 'standard')
      reset({
        product_code: produk.product_code ?? '',
        product_name: produk.product_name,
        product_type: produk.product_type,
        product_category_id: produk.product_category_id,
        unit_id: produk.unit_id,
        is_stock_item: produk.is_stock_item,
        description: produk.description ?? '',
        sales_account_id: produk.sales_account_id,
        sales_discount_account_id: produk.sales_discount_account_id,
        sales_return_account_id: produk.sales_return_account_id,
        purchase_return_account_id: produk.purchase_return_account_id,
        inventory_account_id: produk.inventory_account_id,
        inventory_interim_account_id: produk.inventory_interim_account_id,
        cogs_account_id: produk.cogs_account_id,
      })
    }
  }, [produk, reset])

  // Didaftarkan setelah reset dari data server supaya draft yang belum tersimpan
  // menang atas nilai server saat form dibuka ulang (urutan efek = urutan deklarasi).
  // Form ini di-remount tiap kali tab record/create berpindah (lihat `key` di
  // ProdukFormPage), jadi isian yang belum tersimpan harus dipersist ke localStorage
  // supaya tidak hilang saat user pindah tab — mis. mengecek kode produk di Daftar
  // setelah simpan gagal, lalu kembali ke form.
  const formDraft = usePersistentFormDraft<ProdukFormValues, AccountMode>({
    draftKey: `master-data.product.${id ?? 'new'}`,
    control,
    getValues,
    reset,
    extra: accountMode,
    onRestoreExtra: setAccountMode,
  })

  const currentPath = id ? `/master-data/products/${id}` : '/master-data/products/create'

  const { saveAndClose, navProps } = useRecordFormNavigation<ProdukFormValues>({
    id,
    basePath: '/master-data/products',
    createLabel: 'Produk Baru',
    sequenceQueryKey: ['master-data-produk', 'adjacent'],
    fetchAdjacent: async (recordId) => (await produkApi.adjacent(recordId)).data,
    handleSubmit,
    save: async (values, creating) => {
      if (creating) await create.mutateAsync(values)
      else await update.mutateAsync({ id: Number(id), payload: values })
    },
    onSaved: () => formDraft.clearDraft(),
    successMessage: (creating) => (creating ? 'Produk berhasil dibuat.' : 'Produk berhasil diperbarui.'),
    onError: (error) => {
      // Tampilkan penyebab spesifik dari backend (mis. kode produk duplikat) di
      // field terkait sekaligus di toast, bukan pesan generik "Gagal menyimpan".
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan produk.'))
    },
  })

  const handleDiscardDraft = () => {
    formDraft.discardDraft()
    if (produk) {
      setAccountMode('standard')
      reset({
        product_code: produk.product_code ?? '',
        product_name: produk.product_name,
        product_type: produk.product_type,
        product_category_id: produk.product_category_id,
        unit_id: produk.unit_id,
        is_stock_item: produk.is_stock_item,
        description: produk.description ?? '',
        sales_account_id: produk.sales_account_id,
        sales_discount_account_id: produk.sales_discount_account_id,
        sales_return_account_id: produk.sales_return_account_id,
        purchase_return_account_id: produk.purchase_return_account_id,
        inventory_account_id: produk.inventory_account_id,
        inventory_interim_account_id: produk.inventory_interim_account_id,
        cogs_account_id: produk.cogs_account_id,
      })
    } else {
      setAccountMode('standard')
      reset({ is_stock_item: true, product_type: 'goods', product_code: '', product_name: '', description: '' })
    }
    toast.info('Draft dibuang.')
  }

  if (!isCreate && isLoading) {
    return (
      <FormLayout title="Produk" breadcrumb={[{ label: 'Master Data' }, { label: 'Produk', path: '/master-data/products' }, { label: 'Loading...' }]}>
        <div className="h-32 flex items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <FormLayout
      title={isCreate ? 'Tambah Produk' : 'Edit Produk'}
      documentNumber={isCreate ? undefined : (produk?.product_code ?? undefined)}
      breadcrumb={[
        { label: 'Master Data' },
        { label: 'Produk', path: '/master-data/products' },
        { label: isCreate ? 'Tambah Produk' : (produk?.product_name ?? '') },
      ]}
      headerActions={
        <FormSaveActions
          onCancel={() => {
            // Batal berarti membuang isian — draft tidak boleh ikut hidup lagi
            // saat form create dibuka berikutnya.
            formDraft.clearDraft()
            closeRecordTab(currentPath, '/master-data/products')
          }}
          onSave={saveAndClose}
          isSaving={isSubmitting}
        >
          <RecordNavButtons {...navProps} isBusy={isSubmitting} />
          {formDraft.isRestored && (
            <Button variant="ghost" className="h-8 text-[13px] text-[#64748b]" onClick={handleDiscardDraft}>
              Buang Draft
            </Button>
          )}
        </FormSaveActions>
      }
    >
      <div className="space-y-3">
        <FormSection title="Informasi Produk">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode Produk</Label>
            <Input {...register('product_code')} placeholder="PRD-001" className={cn('h-9 text-[13px]', fieldErrorClass(errors.product_code))} />
            <FieldError message={errors.product_code?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Nama Produk <span className="text-red-500">*</span>
            </Label>
            <Input {...register('product_name')} placeholder="Nama produk" className={cn('h-9 text-[13px]', fieldErrorClass(errors.product_name))} />
            <FieldError message={errors.product_name?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tipe Produk</Label>
            <Select value={watch('product_type')} onValueChange={(v) => setValue('product_type', v as ProdukFormValues['product_type'])}>
              <SelectTrigger className={cn('h-9 text-[13px]', fieldErrorClass(errors.product_type))}>
                <SelectValue placeholder="Pilih tipe..." />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError message={errors.product_type?.message} />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kategori</Label>
            <Controller
              name="product_category_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onSearch={kategoriProdukApi.search}
                  placeholder="Pilih kategori..."
                  error={errors.product_category_id?.message}
                  selectedOptions={produk?.category ? [{ value: produk.category.id, label: produk.category.name }] : []}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Satuan</Label>
            <Controller
              name="unit_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onSearch={satuanApi.search}
                  placeholder="Pilih satuan..."
                  error={errors.unit_id?.message}
                  selectedOptions={produk?.unit ? [{ value: produk.unit.id, label: produk.unit.name, sublabel: produk.unit.code }] : []}
                />
              )}
            />
          </div>

          {canBeStockItem && (
            <div className="flex items-center gap-3">
              <Controller
                name="is_stock_item"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <div>
                <p className="text-[13px] font-medium text-[#24323a]">Item Stok</p>
                <p className="text-[11px] text-[#64748b]">Lacak stok di gudang</p>
                <FieldError message={errors.is_stock_item?.message} />
              </div>
            </div>
          )}
        </FormSection>

        <FormSection title="Akun Akuntansi">
          <div className="flex items-center justify-between md:col-span-2">
            <p className="text-[11px] text-[#64748b]">Standar Akun mengikuti Pengaturan &gt; Pemetaan Akun. Pilih Custom untuk override khusus produk ini.</p>
            <AccountModeToggle mode={accountMode} onChange={setAccountMode} />
          </div>

          <AccountField
            name="sales_account_id"
            label="Akun Penjualan"
            mappingKey="sales.revenue"
            placeholder="Pilih akun penjualan..."
            mode={accountMode}
            control={control}
            mappings={mappings}
            selectedOption={produk?.sales_account}
            error={errors.sales_account_id?.message}
          />
          <AccountField
            name="sales_discount_account_id"
            label="Akun Diskon Penjualan"
            mappingKey="sales.discount"
            placeholder="Pilih akun diskon penjualan..."
            mode={accountMode}
            control={control}
            mappings={mappings}
            selectedOption={produk?.sales_discount_account}
            error={errors.sales_discount_account_id?.message}
          />
          <AccountField
            name="sales_return_account_id"
            label="Akun Retur Penjualan"
            mappingKey="sales.return"
            placeholder="Pilih akun retur penjualan..."
            mode={accountMode}
            control={control}
            mappings={mappings}
            selectedOption={produk?.sales_return_account}
            error={errors.sales_return_account_id?.message}
          />

          {showInventoryAccount && (
            <>
              <AccountField
                name="inventory_account_id"
                label="Akun Persediaan"
                mappingKey="inventory.asset"
                placeholder="Pilih akun persediaan..."
                mode={accountMode}
                control={control}
                mappings={mappings}
                selectedOption={produk?.inventory_account}
                error={errors.inventory_account_id?.message}
              />
              <AccountField
                name="cogs_account_id"
                label="Akun HPP"
                mappingKey="inventory.cogs"
                placeholder="Pilih akun HPP..."
                mode={accountMode}
                control={control}
                mappings={mappings}
                selectedOption={produk?.cogs_account}
                error={errors.cogs_account_id?.message}
              />
              <AccountField
                name="purchase_return_account_id"
                label="Akun Retur Pembelian"
                mappingKey="purchase.return"
                placeholder="Pilih akun retur pembelian..."
                mode={accountMode}
                control={control}
                mappings={mappings}
                selectedOption={produk?.purchase_return_account}
                error={errors.purchase_return_account_id?.message}
              />
              <AccountField
                name="inventory_interim_account_id"
                label="Akun Penerimaan Belum Tertagih"
                mappingKey="purchase.inventory_interim"
                placeholder="Pilih akun penerimaan belum tertagih..."
                mode={accountMode}
                control={control}
                mappings={mappings}
                selectedOption={produk?.inventory_interim_account}
                error={errors.inventory_interim_account_id?.message}
              />
            </>
          )}
        </FormSection>
      </div>
    </FormLayout>
  )
}
