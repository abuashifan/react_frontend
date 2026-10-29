import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable, type ColumnDef } from '@/components/shared/table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { ConfirmDialog } from '@/components/shared/document/ConfirmDialog'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { FieldError } from '@/components/shared/form/FieldError'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { applyApiValidationErrors, getApiErrorMessage } from '@/lib/apiError'
import { formatDate } from '@/lib/utils'
import { PermissionMatrix, type AccessSelection } from '../components/PermissionMatrix'
import { useInvitations, useInvitationMutations, usePermissionCatalog } from '../hooks/useAccessManagement'
import type { Invitation } from '../types/access.types'

const inviteSchema = z.object({ email: z.string().email('Format email tidak valid') })
type InviteForm = z.infer<typeof inviteSchema>

export default function InvitationsPage() {
  const { toast } = useToast()
  const { can } = usePermission()
  const { data, isLoading } = useInvitations(can('access.invitations.view'))
  const catalog = usePermissionCatalog(can('access.invitations.create'))
  const { create, resend, revoke } = useInvitationMutations()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null)
  const [selection, setSelection] = useState<AccessSelection>({ full_access: false, permissions: [] })
  const [createdLink, setCreatedLink] = useState('')
  const form = useForm<InviteForm>({ resolver: zodResolver(inviteSchema), defaultValues: { email: '' } })
  const linkFor = (invitation: Invitation) => `${window.location.origin}/invitations/${encodeURIComponent(invitation.token)}/accept`
  const copyLink = async (invitation: Invitation) => {
    const link = linkFor(invitation)
    setCreatedLink(link)
    try { await navigator.clipboard.writeText(link); toast.success('Tautan undangan disalin.') }
    catch { toast.warning('Salin tautan undangan yang ditampilkan.') }
  }
  const handleCreate = form.handleSubmit(async (values) => {
    try {
      const result = await create.mutateAsync({ email: values.email, ...selection })
      setCreatedLink(linkFor(result.data))
      toast.success('Undangan dibuat. Bagikan tautan kepada penerima.')
      setDialogOpen(false); form.reset(); setSelection({ full_access: false, permissions: [] })
    } catch (error) { applyApiValidationErrors(error, form.setError); toast.error(getApiErrorMessage(error, 'Gagal membuat undangan.')) }
  })
  const invitations = data?.data ?? []
  const columns: ColumnDef<Invitation>[] = [
    { id: 'email', header: 'Email', size: 220, cell: ({ original }) => original.email },
    { id: 'access', header: 'Akses', size: 130, cell: ({ original }) => original.full_access ? 'Akses penuh' : `${original.permissions?.length ?? 0} izin` },
    { id: 'status', header: 'Status', size: 120, cell: ({ original }) => <Badge variant="outline">{({ pending: 'Menunggu', accepted: 'Diterima', expired: 'Kedaluwarsa', revoked: 'Dibatalkan' })[original.status]}</Badge> },
    { id: 'created_at', header: 'Dibuat', size: 120, cell: ({ original }) => formatDate(original.created_at) },
    { id: 'expires_at', header: 'Kedaluwarsa', size: 120, cell: ({ original }) => formatDate(original.expires_at) },
    { id: 'actions', header: '', size: 250, cell: ({ original }) => original.status === 'pending' ? <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => void copyLink(original)}>Salin tautan</Button><PermissionGuard permission="access.invitations.create"><Button size="sm" variant="ghost" onClick={() => void (async () => { try { const result = await resend.mutateAsync(original.id); setCreatedLink(linkFor(result.data)); toast.success('Tautan baru dibuat.') } catch (error) { toast.error(getApiErrorMessage(error, 'Gagal membuat tautan baru.')) } })()}>Buat ulang</Button></PermissionGuard><PermissionGuard permission="access.invitations.delete"><Button size="sm" variant="ghost" onClick={() => setRevokeTarget(original)}>Cabut</Button></PermissionGuard></div> : null },
  ]
  return <WorkspaceLayout title="Undangan Pengguna" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Undangan' }]} action={<PermissionGuard permission="access.invitations.create"><Button onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Buat Undangan</Button></PermissionGuard>}>
    {createdLink && <div className="mb-4 space-y-1 rounded border p-3"><Label htmlFor="invitation-link">Bagikan tautan ini kepada penerima</Label><Input id="invitation-link" readOnly value={createdLink} onFocus={(event) => event.currentTarget.select()} /></div>}
    {can('access.invitations.view') && <DataTable columns={columns} data={invitations} totalRows={invitations.length} isLoading={isLoading} pagination={{ pageIndex: 0, pageSize: 25 }} onPaginationChange={() => {}} emptyTitle="Belum ada undangan" emptyDescription="Buat undangan untuk menambah pengguna ke perusahaan." />}
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent className="max-h-[90dvh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>Buat undangan</DialogTitle><DialogDescription>Masukkan email dan pilih hak akses untuk pengguna.</DialogDescription></DialogHeader>
      <form onSubmit={(event) => void handleCreate(event)} className="space-y-4"><div><Label htmlFor="invite-email">Email</Label><Input id="invite-email" type="email" {...form.register('email')} /><FieldError message={form.formState.errors.email?.message} /></div>
        {catalog.isLoading && <p>Memuat katalog akses...</p>}{catalog.isError && <p role="alert">Gagal memuat katalog akses.</p>}{catalog.data && <PermissionMatrix catalog={catalog.data.data} value={selection} onChange={setSelection} />}
        <DialogFooter><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button><Button type="submit" disabled={create.isPending || !catalog.data}>{create.isPending ? 'Menyimpan...' : 'Buat undangan'}</Button></DialogFooter>
      </form></DialogContent></Dialog>
    <ConfirmDialog isOpen={!!revokeTarget} onClose={() => setRevokeTarget(null)} onConfirm={() => { if (revokeTarget) void revoke.mutateAsync(revokeTarget.id).then(() => toast.success('Undangan dicabut.')).catch((error) => toast.error(getApiErrorMessage(error, 'Gagal mencabut undangan.'))); setRevokeTarget(null) }} title="Cabut undangan" description={`Cabut undangan untuk ${revokeTarget?.email ?? ''}?`} confirmLabel="Cabut" variant="destructive" />
  </WorkspaceLayout>
}
