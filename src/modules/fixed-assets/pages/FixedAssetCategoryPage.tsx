import { useState } from 'react'
import { Pencil, Plus } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/useToast'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { fixedAssetCategorySchema, type FixedAssetCategoryFormValues } from '../schemas/fixedAssetSchema'
import { useFixedAssetCategories, useFixedAssetCategoryMutations } from '../hooks/useFixedAssetCategories'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { FixedAssetCategory } from '../types/fixedAsset.types'

const CLASS_LABEL = {
  tangible: 'Tangible',
  intangible: 'Intangible',
} as const

const DEPRECIATION_LABEL = {
  depreciation: 'Depresiasi',
  amortization: 'Amortisasi',
  none: 'Tidak Ada',
  impairment_only: 'Impairment Only',
} as const

type AccountFieldName =
  | 'asset_account_id'
  | 'accumulated_depreciation_account_id'
  | 'depreciation_expense_account_id'
  | 'clearing_account_id'
  | 'disposal_gain_account_id'
  | 'disposal_loss_account_id'

const ACCOUNT_FIELDS: { name: AccountFieldName; label: string }[] = [
  { name: 'asset_account_id', label: 'Akun Aktiva' },
  { name: 'accumulated_depreciation_account_id', label: 'Akun Akumulasi Depresiasi' },
  { name: 'depreciation_expense_account_id', label: 'Akun Beban Depresiasi' },
  { name: 'clearing_account_id', label: 'Akun Clearing' },
  { name: 'disposal_gain_account_id', label: 'Akun Laba Disposal' },
  { name: 'disposal_loss_account_id', label: 'Akun Rugi Disposal' },
]

type AccountSearchType = 'asset' | 'expense' | 'revenue'

type AccountOptionSource = FixedAssetCategory['asset_account']

const ACCOUNT_SEARCHERS: Record<AccountFieldName, AccountSearchType> = {
  asset_account_id: 'asset',
  accumulated_depreciation_account_id: 'asset',
  depreciation_expense_account_id: 'expense',
  clearing_account_id: 'asset',
  disposal_gain_account_id: 'revenue',
  disposal_loss_account_id: 'expense',
}

const getAccountRelation = (category: FixedAssetCategory | null, field: AccountFieldName): AccountOptionSource => {
  if (!category) return null

  switch (field) {
    case 'asset_account_id':
      return category.asset_account ?? null
    case 'accumulated_depreciation_account_id':
      return category.accumulated_depreciation_account ?? null
    case 'depreciation_expense_account_id':
      return category.depreciation_expense_account ?? null
    case 'clearing_account_id':
      return category.clearing_account ?? null
    case 'disposal_gain_account_id':
      return category.disposal_gain_account ?? null
    case 'disposal_loss_account_id':
      return category.disposal_loss_account ?? null
    default:
      return null
  }
}

const getAccountLabel = (account: AccountOptionSource): string => {
  if (!account) return ''

  const code = account.account_code ?? ''
  const name = account.account_name ?? account.name ?? ''
  return code && name ? `${code} - ${name}` : name || code
}

const getSelectedAccountOptions = (account: AccountOptionSource) => {
  if (!account) return []

  return [{ value: account.id, label: getAccountLabel(account), sublabel: account.account_code ?? undefined }]
}

const searchAccountsByType = (accountType: AccountSearchType) => (query: string) =>
  coaApi.search(query, { account_type: accountType, is_active: true })

function defaultValues(): FixedAssetCategoryFormValues {
  return {
    code: '',
    name: '',
    asset_class: 'tangible',
    depreciation_type: 'depreciation',
    default_useful_life_years: null,
    asset_account_id: null,
    accumulated_depreciation_account_id: null,
    depreciation_expense_account_id: null,
    clearing_account_id: null,
    disposal_gain_account_id: null,
    disposal_loss_account_id: null,
    is_active: true,
  }
}

