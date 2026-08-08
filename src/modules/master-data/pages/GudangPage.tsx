import { useState } from 'react'
import { Plus, Pencil, Power, PowerOff } from 'lucide-react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar } from '@/components/shared/layout/FilterSidebar'
import { SingleCheckboxFilter } from '@/components/shared/filter/SingleCheckboxFilter'
import { ListSearchBar } from '@/components/shared/filter/ListSearchBar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { ActiveStatusBadge } from '@/components/shared/badge/ActiveStatusBadge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { FieldError } from '@/components/shared/form/FieldError'
import { useToast } from '@/hooks/useToast'
import { useGudangList, useGudangMutations } from '../hooks/useSimpleLists'
import { gudangSchema, type GudangFormValues } from '../schemas/gudangSchema'
import type { Gudang } from '../types/gudang.types'
import type { BulkAction, ColumnDef } from '@/components/shared/table/DataTable'
import { applyApiValidationErrors, getApiErrorMessage, getBulkFailureDetail } from '@/lib/apiError'
import { cn, fieldErrorClass } from '@/lib/utils'

const STATUS_OPTIONS: { value: boolean | undefined; label: string }[] = [
  { value: true, label: 'Aktif' },
  { value: false, label: 'Nonaktif' },
  { value: undefined, label: 'Semua' },
]

