import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut, Plus, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTable } from '@/components/shared/table/DataTable'
import { useToast } from '@/hooks/useToast'
import { useAdminAuthStore } from '@/stores/useAdminAuthStore'
import { APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { adminApi } from '../services/adminApi'
import { useAdminPlans, useClientUsers, useDueSoonClients } from '../hooks/useClientUsers'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { ClientUser } from '@/types/admin.types'

const STATUS_LABELS: Record<string, string> = {
  active: 'Aktif',
  inactive: 'Nonaktif',
  suspended: 'Ditangguhkan',
}

const SUBSCRIPTION_STATE_LABELS: Record<ClientUser['subscription']['state'], string> = {
  none: 'Belum berlangganan',
  active: 'Aktif',
  grace: 'Tenggang',
  expired: 'Kedaluwarsa',
  cancelled: 'Dibatalkan',
}

const SUBSCRIPTION_STATE_CLASS: Record<ClientUser['subscription']['state'], string> = {
  none: 'bg-[#F1F5F9] text-[#64748b]',
  active: 'bg-[#D1FAE5] text-[#065F46]',
  grace: 'bg-[#FEF3C7] text-[#92400E]',
  expired: 'bg-[#FEE2E2] text-[#991B1B]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
}

function formatDate(value: string | null): string {
  if (!value) return '—'

  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const selectClass =
  'h-8 text-[13px] rounded-md border border-[#d9e2e5] bg-white px-2 text-[#24323a] focus:outline-none focus:ring-2 focus:ring-[#5c9ead]/40'

export default function AdminClientsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const admin = useAdminAuthStore((s) => s.admin)
  const logoutStore = useAdminAuthStore((s) => s.logout)

  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading, isFetching } = useClientUsers({
    page,
    per_page: 25,
    search: search || undefined,
    status: status || undefined,
  })
  const { data: plansResponse } = useAdminPlans()
  const { data: dueSoonResponse } = useDueSoonClients()
  const dueSoon = dueSoonResponse?.data ?? []

  // Kembali ke halaman 1 saat filter berubah supaya tidak mendarat di halaman
  // kosong setelah hasilnya menyusut.
  const filterKey = `${search}|${status}`
  const [prevFilters, setPrevFilters] = useState('')
  if (filterKey !== prevFilters) {
    setPrevFilters(filterKey)
    setPage(1)
  }

  const openCreate = () => navigate('/admin/clients/new')
  const openEdit = (client: ClientUser) => navigate(`/admin/clients/${client.id}`)

  const handleLogout = async () => {
    try {
      await adminApi.logout()
    } catch {
      // Sesi lokal tetap dibersihkan walau permintaan logout gagal.
    }
    logoutStore()
    toast.success('Anda telah keluar.')
    navigate('/admin/login', { replace: true })
  }

  const columns: ColumnDef<ClientUser>[] = [
    {
      id: 'name',
      header: 'Nama',
      size: 180,
      cell: ({ original }) => <span className="font-medium text-[#24323a]">{original.name}</span>,
    },
    {
      id: 'email',
      header: 'Email',
      size: 200,
      cell: ({ original }) => original.email,
    },
    {
      id: 'phone',
      header: 'Telepon',
      size: 130,
      cell: ({ original }) => (
        <span className="tabular-nums">{original.phone ?? '—'}</span>
      ),
    },
    {
      id: 'company_name',
      header: 'Perusahaan',
      size: 170,
      cell: ({ original }) => (
        <div>
          <p>{original.company_name ?? '—'}</p>
          {original.job_title && (
            <p className="text-[11px] text-[#64748b]">{original.job_title}</p>
          )}
        </div>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      size: 110,
      cell: ({ original }) => (
        <span
          className={cn(
            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
            original.status === 'active'
              ? 'bg-[#D1FAE5] text-[#065F46]'
              : 'bg-[#F1F5F9] text-[#64748b]',
          )}
        >
          {STATUS_LABELS[original.status] ?? original.status}
        </span>
      ),
    },
    {
      id: 'plan',
      header: 'Paket',
      size: 120,
      cell: ({ original }) => original.plan?.name ?? 'Tanpa paket',
    },
    {
      id: 'users_limit',
      header: 'Maks User',
      size: 100,
      cell: ({ original }) => (
        <span
          className="tabular-nums"
          title={
            original.extra_users > 0
              ? `Batas user di tiap perusahaan: ${original.users_limit - original.extra_users} dari paket + ${original.extra_users} add-on.`
              : 'Batas user di tiap perusahaan milik client ini.'
          }
        >
          {original.users_limit}
          {original.extra_users > 0 ? '⁺' : ''}
        </span>
      ),
    },
    {
      id: 'quota',
      header: 'Kuota',
      size: 110,
      cell: ({ original }) => (
        <span
          className={cn('tabular-nums', original.over_quota && 'text-[#b45309] font-medium')}
          title={
            original.over_quota
              ? 'Melebihi jatah. Perusahaan lama tetap bisa diakses, penambahan baru ditahan.'
              : original.limit_source === 'custom'
                ? 'Kuota khusus, menimpa paket.'
                : undefined
          }
        >
          {original.companies_used}/{original.companies_limit}
          {original.limit_source === 'custom' ? '*' : ''}
          {original.over_quota ? ' ⚠' : ''}
        </span>
      ),
    },
    {
      id: 'subscription',
      header: 'Langganan',
      size: 150,
      cell: ({ original }) => {
        const sub = original.subscription
        return (
          <div>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                SUBSCRIPTION_STATE_CLASS[sub.state],
              )}
            >
              {SUBSCRIPTION_STATE_LABELS[sub.state]}
            </span>
            {sub.ends_at && (
              <p className="text-[11px] text-[#64748b] mt-0.5 tabular-nums">
                {sub.days_remaining !== null && sub.days_remaining >= 0
                  ? `${sub.days_remaining} hari lagi`
                  : `berakhir ${formatDate(sub.ends_at)}`}
              </p>
            )}
          </div>
        )
      },
    },
    {
      id: 'last_login_at',
      header: 'Terakhir Login',
      size: 140,
      cell: ({ original }) => (
        <span className="tabular-nums">{formatDate(original.last_login_at)}</span>
      ),
    },
  ]

  return (
    <div className="min-h-dvh bg-[#EFEFED] flex flex-col">
      <header className="bg-[#326273] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-[6px] bg-[#5c9ead] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">Admin {APP_NAME}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-white/80 text-[12px]">{admin?.email}</span>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="gap-2 h-8 text-[12px] bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </div>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between gap-4 mb-4">
            <div>
              <h1 className="text-lg font-semibold text-[#24323a]">Client</h1>
              <p className="text-[13px] text-[#64748b]">
                Akun client dan kuota perusahaannya. Data keuangan perusahaan client tidak dapat
                diakses dari sini.
              </p>
            </div>
            <Button
              className="bg-[#e39774] hover:bg-[#d4845e] h-8 px-3 text-[13px]"
              onClick={openCreate}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Client
            </Button>
          </div>

          {dueSoon.length > 0 && (
            <div className="mb-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3">
              <p className="text-[12px] font-semibold text-[#92400E] mb-2">
                {dueSoon.length} client perlu dihubungi (jatuh tempo ≤14 hari atau masa tenggang)
              </p>
              <div className="flex flex-wrap gap-2">
                {dueSoon.map((row) => (
                  <button
                    key={row.id}
                    type="button"
                    onClick={() => navigate(`/admin/clients/${row.id}`)}
                    className="flex items-center gap-1.5 rounded-md border border-[#FDE68A] bg-white px-2 py-1 text-[11px] text-[#92400E] hover:bg-[#FEF3C7]"
                  >
                    <span className="font-medium">{row.name}</span>
                    <span className="tabular-nums text-[#b45309]">
                      {row.state === 'grace'
                        ? `tenggang ${row.days_remaining !== null ? Math.abs(row.days_remaining) : ''} hari`
                        : `${row.days_remaining} hari lagi`}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 mb-3">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, email, telepon, perusahaan..."
              className="h-8 text-[13px] max-w-xs"
            />
            <select
              className={selectClass}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <option value="">Semua status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
              <option value="suspended">Ditangguhkan</option>
            </select>
            <span className="text-[12px] text-[#64748b] ml-auto">
              {plansResponse?.data.length ?? 0} paket tersedia
            </span>
          </div>

          <DataTable
            data={data?.data ?? []}
            columns={columns}
            totalRows={data?.meta.total ?? 0}
            isLoading={isLoading}
            isFetching={isFetching}
            pagination={{ pageIndex: page - 1, pageSize: 25 }}
            onPaginationChange={(state) => setPage(state.pageIndex + 1)}
            onRowClick={openEdit}
            emptyTitle="Belum ada client"
            emptyDescription="Tambahkan akun client supaya mereka bisa login dan menyiapkan perusahaannya."
          />

          <p className="text-[11px] text-[#64748b] mt-2">
            Kuota bertanda <span className="font-medium">*</span> adalah kuota khusus yang menimpa
            paket; maks user bertanda <span className="font-medium">⁺</span> sudah termasuk add-on.
            Klik baris untuk mengubah data client.
          </p>
        </div>
      </div>
    </div>
  )
}
