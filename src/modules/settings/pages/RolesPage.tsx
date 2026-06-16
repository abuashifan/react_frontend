import { useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/useToast'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { useSettingsRoles, useSettingsRole, useSettingsRoleMutations } from '../hooks/useSettings'

const PERMISSION_GROUPS: { label: string; permissions: { key: string; label: string }[] }[] = [
  {
    label: 'Master Data',
    permissions: [
      { key: 'master-data.view', label: 'Lihat' },
      { key: 'master-data.create', label: 'Buat' },
      { key: 'master-data.update', label: 'Ubah' },
      { key: 'master-data.delete', label: 'Hapus' },
    ],
  },
  {
    label: 'Penjualan',
    permissions: [
      { key: 'sales.quotations.view', label: 'Penawaran' },
      { key: 'sales.orders.view', label: 'Sales Order' },
      { key: 'sales.delivery-orders.view', label: 'Pengiriman' },
      { key: 'sales.invoices.view', label: 'Invoice' },
      { key: 'sales.receipts.view', label: 'Penerimaan' },
      { key: 'sales.returns.view', label: 'Retur' },
      { key: 'sales.ar.view', label: 'Piutang' },
    ],
  },
  {
    label: 'Pembelian',
    permissions: [
      { key: 'purchase.requests.view', label: 'Permintaan' },
      { key: 'purchase.orders.view', label: 'Purchase Order' },
      { key: 'purchase.goods-receipts.view', label: 'Penerimaan Barang' },
      { key: 'purchase.bills.view', label: 'Tagihan' },
      { key: 'purchase.payments.view', label: 'Pembayaran' },
      { key: 'purchase.returns.view', label: 'Retur' },
      { key: 'purchase.ap.view', label: 'Hutang' },
    ],
  },
  {
    label: 'Persediaan',
    permissions: [
      { key: 'inventory.stock.view', label: 'Saldo Stok' },
      { key: 'inventory.movements.view', label: 'Mutasi Stok' },
      { key: 'inventory.adjustments.view', label: 'Penyesuaian' },
      { key: 'inventory.opnames.view', label: 'Opname' },
    ],
  },
  {
    label: 'Kas & Bank',
    permissions: [
      { key: 'cash_bank.view', label: 'Lihat' },
      { key: 'cash_bank.create', label: 'Buat' },
      { key: 'cash_bank.void', label: 'Void' },
    ],
  },
  {
    label: 'Akuntansi',
    permissions: [
      { key: 'journal.view', label: 'Lihat Jurnal' },
      { key: 'journal.create', label: 'Buat Jurnal' },
      { key: 'journal.post', label: 'Posting Jurnal' },
      { key: 'accounting.period-locks.manage', label: 'Kunci Periode' },
      { key: 'accounting.fiscal-years.manage', label: 'Tahun Fiskal' },
    ],
  },
  {
    label: 'Laporan',
    permissions: [{ key: 'reports.view', label: 'Akses Semua Laporan' }],
  },
  {
    label: 'Pengaturan',
    permissions: [
      { key: 'settings.view', label: 'Lihat Pengaturan' },
      { key: 'settings.users.manage', label: 'Kelola Pengguna' },
      { key: 'settings.roles.manage', label: 'Kelola Peran' },
    ],
  },
]

export default function RolesPage() {
  const { data: rolesData, isLoading } = useSettingsRoles()
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const { data: roleData } = useSettingsRole(selectedRoleId ?? undefined)
  const { updatePermissions } = useSettingsRoleMutations()
  const { toast } = useToast()
  const [localPerms, setLocalPerms] = useState<Set<string> | null>(null)

  const roles = rolesData?.data ?? []
  const role = roleData?.data

  const getPerms = (): Set<string> => {
    if (localPerms) return localPerms
    return new Set(role?.permissions ?? [])
  }

  const handleSelectRole = (id: number) => {
    setSelectedRoleId(id)
    setLocalPerms(null)
  }

  const togglePerm = (key: string) => {
    const perms = new Set(getPerms())
    if (perms.has(key)) perms.delete(key)
    else perms.add(key)
    setLocalPerms(perms)
  }

  const handleSave = async () => {
    if (!selectedRoleId) return
    try {
      await updatePermissions.mutateAsync({ id: selectedRoleId, permissions: Array.from(getPerms()) })
      setLocalPerms(null)
      toast.success('Izin peran disimpan.')
    } catch {
      toast.error('Gagal menyimpan izin.')
    }
  }

  if (isLoading) return <WorkspaceLayout title="Peran" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Peran' }]}><div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div></WorkspaceLayout>

  return (
    <WorkspaceLayout title="Manajemen Peran" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Peran' }]}>
      <div className="flex min-h-[400px] gap-4">
        {/* Role list */}
        <div className="w-48 shrink-0 rounded-lg border border-[#e2e8f0] bg-white">
          <div className="border-b border-[#e2e8f0] px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Daftar Peran</p>
          </div>
          <div className="py-1">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectRole(r.id)}
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] transition hover:bg-[#f8fafc] ${selectedRoleId === r.id ? 'bg-[#f0f9fc] font-semibold text-[#5c9ead]' : 'text-[#1e2d35]'}`}
              >
                <span>{r.name}</span>
                <ChevronRight className="h-3 w-3 text-[#94a3b8]" />
              </button>
            ))}
          </div>
        </div>

        {/* Permission editor */}
        <div className="flex-1 rounded-lg border border-[#e2e8f0] bg-white">
          {!selectedRoleId ? (
            <div className="flex h-full items-center justify-center text-[13px] text-[#94a3b8]">Pilih peran untuk mengatur izin</div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-[#e2e8f0] px-4 py-3">
                <p className="text-[13px] font-semibold text-[#1e2d35]">{role?.name ?? 'Memuat...'}</p>
                <PermissionGuard permission="settings.roles.manage" fallback={null}>
                  <Button type="button" onClick={() => void handleSave()} disabled={updatePermissions.isPending || !localPerms} className="h-8 bg-[#5c9ead] px-4 text-[12px] hover:bg-[#4a8a9b]">
                    {updatePermissions.isPending ? 'Menyimpan...' : 'Simpan Izin'}
                  </Button>
                </PermissionGuard>
              </div>
              <div className="divide-y divide-[#f1f5f9] p-4 space-y-4">
                {PERMISSION_GROUPS.map((group) => (
                  <div key={group.label} className="pt-3 first:pt-0">
                    <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{group.label}</p>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-4">
                      {group.permissions.map((p) => (
                        <label key={p.key} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-[#f8fafc]">
                          <Checkbox checked={getPerms().has(p.key)} onCheckedChange={() => togglePerm(p.key)} />
                          <span className="text-[12px] text-[#1e2d35]">{p.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  )
}
