import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { useToast } from '@/hooks/useToast'
import { ConfirmDialog } from '@/components/shared/document/ConfirmDialog'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { formatDate, cn } from '@/lib/utils'
import { useInvitations, useInvitationMutations, useAccessRoles } from '../hooks/useAccessManagement'
import type { Invitation, InvitationStatus } from '../types/access.types'

const STATUS_BADGE: Record<InvitationStatus, { label: string; className: string }> = {
  pending: { label: 'Menunggu', className: 'bg-[#FEF3C7] text-[#92400E] hover:bg-[#FEF3C7]' },
  accepted: { label: 'Diterima', className: 'bg-[#D1FAE5] text-[#065F46] hover:bg-[#D1FAE5]' },
  expired: { label: 'Kedaluwarsa', className: 'bg-[#F1F5F9] text-[#64748b] hover:bg-[#F1F5F9]' },
  revoked: { label: 'Dibatalkan', className: 'bg-[#FEE2E2] text-[#991B1B] hover:bg-[#FEE2E2]' },
}

const inviteSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  role_id: z.number().nullable().optional(),
})
type InviteForm = z.infer<typeof inviteSchema>

export default function InvitationsPage() {
  const { toast } = useToast()
  const { data, isLoading } = useInvitations()
  const { data: rolesData } = useAccessRoles()
  const { create, resend, revoke } = useInvitationMutations()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [revokeTarget, setRevokeTarget] = useState<Invitation | null>(null)

  const invitations = data?.data ?? []
  const roles = rolesData?.data ?? []

  const form = useForm<InviteForm>({ resolver: zodResolver(inviteSchema), defaultValues: { email: '', role_id: null } })

  const handleCreate = form.handleSubmit(async (values) => {
    const role = roles.find((r) => r.id === values.role_id)
    try {
      await create.mutateAsync({ email: values.email, role_id: values.role_id ?? undefined, role: role?.slug ?? undefined })
      toast.success('Undangan terkirim.')
      setDialogOpen(false)
      form.reset()
    } catch { toast.error('Gagal mengirim undangan.') }
  })

  const handleResend = async (inv: Invitation) => {
    try { await resend.mutateAsync(inv.id); toast.success('Undangan dikirim ulang.') }
    catch { toast.error('Gagal mengirim ulang undangan.') }
  }

  const handleRevoke = async (inv: Invitation) => {
    try { await revoke.mutateAsync(inv.id); toast.success('Undangan dibatalkan.') }
    catch { toast.error('Gagal membatalkan undangan.') }
  }

  const columns: ColumnDef<Invitation>[] = [
    { id: 'email', header: 'Email', size: 220, cell: ({ original }) => <span className="font-medium text-[#24323a] text-[13px]">{original.email}</span> },
    { id: 'role', header: 'Peran', size: 140, cell: ({ original }) => <span className="text-[13px]">{original.role ?? '—'}</span> },
    {
      id: 'status', header: 'Status', size: 120,
      cell: ({ original }) => {
        const badge = STATUS_BADGE[original.status] ?? STATUS_BADGE.pending
        return <Badge className={cn('text-[11px] px-2 py-0.5 rounded-full', badge.className)}>{badge.label}</Badge>
      },
    },
    { id: 'sent_at', header: 'Dikirim', size: 120, cell: ({ original }) => <span className="tabular-nums text-[13px]">{formatDate(original.created_at)}</span> },
    { id: 'expires_at', header: 'Kedaluwarsa', size: 120, cell: ({ original }) => <span className="tabular-nums text-[13px]">{formatDate(original.expires_at)}</span> },
    {
      id: 'actions', header: '', size: 180,
      cell: ({ original }) => {
        if (original.status !== 'pending') return null
        return (
          <div className="flex items-center gap-1">
            <PermissionGuard permission="access.invitations.resend" fallback={null}>
              <Button type="button" size="sm" variant="ghost" onClick={() => void handleResend(original)} className="h-7 text-[11px] text-[#326273]">Kirim Ulang</Button>
            </PermissionGuard>
            <PermissionGuard permission="access.invitations.revoke" fallback={null}>
              <Button type="button" size="sm" variant="ghost" onClick={() => setRevokeTarget(original)} className="h-7 text-[11px] text-red-500 hover:text-red-600">Batalkan</Button>
            </PermissionGuard>
          </div>
        )
      },
    },
  ]

  return (
    <WorkspaceLayout
      title="Undangan Pengguna"
      breadcrumb={[{ label: 'Pengaturan' }, { label: 'Undangan' }]}
      action={
        <PermissionGuard permission="access.invitations.create" fallback={null}>
          <Button type="button" onClick={() => setDialogOpen(true)} className="h-8 gap-1.5 bg-[#e39774] text-[12px] text-white hover:bg-[#d4845e]">
            <Plus className="h-4 w-4" /> Kirim Undangan
          </Button>
        </PermissionGuard>
      }
    >
      <DataTable
        columns={columns}
        data={invitations}
        totalRows={invitations.length}
        isLoading={isLoading}
        pagination={{ pageIndex: 0, pageSize: 25 }}
        onPaginationChange={() => {}}
        emptyTitle="Belum ada undangan"
        emptyDescription="Kirim undangan untuk menambah pengguna ke perusahaan."
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[15px]">Kirim Undangan</DialogTitle>
            <DialogDescription className="text-[13px] text-[#64748b]">Masukkan email dan peran tujuan sebelum mengirim undangan.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleCreate(e)} className="space-y-3 pt-1">
            <div className="flex flex-col gap-1">
              <Label htmlFor="settings-invitations-email" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Email <span className="text-red-500">*</span></Label>
              <Input id="settings-invitations-email" {...form.register('email')} type="email" className="h-9 text-[13px]" placeholder="nama@perusahaan.com" />
              {form.formState.errors.email && <p className="text-[11px] text-red-500">{form.formState.errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="settings-invitations-role-id" className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Peran</Label>
              <select
                id="settings-invitations-role-id"
                value={form.watch('role_id') ?? ''}
                onChange={(e) => form.setValue('role_id', e.target.value ? Number(e.target.value) : null)}
                className="h-9 rounded-md border border-input bg-background px-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">— Pilih peran —</option>
                {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="h-9 text-[13px]">Batal</Button>
              <Button type="submit" disabled={create.isPending} className="h-9 bg-[#5c9ead] text-[13px] hover:bg-[#4a8a9b]">{create.isPending ? 'Mengirim...' : 'Kirim'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        isOpen={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        onConfirm={() => {
          if (!revokeTarget) return
          const invitation = revokeTarget
          setRevokeTarget(null)
          void handleRevoke(invitation)
        }}
        title="Batalkan Undangan"
        description={revokeTarget ? `Batalkan undangan untuk ${revokeTarget.email}? Pengguna tidak akan bisa menerima undangan ini lagi.` : ''}
        confirmLabel="Batalkan Undangan"
        variant="destructive"
        isLoading={revoke.isPending}
      />
    </WorkspaceLayout>
  )
}