export default function GudangPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Gudang | null>(null)

  // Default: hanya tampilkan gudang aktif. Pilih "Semua" di filter Status untuk menampilkan semuanya.
  const [filterActive, setFilterActive] = useState<boolean | undefined>(true)
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [search, setSearch] = useState('')

  const { data, isLoading, isFetching } = useGudangList({
    is_active: filterActive,
    search: search || undefined,
  })
  const { create, update, activate, deactivate } = useGudangMutations()

  const {
    register,
    handleSubmit,
    control,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<GudangFormValues>({
    resolver: zodResolver(gudangSchema),
    defaultValues: { is_active: true as boolean },
  })

  const openCreate = () => {
    setEditingItem(null)
    reset({ code: '', name: '', address: '', is_active: true })
    setDialogOpen(true)
  }

  const openEdit = (item: Gudang) => {
    setEditingItem(item)
    reset({ code: item.code, name: item.name, address: item.address ?? '', is_active: item.is_active })
    setDialogOpen(true)
  }

  const onSubmit = async (values: GudangFormValues) => {
    try {
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, payload: values })
        toast.success('Gudang berhasil diperbarui.')
      } else {
        await create.mutateAsync(values)
        toast.success('Gudang berhasil dibuat.')
      }
      setDialogOpen(false)
    } catch (error) {
      // DUPLICATE_WAREHOUSE_CODE dsb. ditandai di field terkait sekaligus di toast.
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan gudang.'))
    }
  }

  // Pola identik dengan KontakListPage (halaman acuan): baris yang sudah dalam
  // status tujuan tidak ikut dikirim, dan menonaktifkan minta konfirmasi
  // sedangkan mengaktifkan tidak.
  const runBulkStatusChange = async (
    ids: string[],
    targetActive: boolean,
    mutateAsync: (id: number) => Promise<unknown>,
  ) => {
    const rows = data?.data ?? []
    const eligible = rows.filter((r) => ids.includes(String(r.id)) && r.is_active !== targetActive)
    const verb = targetActive ? 'diaktifkan' : 'dinonaktifkan'
    if (eligible.length === 0) {
      toast.warning(`Gudang yang dipilih sudah ${verb}.`)
      return
    }
    if (!targetActive && !confirm(`Nonaktifkan ${eligible.length} gudang terpilih? Data historis tidak akan dihapus.`)) return

    const results = await Promise.allSettled(eligible.map((r) => mutateAsync(r.id)))
    const successCount = results.filter((r) => r.status === 'fulfilled').length
    const failureCount = results.length - successCount
    const failureDetail = getBulkFailureDetail(results)

    if (failureCount === 0) {
      toast.success(`${successCount} gudang berhasil ${verb}.`)
    } else if (successCount === 0) {
      toast.error(`Gagal ${targetActive ? 'mengaktifkan' : 'menonaktifkan'} ${failureCount} gudang.${failureDetail ? ` ${failureDetail}` : ''}`)
    } else {
      toast.warning(`${successCount} gudang ${verb}, ${failureCount} gagal.${failureDetail ? ` ${failureDetail}` : ''}`)
    }
    setSelectedRows([])
  }

  const bulkActions: BulkAction[] = [
    {
      id: 'bulk-activate',
      label: 'Aktifkan Terpilih',
      icon: <Power className="h-3.5 w-3.5" />,
      permission: 'warehouses.edit',
      onClick: (ids) => runBulkStatusChange(ids, true, (id) => activate.mutateAsync(id)),
    },
    {
      id: 'bulk-deactivate',
      label: 'Nonaktifkan Terpilih',
      icon: <PowerOff className="h-3.5 w-3.5" />,
      variant: 'destructive',
      permission: 'warehouses.deactivate',
      onClick: (ids) => runBulkStatusChange(ids, false, (id) => deactivate.mutateAsync(id)),
    },
  ]

  const sidebar = (
    <FilterSidebar
      activeCount={filterActive !== undefined ? 1 : 0}
      onReset={() => setFilterActive(true)}
    >
      <div className="border-b border-[#f1f5f9] px-4 py-3">
        <ListSearchBar
          value={search}
          onChange={setSearch}
          placeholder="Cari kode atau nama gudang..."
          className="w-full max-w-none"
        />
      </div>
      <SingleCheckboxFilter
        title="Status"
        options={STATUS_OPTIONS}
        value={filterActive}
        onChange={setFilterActive}
      />
    </FilterSidebar>
  )

  const columns: ColumnDef<Gudang>[] = [
    {
      id: 'code',
      header: 'Kode',
      size: 100,
      meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
      cell: ({ original }) => original.code,
    },
    {
      id: 'name',
      header: 'Nama Gudang',
      size: 200,
      cell: ({ original }) => <span className="font-medium text-[#24323a]">{original.name}</span>,
    },
    {
      id: 'address',
      header: 'Alamat',
      size: 280,
      cell: ({ original }) => original.address ?? '-',
    },
    {
      id: 'is_active',
      header: 'Status',
      size: 90,
      cell: ({ original }) => <ActiveStatusBadge isActive={original.is_active} />,
    },
    {
      // Aktif/nonaktif pindah ke bulkActions (format KontakListPage); tombol
      // per baris tinggal edit saja.
      id: 'actions',
      header: '',
      size: 60,
      cell: ({ original }) => (
        <PermissionGuard permission="warehouses.edit">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
        </PermissionGuard>
      ),
    },
  ]

  return (
    <WorkspaceLayout
      title="Gudang"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Gudang' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="warehouses.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Gudang
          </Button>
        </PermissionGuard>
      }
    >
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        totalRows={data?.meta.total ?? 0}
        isLoading={isLoading}
        isFetching={isFetching}
        pagination={{ pageIndex: 0, pageSize: 25 }}
        onPaginationChange={() => {}}
        selectedRows={selectedRows}
        onRowSelect={setSelectedRows}
        bulkActions={bulkActions}
        emptyTitle="Belum ada gudang"
        emptyDescription="Tambahkan gudang untuk menyimpan stok produk."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingItem ? 'Edit Gudang' : 'Tambah Gudang'}</DialogTitle>
            <DialogDescription className="text-[13px] text-[#64748b]">Lengkapi nama dan detail gudang.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Kode <span className="text-red-500">*</span>
              </Label>
              <Input {...register('code')} placeholder="GDG-01" className={cn('h-9 text-[13px]', fieldErrorClass(errors.code))} />
              <FieldError message={errors.code?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input {...register('name')} placeholder="Gudang Utama" className={cn('h-9 text-[13px]', fieldErrorClass(errors.name))} />
              <FieldError message={errors.name?.message} />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alamat</Label>
              <Textarea {...register('address')} placeholder="Alamat gudang (opsional)" className={cn('text-[13px] resize-none', fieldErrorClass(errors.address))} rows={2} />
              <FieldError message={errors.address?.message} />
            </div>
            <div className="flex items-center gap-3">
              <Controller
                name="is_active"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              <div className="flex flex-col">
                <Label className="text-[13px] text-[#24323a]">Gudang aktif</Label>
                <FieldError message={errors.is_active?.message} />
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={() => setDialogOpen(false)}>Batal</Button>
              <Button type="submit" className="bg-[#e39774] hover:bg-[#d4845e] h-8 text-[13px]" disabled={isSubmitting}>
                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  )
}
