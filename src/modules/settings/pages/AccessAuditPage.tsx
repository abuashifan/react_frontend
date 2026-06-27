import { useState } from 'react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { DataTable } from '@/components/shared/table/DataTable'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAccessAudit } from '../hooks/useAccessManagement'
import type { AuditEntry, AuditListParams } from '../types/access.types'

function formatDateTime(s: string): string {
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function AccessAuditPage() {
  const [filters, setFilters] = useState<AuditListParams>({})
  const { data, isLoading } = useAccessAudit(filters)
  const entries = data?.data ?? []

  const columns: ColumnDef<AuditEntry>[] = [
    { id: 'created_at', header: 'Waktu', size: 150, meta: { sticky: true, stickyLeft: 0 }, cell: ({ original }) => <span className="tabular-nums text-[12px] text-[#334155]">{formatDateTime(original.created_at)}</span> },
    { id: 'user', header: 'Pengguna', size: 160, cell: ({ original }) => <span className="text-[13px]">{original.user?.name ?? '—'}</span> },
    { id: 'action', header: 'Aksi', size: 180, cell: ({ original }) => <span className="font-medium text-[13px] text-[#326273]">{original.action}</span> },
    { id: 'description', header: 'Detail', size: 280, cell: ({ original }) => <span className="text-[12px] text-[#64748b]">{original.description ?? '—'}</span> },
    { id: 'ip_address', header: 'IP', size: 130, cell: ({ original }) => <span className="tabular-nums text-[12px] text-[#94a3b8]">{original.ip_address ?? '—'}</span> },
  ]

  return (
    <WorkspaceLayout title="Audit Akses" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Audit Akses' }]}>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-1">
          <Label htmlFor="settings-access-audit-action" className="text-[11px] text-[#64748b]">Aksi</Label>
          <Input id="settings-access-audit-action" placeholder="Cari aksi..." value={filters.action ?? ''} onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value || undefined }))} className="h-8 w-48 text-[12px]" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="settings-access-audit-date-from" className="text-[11px] text-[#64748b]">Dari</Label>
          <Input id="settings-access-audit-date-from" type="date" value={filters.date_from ?? ''} onChange={(e) => setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))} className="h-8 w-40 text-[12px]" />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="settings-access-audit-date-to" className="text-[11px] text-[#64748b]">Sampai</Label>
          <Input id="settings-access-audit-date-to" type="date" value={filters.date_to ?? ''} onChange={(e) => setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))} className="h-8 w-40 text-[12px]" />
        </div>
      </div>
      <DataTable
        columns={columns}
        data={entries}
        totalRows={entries.length}
        isLoading={isLoading}
        pagination={{ pageIndex: 0, pageSize: 50 }}
        onPaginationChange={() => {}}
        emptyTitle="Belum ada catatan audit"
        emptyDescription="Aktivitas akses (peran, izin, undangan) akan tercatat di sini."
      />
    </WorkspaceLayout>
  )
}
