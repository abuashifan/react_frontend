import { useState } from 'react'
import { Mail } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable, type ColumnDef } from '@/components/shared/table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/document/ConfirmDialog'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { usePermission } from '@/hooks/usePermission'
import { useOpenPrimaryTab } from '@/hooks/useOpenPrimaryTab'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/stores/useAuthStore'
import { PermissionMatrix, type AccessSelection } from '../components/PermissionMatrix'
import { useCompanyUsers, useCompanyUserPermissions, useCompanyUserMutations } from '../hooks/useAccessManagement'
import type { CompanyUser, CompanyUserPermissions } from '../types/access.types'

function AccessEditor({ user, users, access, onClose }: { user: CompanyUser; users: CompanyUser[]; access: CompanyUserPermissions; onClose: () => void }) {
  const { toast } = useToast()
  const { can } = usePermission()
  const { updatePermissions } = useCompanyUserMutations()
  const catalogKeys = new Set(access.catalog.modules.flatMap((module) => [...module.features.flatMap((feature) => Object.values(feature.permissions).map((p) => p.key)), ...module.special_permissions.map((p) => p.key)]))
  const [selection, setSelection] = useState<AccessSelection>({ full_access: access.full_access, permissions: access.permissions.filter((key) => catalogKeys.has(key)) })
  const [sourceId, setSourceId] = useState<number | undefined>()
  const source = useCompanyUserPermissions(sourceId)
  const editable = can('access.users.edit') && !user.is_owner
  const save = async () => {
    try {
      await updatePermissions.mutateAsync({ id: user.id, payload: selection })
      toast.success('Hak akses disimpan.')
      onClose()
    } catch (error) { toast.error(getApiErrorMessage(error, 'Gagal menyimpan hak akses.')) }
  }
  return <>
    {editable && <div className="flex flex-wrap items-end gap-2"><label className="flex flex-col gap-1 text-xs">Salin dari pengguna lain
      <select aria-label="Salin dari pengguna lain" className="h-9 rounded border bg-background px-2 text-sm" value={sourceId ?? ''} onChange={(e) => setSourceId(e.target.value ? Number(e.target.value) : undefined)}>
        <option value="">Pilih pengguna</option>{users.filter((item) => item.id !== user.id).map((item) => <option key={item.id} value={item.id}>{item.name ?? item.email}</option>)}
      </select></label>
      <Button type="button" variant="outline" disabled={!source.data || source.isFetching} onClick={() => { const copy = source.data?.data; if (copy) setSelection({ full_access: copy.full_access || copy.is_owner, permissions: copy.permissions.filter((key) => catalogKeys.has(key)) }) }}>Salin Hak Akses</Button>
    </div>}
    <PermissionMatrix catalog={access.catalog} value={selection} onChange={setSelection} owner={user.is_owner} readOnly={!editable} />
    <DialogFooter><Button type="button" variant="outline" onClick={onClose}>Tutup</Button>{editable && <Button type="button" disabled={updatePermissions.isPending} onClick={() => void save()}>{updatePermissions.isPending ? 'Menyimpan...' : 'Simpan akses'}</Button>}</DialogFooter>
  </>
}

export default function UsersPage() {
  const openTab = useOpenPrimaryTab()
  const { toast } = useToast()
  const { data, isLoading } = useCompanyUsers()
  const { deactivate, reactivate, remove } = useCompanyUserMutations()
  const currentUserId = useAuthStore((state) => state.user?.id)
  const [selected, setSelected] = useState<CompanyUser | null>(null)
  const [confirm, setConfirm] = useState<{ user: CompanyUser; action: 'deactivate' | 'remove' } | null>(null)
  const details = useCompanyUserPermissions(selected?.id)
  const users = data?.data ?? []
  const changeStatus = async (user: CompanyUser, action: 'deactivate' | 'reactivate' | 'remove') => {
    try { await ({ deactivate, reactivate, remove }[action]).mutateAsync(user.id); toast.success('Status pengguna diperbarui.') }
    catch (error) { toast.error(getApiErrorMessage(error, 'Gagal mengubah status pengguna.')) }
  }
  const columns: ColumnDef<CompanyUser>[] = [
    { id: 'name', header: 'Nama', size: 180, cell: ({ original }) => <button type="button" className="text-left font-medium text-primary underline" onClick={() => setSelected(original)}>{original.name ?? original.email ?? 'Pengguna'}</button> },
    { id: 'email', header: 'Email', size: 220, cell: ({ original }) => original.email ?? '–' },
    { id: 'access', header: 'Akses', size: 140, cell: ({ original }) => original.is_owner ? 'Pemilik' : original.full_access ? 'Akses penuh' : `${original.feature_count ?? 0} fitur` },
    { id: 'status', header: 'Status', size: 110, cell: ({ original }) => <Badge variant="outline">{original.status === 'active' ? 'Aktif' : original.status === 'removed' ? 'Dihapus' : 'Nonaktif'}</Badge> },
    { id: 'joined_at', header: 'Bergabung', size: 120, cell: ({ original }) => formatDate(original.joined_at) },
    { id: 'actions', header: '', size: 180, cell: ({ original }) => {
      const protectedUser = original.is_owner || original.user_id === currentUserId
      return <div className="flex gap-1">{original.status === 'active' ? <PermissionGuard permission="access.users.delete">{!protectedUser && <><Button size="sm" variant="ghost" onClick={() => setConfirm({ user: original, action: 'deactivate' })}>Nonaktifkan</Button><Button size="sm" variant="ghost" onClick={() => setConfirm({ user: original, action: 'remove' })}>Hapus</Button></>}</PermissionGuard> : <PermissionGuard permission="access.users.edit"><Button size="sm" variant="ghost" onClick={() => void changeStatus(original, 'reactivate')}>Aktifkan</Button></PermissionGuard>}</div>
    } },
  ]
  return <WorkspaceLayout title="Manajemen Pengguna" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Pengguna' }]} action={<PermissionGuard permission="access.invitations.create"><Button onClick={() => openTab({ id: 'settings-invitations', menuKey: 'invitations', label: 'Undangan', module: 'settings', path: '/settings/invitations' })}><Mail className="mr-2 h-4 w-4" />Undang Pengguna</Button></PermissionGuard>}>
    <DataTable columns={columns} data={users} totalRows={users.length} isLoading={isLoading} pagination={{ pageIndex: 0, pageSize: 25 }} onPaginationChange={() => {}} emptyTitle="Belum ada pengguna" emptyDescription="Undang pengguna untuk memberi akses ke perusahaan ini." />
    <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}><DialogContent className="max-h-[90dvh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>Akses — {selected?.name ?? selected?.email}</DialogTitle><DialogDescription>Atur hak akses pengguna untuk perusahaan ini.</DialogDescription></DialogHeader>{details.isLoading && <p>Memuat hak akses...</p>}{details.isError && <p role="alert">Gagal memuat hak akses.</p>}{selected && details.data && <AccessEditor key={selected.id} user={selected} users={users} access={details.data.data} onClose={() => setSelected(null)} />}</DialogContent></Dialog>
    <ConfirmDialog isOpen={!!confirm} onClose={() => setConfirm(null)} onConfirm={() => { if (confirm) void changeStatus(confirm.user, confirm.action); setConfirm(null) }} title={confirm?.action === 'remove' ? 'Hapus pengguna' : 'Nonaktifkan pengguna'} description={`Lanjutkan perubahan untuk ${confirm?.user.name ?? confirm?.user.email ?? 'pengguna ini'}?`} confirmLabel="Lanjutkan" />
  </WorkspaceLayout>
}
