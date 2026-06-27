import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Copy } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { cn } from '@/lib/utils'
import { useAccessRoles, useAccessRole, useAccessRoleMutations, usePermissionCatalog } from '../hooks/useAccessManagement'
import type { AccessRole, PermissionDefinition } from '../types/access.types'

const roleSchema = z.object({
  name: z.string().min(1, 'Nama peran wajib diisi'),
  description: z.string().optional(),
})
type RoleForm = z.infer<typeof roleSchema>

export default function RolesPage() {
  const { toast } = useToast()
  const { data: rolesData, isLoading } = useAccessRoles()
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const { data: roleData } = useAccessRole(selectedRoleId ?? undefined)
  const { data: catalogData } = usePermissionCatalog()
  const { create, clone, deactivate, reactivate, updatePermissions } = useAccessRoleMutations()
  const [localPerms, setLocalPerms] = useState<Set<string> | null>(null)
  const [createOpen, setCreateOpen] = useState(false)

  const roles = rolesData?.data ?? []
  const role = roleData?.data
  const catalog = catalogData?.data

  const createForm = useForm<RoleForm>({ resolver: zodResolver(roleSchema), defaultValues: { name: '', description: '' } })

  const getPerms = (): Set<string> => localPerms ?? new Set(role?.permission_keys ?? [])

  const handleSelectRole = (id: number) => { setSelectedRoleId(id); setLocalPerms(null) }

  const togglePerm = (key: string) => {
    const perms = new Set(getPerms())
    if (perms.has(key)) perms.delete(key); else perms.add(key)
    setLocalPerms(perms)
  }

  const handleSavePerms = async () => {
    if (!selectedRoleId) return
    try {
      await updatePermissions.mutateAsync({ id: selectedRoleId, permissions: Array.from(getPerms()) })
      setLocalPerms(null)
      toast.success('Izin peran disimpan.')
    } catch { toast.error('Gagal menyimpan izin.') }
  }

  const handleCreate = createForm.handleSubmit(async (values) => {
    try {
      const res = await create.mutateAsync({ name: values.name, description: values.description || null })
      toast.success('Peran berhasil dibuat.')
      setCreateOpen(false)
      createForm.reset()
      setSelectedRoleId(res.data.id)
      setLocalPerms(null)
    } catch { toast.error('Gagal membuat peran.') }
  })

  const handleClone = async (r: AccessRole) => {
    try { await clone.mutateAsync(r.id); toast.success(`Peran "${r.name}" diklon.`) }
    catch { toast.error('Gagal mengklon peran.') }
  }

  const handleToggleActive = async (r: AccessRole) => {
    try {
      if (r.is_active) { await deactivate.mutateAsync(r.id); toast.success('Peran dinonaktifkan.') }
      else { await reactivate.mutateAsync(r.id); toast.success('Peran diaktifkan.') }
    } catch { toast.error('Gagal mengubah status peran.') }
  }

  if (isLoading) {
    return <WorkspaceLayout title="Peran & Hak Akses" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Peran' }]}><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></WorkspaceLayout>
  }

  const perms = getPerms()

  return (
    <WorkspaceLayout
      title="Peran & Hak Akses"
      breadcrumb={[{ label: 'Pengaturan' }, { label: 'Peran' }]}
      action={
        <PermissionGuard permission="access.roles.create" fallback={null}>
          <Button type="button" onClick={() => setCreateOpen(true)} className="h-8 gap-1.5 bg-[#e39774] text-[12px] text-white hover:bg-[#d4845e]">
            <Plus className="h-4 w-4" /> Buat Peran Baru
          </Button>
        </PermissionGuard>
      }
    >
      <div className="flex min-h-[400px] gap-4">
        {/* Role list */}
        <div className="w-60 shrink-0 rounded-lg border border-[#e2e8f0] bg-white">
          <div className="border-b border-[#e2e8f0] px-3 py-2"><p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Daftar Peran</p></div>
          <div className="py-1">
            {roles.map((r) => (
              <div key={r.id} className={cn('flex items-center justify-between gap-1 px-3 py-2', selectedRoleId === r.id && 'bg-[#f0f9fc]')}>
                <button type="button" onClick={() => handleSelectRole(r.id)} className="flex min-w-0 flex-1 flex-col items-start text-left">
                  <span className={cn('truncate text-[13px]', selectedRoleId === r.id ? 'font-semibold text-[#5c9ead]' : 'text-[#1e2d35]')}>{r.name}</span>
                  <span className="text-[10px] text-[#94a3b8]">{r.assigned_users_count ?? r.company_users_count ?? 0} pengguna · {r.permissions_count ?? r.permission_keys?.length ?? 0} izin</span>
                </button>
                {!r.is_active && <Badge className="bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9] text-[10px] px-1.5 py-0">Nonaktif</Badge>}
              </div>
            ))}
            {roles.length === 0 && <p className="px-3 py-4 text-[12px] text-[#94a3b8]">Belum ada peran.</p>}
          </div>
        </div>

        {/* Permission editor */}
        <div className="flex-1 rounded-lg border border-[#e2e8f0] bg-white">
          {!selectedRoleId || !role ? (
            <div className="flex h-full items-center justify-center text-[13px] text-[#94a3b8]">Pilih peran untuk mengatur izin</div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-[#e2e8f0] px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-[#1e2d35]">{role.name}{role.is_system && <span className="ml-2 text-[10px] font-normal text-[#94a3b8]">(sistem)</span>}</p>
                  {role.description && <p className="truncate text-[11px] text-[#64748b]">{role.description}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <PermissionGuard permission="access.roles.clone" fallback={null}>
                    <Button type="button" size="sm" variant="ghost" onClick={() => void handleClone(role)} className="h-7 gap-1 text-[11px]"><Copy className="h-3 w-3" /> Klon</Button>
                  </PermissionGuard>
                  {!role.is_system && (
                    <PermissionGuard permission="access.roles.deactivate" fallback={null}>
                      <Button type="button" size="sm" variant="ghost" onClick={() => void handleToggleActive(role)} className="h-7 text-[11px]">{role.is_active ? 'Nonaktifkan' : 'Aktifkan'}</Button>
                    </PermissionGuard>
                  )}
                  <PermissionGuard permission="access.permissions.manage" fallback={null}>
                    <Button type="button" onClick={() => void handleSavePerms()} disabled={updatePermissions.isPending || !localPerms} className="h-7 bg-[#5c9ead] px-4 text-[11px] hover:bg-[#4a8a9b]">{updatePermissions.isPending ? 'Menyimpan...' : 'Simpan Izin'}</Button>
                  </PermissionGuard>
                </div>
              </div>

              <div className="space-y-4 p-4">
                {!catalog && <p className="text-[12px] text-[#94a3b8]">Memuat katalog izin...</p>}
                {catalog?.modules.map((mod) => {
                  const modPerms: PermissionDefinition[] = [
                    ...mod.features.flatMap((f) => Object.values(f.permissions)),
                    ...mod.special_permissions,
                  ]
                  if (modPerms.length === 0) return null
                  return (
                    <div key={mod.key} className="border-t border-[#f1f5f9] pt-3 first:border-t-0 first:pt-0">
                      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{mod.label}</p>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                        {modPerms.map((p) => (
                          <label key={p.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-[#f8fafc]">
                            <Checkbox checked={perms.has(p.key)} onCheckedChange={() => togglePerm(p.key)} disabled={role.is_system} />
                            <span className="text-[12px] text-[#1e2d35]">{p.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Buat Peran Baru</DialogTitle>
            <DialogDescription className="text-[13px] text-[#64748b]">Buat peran baru lalu atur izin aksesnya di panel editor.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label htmlFor="settings-roles-create-name" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama Peran <span className="text-red-500">*</span></Label>
              <Input id="settings-roles-create-name" {...createForm.register('name')} className="h-9 text-[13px]" placeholder="mis. Staf Penjualan" />
              {createForm.formState.errors.name && <p className="text-[11px] text-red-500">{createForm.formState.errors.name.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="settings-roles-create-description" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Deskripsi</Label>
              <Textarea id="settings-roles-create-description" {...createForm.register('description')} className="resize-none text-[13px]" rows={2} placeholder="Deskripsi singkat peran (opsional)" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="h-9 text-[13px]">Batal</Button>
              <Button type="submit" disabled={create.isPending} className="h-9 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]">{create.isPending ? 'Menyimpan...' : 'Simpan'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </WorkspaceLayout>
  )
}
