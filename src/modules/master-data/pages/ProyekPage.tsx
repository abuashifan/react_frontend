import { useDeferredValue, useState } from 'react'
import { Plus, Pencil, Power, PowerOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { FilterSidebar, FilterSection } from '@/components/shared/layout/FilterSidebar'
import { DataTable } from '@/components/shared/table/DataTable'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { useProyekList, useProyekMutations } from '../hooks/useSimpleLists'
import { proyekSchema, type ProyekFormValues } from '../schemas/proyekSchema'
import type { Proyek, ProyekStatus } from '../types/proyek.types'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { cn } from '@/lib/utils'
import { toDateInputValue } from '@/lib/utils'
import { MasterDataSearch } from '../components/MasterDataSearch'
import { MasterDataQueryError } from '../components/MasterDataQueryError'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'

const STATUS_LABELS: Record<ProyekStatus, string> = {
  active: 'Aktif',
  completed: 'Selesai',
  on_hold: 'Ditahan',
  cancelled: 'Dibatalkan',
}

const STATUS_COLORS: Record<ProyekStatus, string> = {
  active: 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]',
  completed: 'bg-[#DBEAFE] text-[#1E40AF] hover:bg-[#DBEAFE]',
  on_hold: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  cancelled: 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]',
}

export default function ProyekPage() {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<Proyek | null>(null)
  const [filterStatus, setFilterStatus] = useState<ProyekStatus | undefined>()
  const [formStatus, setFormStatus] = useState<ProyekStatus>('active')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)

  const query = useProyekList({ page, per_page: perPage, search: deferredSearch || undefined, status: filterStatus })
  const { create, update, activate, deactivate } = useProyekMutations()

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ProyekFormValues>({
    resolver: zodResolver(proyekSchema),
    defaultValues: { status: 'active' as ProyekStatus },
  })

  const openCreate = () => {
    setEditingItem(null)
    setFormStatus('active')
    reset({ code: '', name: '', description: '', status: 'active', start_date: '', end_date: '' })
    setDialogOpen(true)
  }

  const openEdit = (item: Proyek) => {
    setEditingItem(item)
    setFormStatus(item.status)
    reset({
      code: item.code,
      name: item.name,
      description: item.description ?? '',
      status: item.status,
      start_date: toDateInputValue(item.start_date),
      end_date: toDateInputValue(item.end_date),
    })
    setDialogOpen(true)
  }

  const onSubmit = async (values: ProyekFormValues) => {
    const payload = { ...values, status: formStatus }
    try {
      if (editingItem) {
        await update.mutateAsync({ id: editingItem.id, payload })
        toast.success('Proyek berhasil diperbarui.')
      } else {
        await create.mutateAsync(payload)
        toast.success('Proyek berhasil dibuat.')
      }
      setDialogOpen(false)
    } catch (error) {
      applyApiValidationErrors(error, setError)
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan proyek.'))
    }
  }

  const handleActivate = async (item: Proyek) => {
    try {
      await activate.mutateAsync(item.id)
      toast.success('Proyek berhasil diaktifkan.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal mengaktifkan proyek.'))
    }
  }

  const handleDeactivate = async (item: Proyek) => {
    if (!confirm(`Nonaktifkan proyek "${item.name}"? Data historis tidak akan dihapus.`)) return
    try {
      await deactivate.mutateAsync(item.id)
      toast.success('Proyek berhasil dinonaktifkan.')
    } catch {
      toast.error('Gagal menonaktifkan proyek.')
    }
  }

  const columns: ColumnDef<Proyek>[] = [
    {
      id: 'lifecycle',
      header: 'Aktivasi',
      size: 90,
      cell: ({ original }) => original.is_active ? 'Aktif' : 'Nonaktif',
    },
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
      id: 'status',
      header: 'Status',
      size: 110,
      cell: ({ original }) => (
        <Badge className={cn('text-[11px] px-2 py-0.5 rounded-full', STATUS_COLORS[original.status])}>
          {STATUS_LABELS[original.status]}
        </Badge>
      ),
    },
    {
      id: 'start_date',
      header: 'Mulai',
      size: 110,
      cell: ({ original }) => original.start_date
        ? new Date(original.start_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-',
    },
    {
      id: 'end_date',
      header: 'Selesai',
      size: 110,
      cell: ({ original }) => original.end_date
        ? new Date(original.end_date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
        : '-',
    },
    {
      id: 'actions',
      header: '',
      size: 100,
      cell: ({ original }) => (
        <div className="flex items-center gap-1">
          <PermissionGuard permission="projects.edit">
            <Button type="button" aria-label={`Edit proyek ${original.name}`} variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-[#326273]" onClick={() => openEdit(original)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          </PermissionGuard>
          <PermissionGuard permission="projects.edit">
            <Button type="button" aria-label={`${original.is_active ? 'Nonaktifkan' : 'Aktifkan'} proyek ${original.name}`} variant="ghost" size="sm" className="h-7 w-7 p-0 text-[#64748b] hover:text-amber-600" onClick={() => original.is_active ? handleDeactivate(original) : void handleActivate(original)}>
              {original.is_active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
            </Button>
          </PermissionGuard>
        </div>
      ),
    },
  ]

  const sidebar = (
    <FilterSidebar
      activeCount={filterStatus ? 1 : 0}
      onReset={() => setFilterStatus(undefined)}
    >
      <FilterSection title="Status">
        {(Object.keys(STATUS_LABELS) as ProyekStatus[]).map((s) => (
          <label key={s} className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filterStatus === s}
              onCheckedChange={(checked) => setFilterStatus(checked ? s : undefined)}
            />
            <span className="text-[12px] text-[#334155]">{STATUS_LABELS[s]}</span>
          </label>
        ))}
      </FilterSection>
    </FilterSidebar>
  )

  return (
    <WorkspaceLayout
      title="Proyek"
      breadcrumb={[{ label: 'Master Data' }, { label: 'Proyek' }]}
      sidebar={sidebar}
      action={
        <PermissionGuard permission="projects.create">
          <Button className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]" onClick={openCreate}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Proyek
          </Button>
        </PermissionGuard>
      }
    >
      <MasterDataSearch value={search} onChange={(value) => { setSearch(value); setPage(1) }} placeholder="Cari kode atau nama proyek..." />
      {query.isError ? <MasterDataQueryError error={query.error} onRetry={() => void query.refetch()} /> : <DataTable
        data={query.data?.data ?? []}
        columns={columns}
        totalRows={query.data?.meta.total ?? 0}
        isLoading={query.isLoading}
        isFetching={query.isFetching}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(state) => { setPage(state.pageIndex + 1); setPerPage(state.pageSize) }}
        emptyTitle="Belum ada proyek"
        emptyDescription="Tambahkan proyek untuk pelacakan biaya per proyek."
      />}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">{editingItem ? 'Edit Proyek' : 'Tambah Proyek'}</DialogTitle>
            <DialogDescription>Kelola kode, periode, status bisnis, dan deskripsi proyek.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Kode <span className="text-red-500">*</span>
              </Label>
              <Input {...register('code')} placeholder="PRJ-001" className="h-9 text-[13px]" />
              {errors.code && <p className="text-[11px] text-red-500">{errors.code.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
                Nama <span className="text-red-500">*</span>
              </Label>
              <Input {...register('name')} placeholder="Proyek Renovasi" className="h-9 text-[13px]" />
              {errors.name && <p className="text-[11px] text-red-500">{errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</Label>
              <Select value={formStatus} onValueChange={(v) => setFormStatus(v as ProyekStatus)}>
                <SelectTrigger className="h-9 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="completed">Selesai</SelectItem>
                  <SelectItem value="on_hold">Ditahan</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal Mulai</Label>
                <Input {...register('start_date')} type="date" className="h-9 text-[13px]" />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal Selesai</Label>
                <Input {...register('end_date')} type="date" className="h-9 text-[13px]" />
                {errors.end_date && <p className="text-[11px] text-red-500">{errors.end_date.message}</p>}
              </div>
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
