import { useDeferredValue, useState } from 'react'
import { Plus, Pencil, Power, PowerOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { useDepartemenList, useDepartemenMutations } from '../hooks/useSimpleLists'
import { departemenSchema, type DepartemenFormValues } from '../schemas/departemenSchema'
import type { Departemen } from '../types/departemen.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { cn } from '@/lib/utils'
import { MasterDataSearch } from '../components/MasterDataSearch'
import { MasterDataQueryError } from '../components/MasterDataQueryError'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'

export default function DepartemenPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Departemen | null>(null)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const query = useDepartemenList({ page, per_page: perPage, search: deferredSearch || undefined })
  const { create, update, activate, deactivate } = useDepartemenMutations()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<DepartemenFormValues>({ resolver: zodResolver(departemenSchema) })

  const openCreate = () => {
    setEditingItem(null)
    reset({ code: '', name: '', description: '' })
    setDialogOpen(true)
  }

  const openEdit = (item: Departemen) => {
    setEditingItem(item)
    reset({ code: item.code, name: item.name, description: item.description ?? '' })
    setDialogOpen(true)
  }

  const onSubmit = async (values: DepartemenFormValues) => {
    try {
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, payload: values })
        toast.success('Departemen berhasil diperbarui.')
      } else {
        await create.mutateAsync(values)
        toast.success('Departemen berhasil dibuat.')
      }
      setDialogOpen(false)
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan departemen.'))
    }
  }

  const handleActivate = async (item: Departemen) => {
    try {
      await activate.mutateAsync(item.id)
      toast.success('Departemen berhasil diaktifkan.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal mengaktifkan departemen.'))
    }
  }

  const handleDeactivate = async (item: Departemen) => {
    if (!confirm(`Nonaktifkan departemen "${item.name}"? Data historis tidak akan dihapus.`)) return
    try {
      await deactivate.mutateAsync(item.id)
      toast.success('Departemen berhasil dinonaktifkan.')
    } catch {
      toast.error('Gagal menonaktifkan departemen.')
    }
  }

  const columns: ColumnDef<Departemen>[] = [
    {
      id: 'code',
      header: 'Kode',
      size: 100,
      meta: { sticky: true, stickyLeft: 0, className: 'font-medium text-[#5c9ead]' },
      cell: ({ original }) => original.code,
    },
    {
      id: 'name',
      header: 'Nama',
      size: 200,
      cell: ({ original }) => original.name,
    },
    {
      id: 'is_active',
      header: 'Status',
      size: 90,
      cell: ({ original }) => (
        <Badge className={cn('text-[11px] px-2 py-0.5 rounded-full', original.is_active ? 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]' : 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]')}>
          {original.is_active ? 'Aktif' : 'Nonaktif'}
        </Badge>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ original }) => (
        <div className="flex items-center gap-1">
          <PermissionGuard permission="departments.edit">
            <Button type="button" aria-label={`Edit departemen ${original.name}`} variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="master-data.departments.edit">
            <Button
              type="button"
              aria-label={`${original.is_active ? 'Nonaktifkan' : 'Aktifkan'} departemen ${original.name}`}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-[#64748b] hover:text-amber-600"
              onClick={() => original.is_active ? handleDeactivate(original) : void handleActivate(original)}
            >
              {original.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
            </Button>
          </PermissionGuard>
        </div>
      ),
    },
  ]

  return (
    <WorkspaceLayout
      title="Departemen"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Departemen' }]}
      action={
        <PermissionGuard permission="departments.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Departemen
          </Button>
        </PermissionGuard>
      }
    >
      <MasterDataSearch value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Cari kode atau nama departemen..." />
      {query.isError ? <MasterDataQueryError error={query.error} onRetry={() => void query.refetch()} /> : <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        totalRows={query.data?.meta.total ?? 0}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(state) => { setPage(state.pageIndex + 1); setPerPage(state.pageSize) }}
        emptyTitle="Belum ada departemen"
        emptyDescription="Tambahkan departemen untuk pengelompokan transaksi."
      />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingItem ? 'Edit Departemen' : 'Tambah Departemen'}</DialogTitle>
            <DialogDescription>Isi kode dan nama departemen untuk dimensi transaksi dan laporan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Kode <span className="text-red-500">*</span>
              </Label>
              <Input {...register('code')} placeholder="FIN" className="h-9 text-[13px]" />
              {errors.code && <p className="text-[11px] text-red-500">{errors.code.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input {...register('name')} placeholder="Keuangan" className="h-9 text-[13px]" />
              {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deskripsi</Label>
              <Textarea {...register('description')} rows={3} className="resize-none text-[13px]" />
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
