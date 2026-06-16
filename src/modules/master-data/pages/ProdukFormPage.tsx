import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { FixedBottomBar } from '@/components/shared/layout/FixedBottomBar'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/useToast'
import { useProduk, useProdukMutations } from '../hooks/useProdukList'
import { coaApi } from '../services/coaApi'
import { satuanApi } from '../services/satuanApi'
import { kategoriProdukApi } from '../services/kategoriProdukApi'
import { produkSchema, type ProdukFormValues } from '../schemas/produkSchema'

const PRODUCT_TYPE_OPTIONS = [
  { value: 'goods', label: 'Barang' },
  { value: 'service', label: 'Jasa' },
  { value: 'non_inventory', label: 'Non-Inventory' },
  { value: 'fixed_asset', label: 'Aktiva Tetap' },
]

export default function ProdukFormPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const isCreate = !id
  const { toast } = useToast()

  const { data, isLoading } = useProduk(id ? Number(id) : undefined)
  const produk = data?.data

  const { create, update } = useProdukMutations()

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProdukFormValues>({
    resolver: zodResolver(produkSchema),
    defaultValues: { is_stock_item: true as boolean, product_type: 'goods' },
  })

  const isStockItem = watch('is_stock_item')
  const productType = watch('product_type')
  const canBeStockItem = productType === 'goods' || productType === 'non_inventory'

  useEffect(() => {
    if (produk) {
      reset({
        product_code: produk.product_code ?? '',
        product_name: produk.product_name,
        product_type: produk.product_type,
        product_category_id: produk.product_category_id,
        unit_id: produk.unit_id,
        is_stock_item: produk.is_stock_item,
        description: produk.description ?? '',
        sales_account_id: produk.sales_account_id,
        purchase_account_id: produk.purchase_account_id,
        inventory_account_id: produk.inventory_account_id,
        cogs_account_id: produk.cogs_account_id,
      })
    }
  }, [produk, reset])

  const onSubmit = async (values: ProdukFormValues) => {
    try {
      if (isCreate) {
        const res = await create.mutateAsync(values)
        toast.success('Produk berhasil dibuat.')
        navigate(`/master-data/products/${res.data.id}`)
      } else {
        await update.mutateAsync({ id: Number(id), payload: values })
        toast.success('Produk berhasil diperbarui.')
      }
    } catch {
      toast.error('Gagal menyimpan produk.')
    }
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
      breadcrumb={[
        { label: 'Master Data' },
        { label: 'Produk', path: '/master-data/products' },
        { label: isCreate ? 'Tambah Produk' : (produk?.product_name ?? '') },
      ]}
      bottomBar={
        <FixedBottomBar
          left={<span className="text-[13px] text-[#64748b]">{isCreate ? 'Produk baru' : produk?.product_code}</span>}
        >
          <Button variant="outline" className="h-8 text-[13px]" onClick={() => navigate('/master-data/products')}>
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
        <FormSection title="Informasi Produk">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode Produk</Label>
            <Input {...register('product_code')} placeholder="PRD-001" className="h-9 text-[13px]" />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Nama Produk <span className="text-red-500">*</span>
            </Label>
            <Input {...register('product_name')} placeholder="Nama produk" className="h-9 text-[13px]" />
            {errors.product_name && <p className="text-[11px] text-red-500">{errors.product_name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tipe Produk</Label>
            <Select value={watch('product_type')} onValueChange={(v) => setValue('product_type', v as ProdukFormValues['product_type'])}>
              <SelectTrigger className="h-9 text-[13px]">
                <SelectValue placeholder="Pilih tipe..." />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPE_OPTIONS.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              </div>
            </div>
          )}
        </FormSection>

        <FormSection title="Akun Akuntansi">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Penjualan</Label>
            <Controller
              name="sales_account_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onSearch={coaApi.search}
                  placeholder="Pilih akun penjualan..."
                  selectedOptions={produk?.sales_account ? [{ value: produk.sales_account.id, label: produk.sales_account.account_name, sublabel: produk.sales_account.account_code }] : []}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Pembelian</Label>
            <Controller
              name="purchase_account_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onSearch={coaApi.search}
                  placeholder="Pilih akun pembelian..."
                  selectedOptions={produk?.purchase_account ? [{ value: produk.purchase_account.id, label: produk.purchase_account.account_name, sublabel: produk.purchase_account.account_code }] : []}
                />
              )}
            />
          </div>

          {isStockItem && canBeStockItem && (
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Inventory</Label>
              <Controller
                name="inventory_account_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ?? null}
                    onChange={field.onChange}
                    onSearch={coaApi.search}
                    placeholder="Pilih akun inventory..."
                    selectedOptions={produk?.inventory_account ? [{ value: produk.inventory_account.id, label: produk.inventory_account.account_name, sublabel: produk.inventory_account.account_code }] : []}
                  />
                )}
              />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun HPP</Label>
            <Controller
              name="cogs_account_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onSearch={coaApi.search}
                  placeholder="Pilih akun HPP..."
                  selectedOptions={produk?.cogs_account ? [{ value: produk.cogs_account.id, label: produk.cogs_account.account_name, sublabel: produk.cogs_account.account_code }] : []}
                />
              )}
            />
          </div>
        </FormSection>
      </div>
    </FormLayout>
  )
}
