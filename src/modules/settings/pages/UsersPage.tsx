import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { ConfirmDialog } from '@/components/shared/document/ConfirmDialog'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { formatDate, cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCompanyUsers, useCompanyUserMutations, useAccessRoles } from '../hooks/useAccessManagement'
import type { CompanyUser, CompanyUserStatus } from '../types/access.types'

const STATUS_BADGE: Record<CompanyUserStatus, { label: string; className: string }> = {
  active: { label: 'Aktif', className: 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]' },
  inactive: { label: 'Nonaktif', className: 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]' },
  pending: { label: 'Menunggu', className: 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]' },
}

export default function UsersPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { data, isLoading } = useCompanyUsers()
  const { data: rolesData } = useAccessRoles()
  const { updateRole, deactivate, reactivate, remove } = useCompanyUserMutations()
  const currentUserId = useAuthStore((state) => state.user?.id ?? null)

  const [roleDialogUser, setRoleDialogUser] = useState<CompanyUser | null>(null)
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [confirmUser, setConfirmUser] = useState<CompanyUser | null>(null)
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'remove' | null>(null)

  const users = data?.data ?? []
  const roles = rolesData?.data ?? []
  const activeManagerCount = users.filter((u) => u.status === 'active' && ['owner', 'admin'].includes(u.role ?? '')).length

  const openRoleDialog = (u: CompanyUser) => {
    setRoleDialogUser(u)
    setSelectedRoleId(u.role_id ?? null)
  }

  const isProtectedUser = (u: CompanyUser) => {
    const isCurrentUser = currentUserId !== null && u.user_id === currentUserId
    const isSoleManager = u.status === 'active' && ['owner', 'admin'].includes(u.role ?? '') && activeManagerCount === 1
    return isCurrentUser || isSoleManager
  }

  const openConfirm = (u: CompanyUser, action: 'deactivate' | 'remove') => {
    setConfirmUser(u)
    setConfirmAction(action)
  }

  const handleSaveRole = async () => {
    if (!roleDialogUser) return
    try {
      await updateRole.mutateAsync({ id: roleDialogUser.id, payload: { role_id: selectedRoleId } })
      toast.success('Peran pengguna diperbarui.')
      setRoleDialogUser(null)
    } catch { toast.error('Gagal memperbarui peran.') }
  }

  const handleToggle = async (u: CompanyUser) => {
    try {
      if (u.status === 'active') { await deactivate.mutateAsync(u.id); toast.success('Pengguna dinonaktifkan.') }
      else { await reactivate.mutateAsync(u.id); toast.success('Pengguna diaktifkan.') }
    } catch { toast.error('Gagal mengubah status pengguna.') }
  }

  const columns: ColumnDef<CompanyUser>[] = [
    { id: 'name', header: 'Nama', size: 180, cell: ({ original }) => <span className="font-medium text-[#24323a] text-[13px]">{original.name ?? '-'}</span> },
    { id: 'email', header: 'Email', size: 220, cell: ({ original }) => <span className="text-[13px]">{original.email ?? '-'}</span> },
    { id: 'role', header: 'Peran', size: 140, cell: ({ original }) => <span className="text-[13px]">{original.role_name ?? original.role ?? '—'}</span> },
    {
      id: 'status', header: 'Status', size: 110,
      cell: ({ original }) => {
        const badge = STATUS_BADGE[original.status] ?? STATUS_BADGE.inactive
        return <Badge className={cn('text-[11px] px-2 py-0.5 rounded-full', badge.className)}>{badge.label}</Badge>
      },
    },
    { id: 'joined_at', header: 'Bergabung', size: 120, cell: ({ original }) => <span className="tabular-nums text-[13px]">{formatDate(original.joined_at)}</span> },
    {
      id: 'actions', header: '', size: 240,
      cell: ({ original }) => (
        <div className="flex items-center gap-1">
          {isProtectedUser(original) ? <span className="rounded-full border border-[#d9e2e5] px-2 py-0.5 text-[10px] font-semibold text-[#64748b]">Dilindungi</span> : null}
          <PermissionGuard permission="access.users.manage" fallback={null}>
            {!isProtectedUser(original) && (
              <Button type="button" size="sm" variant="ghost" onClick={() => openRoleDialog(original)} className="h-7 text-[11px] text-[#326273]">Ubah Peran</Button>
            )}
          </PermissionGuard>
          <PermissionGuard permission="access.users.deactivate" fallback={null}>
            {original.status === 'active' ? (
              isProtectedUser(original) ? null : (
                <Button type="button" size="sm" variant="ghost" onClick={() => openConfirm(original, 'deactivate')} className="h-7 text-[11px]">Nonaktifkan</Button>
              )
            ) : (
              <Button type="button" size="sm" variant="ghost" onClick={() => void handleToggle(original)} className="h-7 text-[11px]">Aktifkan</Button>
            )}
          </PermissionGuard>
          <PermissionGuard permission="access.users.remove" fallback={null}>
            {!isProtectedUser(original) && (
              <Button type="button" size="sm" variant="ghost" onClick={() => openConfirm(original, 'remove')} className="h-7 text-[11px] text-red-500 hover:text-red-600">Hapus</Button>
            )}
          </PermissionGuard>
        </div>
      ),
    },
  ]

  return (
    <WorkspaceLayout
      title="Manajemen Pengguna"
      breadcrumb={[{ label: 'Pengaturan' }, { label: 'Pengguna' }]}
      action={
        <PermissionGuard permission="access.invitations.create" fallback={null}>
          <Button type="button" onClick={() => navigate('/settings/invitations')} className="h-8 gap-1.5 bg-[#e39774] text-[12px] text-white hover:bg-[#d4845e]">
            <Mail className="h-4 w-4" /> Undang Pengguna
          </Button>
        </PermissionGuard>
      }
    >
      <DataTable
        columns={columns}
        data={users}
        totalRows={users.length}
        isLoading={isLoading}
        pagination={{ pageIndex: 0, pageSize: 25 }}
        onPaginationChange={() => {}}
        emptyTitle="Belum ada pengguna"
        emptyDescription="Undang pengguna untuk memberi akses ke perusahaan ini."
      />

      <Dialog open={!!roleDialogUser} onOpenChange={(o) => !o && setRoleDialogUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-[15px]">Ubah Peran — {roleDialogUser?.name ?? roleDialogUser?.email}</DialogTitle></DialogHeader>
          <div className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Peran</Label>
              <select
                value={selectedRoleId ?? ''}
                onChange={(e) => setSelectedRoleId(e.target.value ? Number(e.target.value) : null)}
                className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Tanpa peran —</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setRoleDialogUser(null)} className="h-9 text-[13px]">Batal</Button>
            <Button type="button" onClick={() => void handleSaveRole()} disabled={updateRole.isPending} className="h-9 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]">
              {updateRole.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!confirmUser && !!confirmAction}
        onClose={() => {
          setConfirmUser(null)
          setConfirmAction(null)
        }}
        onConfirm={() => {
          if (!confirmUser || !confirmAction) return
          const user = confirmUser
          const action = confirmAction
          setConfirmUser(null)
          setConfirmAction(null)
          void (async () => {
            try {
              if (action === 'deactivate') {
                await deactivate.mutateAsync(user.id)
                toast.success('Pengguna dinonaktifkan.')
              } else {
                await remove.mutateAsync(user.id)
                toast.success('Pengguna dihapus dari perusahaan.')
              }
            } catch {
              toast.error(action === 'deactivate' ? 'Gagal menonaktifkan pengguna.' : 'Gagal menghapus pengguna.')
            }
          })()
        }}
        title={confirmAction === 'remove' ? 'Hapus Pengguna' : 'Nonaktifkan Pengguna'}
        description={confirmUser ? `${confirmAction === 'remove' ? 'Hapus' : 'Nonaktifkan'} ${confirmUser.name ?? confirmUser.email ?? 'pengguna ini'}? Akses perusahaan akan ${confirmAction === 'remove' ? 'dicabut' : 'dimatikan'}.` : ''}
        confirmLabel={confirmAction === 'remove' ? 'Hapus' : 'Nonaktifkan'}
        variant={confirmAction === 'remove' ? 'destructive' : 'primary'}
        isLoading={deactivate.isPending || remove.isPending}
      />
    </WorkspaceLayout>
  )
}