export default function FixedAssetCategoryPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<FixedAssetCategory | null>(null)
  const { data, isLoading, isFetching } = useFixedAssetCategories()
  const mutations = useFixedAssetCategoryMutations()

  const { control, register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FixedAssetCategoryFormValues>({
    resolver: zodResolver(fixedAssetCategorySchema) as unknown as Resolver<FixedAssetCategoryFormValues>,
    defaultValues: defaultValues(),
  })

  const openCreate = () => {
    setEditingItem(null)
    reset(defaultValues())
    setDialogOpen(true)
  }

  const openEdit = (item: FixedAssetCategory) => {
    setEditingItem(item)
    reset({
      code: item.code,
      name: item.name,
      asset_class: item.asset_class,
      depreciation_type: item.depreciation_type,
      default_useful_life_years: item.default_useful_life_years ?? null,
      asset_account_id: item.asset_account_id ?? null,
      accumulated_depreciation_account_id: item.accumulated_depreciation_account_id ?? null,
      depreciation_expense_account_id: item.depreciation_expense_account_id ?? null,
      clearing_account_id: item.clearing_account_id ?? null,
      disposal_gain_account_id: item.disposal_gain_account_id ?? null,
      disposal_loss_account_id: item.disposal_loss_account_id ?? null,
      is_active: item.is_active,
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: FixedAssetCategoryFormValues) => {
    try {
      if (editingItem) {
        await mutations.update.mutateAsync({ id: editingItem.id, payload: values })
        toast.success('Kategori aktiva berhasil diperbarui.')
      } else {
        await mutations.create.mutateAsync(values)
        toast.success('Kategori aktiva berhasil dibuat.')
      }
      setDialogOpen(false)
    } catch {
      toast.error('Gagal menyimpan kategori aktiva.')
    }
  }

  const columns: ColumnDef<FixedAssetCategory>[] = [
    {
      id: 'code',
      header: 'Kode',
      size: 110,
      meta: { sticky: true, stickyLeft: 0 },
      cell: ({ original }) => <span className="font-semibold text-[#326273]">{original.code}</span>,
    },
    {
      id: 'name',
      header: 'Nama',
      size: 220,
      cell: ({ original }) => <span className="font-medium text-[#24323a]">{original.name}</span>,
    },
    {
      id: 'asset_class',
      header: 'Kelas',
      size: 120,
      cell: ({ original }) => CLASS_LABEL[original.asset_class],
    },
    {
      id: 'depreciation_type',
      header: 'Tipe Depresiasi',
      size: 150,
      cell: ({ original }) => DEPRECIATION_LABEL[original.depreciation_type],
    },
    {
      id: 'default_useful_life_years',
      header: 'Umur Default',
      size: 120,
      meta: { className: 'text-right tabular-nums' },
      cell: ({ original }) => original.default_useful_life_years ? `${original.default_useful_life_years} th` : '-',
    },
    {
      id: 'is_active',
      header: 'Status',
      size: 100,
      cell: ({ original }) => original.is_active ? 'Aktif' : 'Nonaktif',
    },
    {
      id: 'actions',
      header: '',
      size: 80,
      cell: ({ original }) => (
        <PermissionGuard permission="fixed_assets.settings.manage">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </PermissionGuard>
      ),
    },
  ]

  return (
    <WorkspaceLayout
      title="Kategori Aktiva"
      breadcrumb={[{ label: 'Aktiva Tetap' }, { label: 'Kategori' }]}
      action={
        <PermissionGuard permission="fixed_assets.settings.manage">
          <Button className="h-8 bg-[#e39774] px-3 text-[13px] hover:bg-[#d4845e]" onClick={openCreate}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Tambah Kategori
          </Button>
        </PermissionGuard>
      }
    >
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        totalRows={data?.data.length ?? 0}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={{ pageIndex: 0, pageSize: 25 }}
        onPaginationChange={() => {}}
        emptyTitle="Belum ada kategori aktiva"
        emptyDescription="Kategori menentukan mapping akun dan default depresiasi."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingItem ? 'Edit Kategori Aktiva' : 'Tambah Kategori Aktiva'}</DialogTitle>
            <DialogDescription className="text-[13px] text-[#64748b]">Atur akun aset, akumulasi penyusutan, dan beban untuk kategori aktiva ini.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kode <span className="text-red-500">*</span></Label>
                <Input {...register('code')} className="h-9 text-[13px]" />
                {errors.code && <p className="text-[11px] text-red-500">{errors.code.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama <span className="text-red-500">*</span></Label>
                <Input {...register('name')} className="h-9 text-[13px]" />
                {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Kelas</Label>
                <select {...register('asset_class')} className="h-9 rounded-md border border-[#d9e2e5] bg-white px-2 text-[13px]">
                  <option value="tangible">Tangible</option>
                  <option value="intangible">Intangible</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tipe Depresiasi</Label>
                <select {...register('depreciation_type')} className="h-9 rounded-md border border-[#d9e2e5] bg-white px-2 text-[13px]">
                  <option value="depreciation">Depresiasi</option>
                  <option value="amortization">Amortisasi</option>
                  <option value="none">Tidak Ada</option>
                  <option value="impairment_only">Impairment Only</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Umur Default</Label>
                <select {...register('default_useful_life_years')} className="h-9 rounded-md border border-[#d9e2e5] bg-white px-2 text-[13px] tabular-nums">
                  <option value="">-</option>
                  <option value="4">4 tahun</option>
                  <option value="8">8 tahun</option>
                  <option value="10">10 tahun</option>
                  <option value="16">16 tahun</option>
                  <option value="20">20 tahun</option>
                </select>
              </div>
              <div className="flex items-end gap-2">
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => (
                    <label className="flex h-9 items-center gap-2 text-[13px] text-[#24323a]">
                      <input type="checkbox" checked={field.value ?? false} onChange={(event) => field.onChange(event.target.checked)} />
                      Aktif
                    </label>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 border-t border-[#d9e2e5] pt-4 md:grid-cols-2">
              {ACCOUNT_FIELDS.map(({ name, label }) => (
                <Controller
                  key={name}
                  control={control}
                  name={name}
                  render={({ field }) => (
                    <div className="flex flex-col gap-1">
                      <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{label}</Label>
                      <SearchableSelect
                        value={typeof field.value === 'number' ? field.value : null}
                        onChange={field.onChange}
                        onSearch={searchAccountsByType(ACCOUNT_SEARCHERS[name])}
                        placeholder="Pilih akun..."
                        selectedOptions={getSelectedAccountOptions(getAccountRelation(editingItem, name))}
                      />
                    </div>
                  )}
                />
              ))}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="h-8 bg-[#e39774] text-[13px] hover:bg-[#d4845e]" disabled={isSubmitting || mutations.create.isPending || mutations.update.isPending}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  )
}
