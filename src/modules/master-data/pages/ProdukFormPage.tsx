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
import { useToast } from '@/hooks/useToast'
import { useProduk, useProdukMutations } from '../hooks/useProdukList'
import { coaApi } from '../services/coaApi'
import { satuanApi } from '../services/satuanApi'
import { kategoriProdukApi } from '../services/kategoriProdukApi'
import { produkSchema, type ProdukFormValues } from '../schemas/produkSchema'

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
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProdukFormValues>({
    resolver: zodResolver(produkSchema),
    defaultValues: { is_stock_item: true as boolean },
  })

  const isStockItem = watch('is_stock_item')

  useEffect(() => {
    if (produk) {
      reset({
        name: produk.name,
        category_id: produk.category_id,
        unit_id: produk.unit_id,
        is_stock_item: produk.is_stock_item,
        sell_price: produk.sell_price ? Number(produk.sell_price) : undefined,
        buy_price: produk.buy_price ? Number(produk.buy_price) : undefined,
        coa_sales_id: produk.coa_sales_id,
        coa_purchase_id: produk.coa_purchase_id,
        coa_inventory_id: produk.coa_inventory_id,
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
        { label: isCreate ? 'Tambah Produk' : (produk?.name ?? '') },
      ]}
      bottomBar={
        <FixedBottomBar
          left={<span className="text-[13px] text-[#64748b]">{isCreate ? 'Produk baru' : produk?.code}</span>}
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
          <div className="flex flex-col gap-1 md:col-span-2">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
              Nama Produk <span className="text-red-500">*</span>
            </Label>
            <Input {...register('name')} placeholder="Nama produk" className="h-9 text-[13px]" />
            {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kategori</Label>
            <Controller
              name="category_id"
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
                  selectedOptions={produk?.unit ? [{ value: produk.unit.id, label: produk.unit.name, sublabel: produk.unit.symbol }] : []}
                />
              )}
            />
          </div>

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
        </FormSection>

        <FormSection title="Harga">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Harga Jual</Label>
            <Input
              {...register('sell_price', { valueAsNumber: true })}
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="h-9 text-[13px] tabular-nums"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Harga Beli</Label>
            <Input
              {...register('buy_price', { valueAsNumber: true })}
              type="number"
              min="0"
              step="1"
              placeholder="0"
              className="h-9 text-[13px] tabular-nums"
            />
          </div>
        </FormSection>

        <FormSection title="Akun Akuntansi">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Penjualan</Label>
            <Controller
              name="coa_sales_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onSearch={coaApi.search}
                  placeholder="Pilih akun penjualan..."
                  selectedOptions={produk?.coa_sales ? [{ value: produk.coa_sales.id, label: produk.coa_sales.name, sublabel: produk.coa_sales.code }] : []}
                />
              )}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Pembelian</Label>
            <Controller
              name="coa_purchase_id"
              control={control}
              render={({ field }) => (
                <SearchableSelect
                  value={field.value ?? null}
                  onChange={field.onChange}
                  onSearch={coaApi.search}
                  placeholder="Pilih akun pembelian..."
                  selectedOptions={produk?.coa_purchase ? [{ value: produk.coa_purchase.id, label: produk.coa_purchase.name, sublabel: produk.coa_purchase.code }] : []}
                />
              )}
            />
          </div>

          {isStockItem && (
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Inventory</Label>
              <Controller
                name="coa_inventory_id"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    value={field.value ?? null}
                    onChange={field.onChange}
                    onSearch={coaApi.search}
                    placeholder="Pilih akun inventory..."
                    selectedOptions={produk?.coa_inventory ? [{ value: produk.coa_inventory.id, label: produk.coa_inventory.name, sublabel: produk.coa_inventory.code }] : []}
                  />
                )}
              />
            </div>
          )}
        </FormSection>
      </div>
    </FormLayout>
  )
}
