import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { useSettingsUsers, useSettingsUserMutations, useSettingsRoles } from '../hooks/useSettings'
import type { SettingsUser } from '../types/settings.types'

const createSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal 8 karakter'),
  role_id: z.number().nullable().optional(),
})
const editSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().optional(),
  role_id: z.number().nullable().optional(),
})
type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

function formatDate(s?: string | null) {
  if (!s) return '—'
  return new Date(s).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function UsersPage() {
  const [page, setPage] = useState(1)
  const [perPage] = useState<25 | 50 | 100>(25)
  const [search, setSearch] = useState('')
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | null>(null)
  const [editUser, setEditUser] = useState<SettingsUser | null>(null)
  const { data, isLoading } = useSettingsUsers({ page, search })
  const { data: rolesData } = useSettingsRoles()
  const mutations = useSettingsUserMutations()
  const { toast } = useToast()

  const roles = rolesData?.data ?? []

  const createForm = useForm<CreateForm>({ resolver: zodResolver(createSchema) })
  const editForm = useForm<EditForm>({ resolver: zodResolver(editSchema) })

  const openCreate = () => { createForm.reset({ name: '', email: '', password: '', role_id: null }); setDialogMode('create') }
  const openEdit = (u: SettingsUser) => {
    setEditUser(u)
    editForm.reset({ name: u.name, email: u.email, role_id: null, password: '' })
    setDialogMode('edit')
  }

  const handleCreate = createForm.handleSubmit(async (values) => {
    try {
      await mutations.create.mutateAsync({ name: values.name, email: values.email, password: values.password, role_id: values.role_id })
      toast.success('Pengguna dibuat.')
      setDialogMode(null)
    } catch { toast.error('Gagal membuat pengguna.') }
  })

  const handleEdit = editForm.handleSubmit(async (values) => {
    if (!editUser) return
    try {
      await mutations.update.mutateAsync({ id: editUser.id, payload: { name: values.name, email: values.email, role_id: values.role_id, password: values.password || undefined } })
      toast.success('Pengguna diperbarui.')
      setDialogMode(null)
    } catch { toast.error('Gagal memperbarui pengguna.') }
  })

  const handleToggle = async (u: SettingsUser) => {
    try {
      if (u.is_active) { await mutations.deactivate.mutateAsync(u.id); toast.success('Pengguna dinonaktifkan.') }
      else { await mutations.activate.mutateAsync(u.id); toast.success('Pengguna diaktifkan.') }
    } catch { toast.error('Gagal mengubah status pengguna.') }
  }

  const columns: ColumnDef<SettingsUser>[] = [
    {
      id: 'name',
      header: 'Nama',
      cell: ({ original }) => (
        <button type="button" onClick={() => openEdit(original)} className="font-medium text-[#5c9ead] hover:underline text-left text-[13px]">
          {original.name}
        </button>
      ),
    },
    { id: 'email', header: 'Email', cell: ({ original }) => <span className="text-[13px]">{original.email}</span> },
    { id: 'role', header: 'Peran', cell: ({ original }) => <span className="text-[13px]">{original.role ?? '—'}</span> },
    { id: 'last_login_at', header: 'Login Terakhir', cell: ({ original }) => <span className="tabular-nums text-[13px]">{formatDate(original.last_login_at)}</span> },
    {
      id: 'is_active',
      header: 'Status',
      cell: ({ original }) => (
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${original.is_active ? 'bg-green-100 text-green-700' : 'bg-[#f1f5f9] text-[#64748b]'}`}>
          {original.is_active ? 'Aktif' : 'Nonaktif'}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      size: 110,
      cell: ({ original }) => (
        <PermissionGuard permission="settings.users.manage" fallback={null}>
          <Button type="button" size="sm" variant="ghost" onClick={() => void handleToggle(original)} className="h-7 text-[11px]">
            {original.is_active ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </PermissionGuard>
      ),
    },
  ]

  return (
    <WorkspaceLayout
      title="Manajemen Pengguna"
      breadcrumb={[{ label: 'Pengaturan' }, { label: 'Pengguna' }]}
      action={
        <PermissionGuard permission="settings.users.manage" fallback={null}>
          <Button type="button" onClick={openCreate} className="h-8 gap-1.5 bg-[#e39774] text-[12px] text-white hover:bg-[#d4845e]">
            <Plus className="h-4 w-4" /> Tambah Pengguna
          </Button>
        </PermissionGuard>
      }
    >
      <div className="mb-3">
        <Input placeholder="Cari nama atau email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="h-9 max-w-xs text-[13px]" />
      </div>
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        totalRows={data?.meta.total ?? 0}
        isLoading={isLoading}
        pagination={{ pageIndex: page - 1, pageSize: perPage }}
        onPaginationChange={(s) => setPage(s.pageIndex + 1)}
      />

      {/* Create dialog */}
      <Dialog open={dialogMode === 'create'} onOpenChange={(o) => !o && setDialogMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">Tambah Pengguna</DialogTitle></DialogHeader>
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama <span className="text-red-500">*</span></Label>
              <Input {...createForm.register('name')} className="h-9 text-[13px]" />
              {createForm.formState.errors.name && <p className="text-[11px] text-red-500">{createForm.formState.errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Email <span className="text-red-500">*</span></Label>
              <Input {...createForm.register('email')} type="email" className="h-9 text-[13px]" />
              {createForm.formState.errors.email && <p className="text-[11px] text-red-500">{createForm.formState.errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Password <span className="text-red-500">*</span></Label>
              <Input {...createForm.register('password')} type="password" className="h-9 text-[13px]" />
              {createForm.formState.errors.password && <p className="text-[11px] text-red-500">{createForm.formState.errors.password.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Peran</Label>
              <select className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" onChange={(e) => createForm.setValue('role_id', e.target.value ? Number(e.target.value) : null)}>
                <option value="">— Tanpa peran —</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogMode(null)} className="h-9 text-[13px]">Batal</Button>
              <Button type="submit" disabled={createForm.formState.isSubmitting} className="h-9 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]">
                {createForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={dialogMode === 'edit'} onOpenChange={(o) => !o && setDialogMode(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">Edit Pengguna</DialogTitle></DialogHeader>
          <form onSubmit={(e) => void handleEdit(e)} className="space-y-3">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama <span className="text-red-500">*</span></Label>
              <Input {...editForm.register('name')} className="h-9 text-[13px]" />
              {editForm.formState.errors.name && <p className="text-[11px] text-red-500">{editForm.formState.errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Email <span className="text-red-500">*</span></Label>
              <Input {...editForm.register('email')} type="email" className="h-9 text-[13px]" />
              {editForm.formState.errors.email && <p className="text-[11px] text-red-500">{editForm.formState.errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Password Baru <span className="text-[#94a3b8]">(kosongkan jika tidak diubah)</span></Label>
              <Input {...editForm.register('password')} type="password" className="h-9 text-[13px]" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Peran</Label>
              <select className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring" onChange={(e) => editForm.setValue('role_id', e.target.value ? Number(e.target.value) : null)}>
                <option value="">— Tanpa peran —</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogMode(null)} className="h-9 text-[13px]">Batal</Button>
              <Button type="submit" disabled={editForm.formState.isSubmitting} className="h-9 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]">
                {editForm.formState.isSubmitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  )
}
