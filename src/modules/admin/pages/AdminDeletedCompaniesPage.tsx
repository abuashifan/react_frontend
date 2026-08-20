import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Loader2, RotateCcw, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataTable } from '@/components/shared/table/DataTable'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { APP_NAME } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { useDeletedCompanies, usePurgeCompany, useRestoreCompany } from '../hooks/useDeletedCompanies'
import type { ColumnDef } from '@/components/shared/table/DataTable'
import type { DeletedCompany } from '@/types/admin.types'

function formatDateTime(value: string | null): string {
  if (!value) return '—'

  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Sisa waktu pemulihan. Warnanya naik seiring mendesak supaya baris yang
 * hampir hangus terlihat tanpa harus membaca tanggalnya satu per satu.
 */
function RetentionBadge({ company }: { company: DeletedCompany }) {
  if (company.is_expired) {
    return (
      <span className="inline-flex items-center rounded-full bg-[#FEE2E2] px-2 py-0.5 text-[11px] font-medium text-[#991B1B]">
        Kedaluwarsa
      </span>
    )
  }

  const days = company.days_remaining ?? 0
  const urgent = days <= 7

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tabular-nums',
        urgent ? 'bg-[#FEF3C7] text-[#92400E]' : 'bg-[#D1FAE5] text-[#065F46]',
      )}
      title={`Dihapus permanen setelah ${formatDateTime(company.purge_after)}`}
    >
      {days} hari lagi
    </span>
  )
}

export default function AdminDeletedCompaniesPage() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const { data, isLoading, isFetching } = useDeletedCompanies()
  const restoreMutation = useRestoreCompany()
  const purgeMutation = usePurgeCompany()

  const [purgeTarget, setPurgeTarget] = useState<DeletedCompany | null>(null)
  const [confirmName, setConfirmName] = useState('')

  const companies = data?.data ?? []
  const retentionDays = data?.retentionDays ?? 30

  const handleRestore = (company: DeletedCompany) => {
    restoreMutation.mutate(company.id, {
      onSuccess: () => toast.success(`${company.name} berhasil dipulihkan.`),
      onError: (error) => toast.error(getApiErrorMessage(error, 'Gagal memulihkan perusahaan.')),
    })
  }

  const closePurgeDialog = () => {
    if (purgeMutation.isPending) return
    setConfirmName('')
    setPurgeTarget(null)
  }

  const handlePurge = () => {
    if (!purgeTarget || confirmName.trim() !== purgeTarget.name) return

    purgeMutation.mutate(
      { id: purgeTarget.id, confirmName: confirmName.trim() },
      {
        onSuccess: () => {
          toast.success(`${purgeTarget.name} dihapus permanen.`)
          setConfirmName('')
          setPurgeTarget(null)
        },
        onError: (error) => toast.error(getApiErrorMessage(error, 'Gagal menghapus permanen.')),
      },
    )
  }

  const columns: ColumnDef<DeletedCompany>[] = [
    {
      id: 'name',
      header: 'Perusahaan',
      size: 200,
      cell: ({ original }) => (
        <div>
          <p className="font-medium text-[#24323a]">{original.name}</p>
          <p className="text-[11px] text-[#64748b] tabular-nums">{original.code ?? '—'}</p>
        </div>
      ),
    },
    {
      id: 'owner',
      header: 'Owner',
      size: 200,
      cell: ({ original }) =>
        original.owners.length === 0 ? (
          <span className="text-[#94a3b8]">—</span>
        ) : (
          <div>
            {original.owners.map((owner) => (
              <div key={owner.id}>
                <p className="text-[#24323a]">{owner.email}</p>
                <p
                  className={cn(
                    'text-[11px] tabular-nums',
                    owner.quota_available ? 'text-[#64748b]' : 'text-[#991B1B]',
                  )}
                >
                  Kuota {owner.quota_used}/{owner.quota_limit}
                  {!owner.quota_available && ' — penuh'}
                </p>
              </div>
            ))}
          </div>
        ),
    },
    {
      id: 'deleted_at',
      header: 'Dihapus',
      size: 120,
      cell: ({ original }) => (
        <span className="tabular-nums">{formatDateTime(original.deleted_at)}</span>
      ),
    },
    {
      id: 'retention',
      header: 'Sisa Waktu',
      size: 120,
      cell: ({ original }) => <RetentionBadge company={original} />,
    },
    {
      id: 'actions',
      header: 'Aksi',
      size: 210,
      cell: ({ original }) => {
        const isRestoring = restoreMutation.isPending && restoreMutation.variables === original.id

        return (
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              disabled={!original.can_restore || isRestoring}
              onClick={() => handleRestore(original)}
              title={original.restore_blocker?.message}
              className="h-7 gap-1 bg-[#326273] px-2 text-[12px] text-white hover:bg-[#264d5b] disabled:opacity-50"
            >
              {isRestoring ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RotateCcw className="h-3 w-3" />
              )}
              Pulihkan
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPurgeTarget(original)}
              className="h-7 gap-1 border-[#FCA5A5] px-2 text-[12px] text-[#991B1B] hover:bg-[#FEF2F2]"
            >
              <Trash2 className="h-3 w-3" />
              Hapus Permanen
            </Button>
          </div>
        )
      },
    },
  ]

  const blockedCount = companies.filter((company) => !company.can_restore).length

  return (
    <div className="min-h-dvh bg-[#EFEFED] flex flex-col">
      <header className="bg-[#326273] px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-[6px] bg-[#5c9ead] flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-white font-semibold text-sm">Admin {APP_NAME}</span>
        </div>
        <Button
          variant="outline"
          onClick={() => navigate('/admin/clients')}
          className="gap-2 h-8 text-[12px] bg-transparent text-white border-white/30 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Kembali ke Client
        </Button>
      </header>

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-4">
            <h1 className="text-lg font-semibold text-[#24323a]">Perusahaan Terhapus</h1>
            <p className="text-[13px] text-[#64748b]">
              Perusahaan yang dihapus client masih dapat dipulihkan selama {retentionDays} hari.
              Lewat dari itu, database tenant-nya dihapus permanen dan tidak bisa dikembalikan.
            </p>
          </div>

          {blockedCount > 0 && (
            <div className="mb-4 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] p-3">
              <p className="text-[12px] text-[#92400E]">
                <span className="font-semibold">{blockedCount} perusahaan belum bisa dipulihkan.</span>{' '}
                Umumnya karena kuota ownernya sudah penuh — hapus permanen salah satu perusahaan
                terhapus miliknya, atau minta client menghapus perusahaan aktif untuk membebaskan
                slot.
              </p>
            </div>
          )}

          <DataTable
            data={companies}
            columns={columns}
            totalRows={companies.length}
            isLoading={isLoading}
            isFetching={isFetching}
            pagination={{ pageIndex: 0, pageSize: 100 }}
            onPaginationChange={() => {}}
            emptyTitle="Tidak ada perusahaan terhapus"
            emptyDescription="Perusahaan yang dihapus client akan muncul di sini sampai masa pemulihannya habis."
          />

          <p className="text-[11px] text-[#64748b] mt-2">
            Pemulihan mengembalikan keadaan persis seperti sebelum dihapus — status pengguna,
            produk nonaktif, dan transaksi void tidak berubah.
          </p>
        </div>
      </div>

      <AlertDialog open={purgeTarget !== null}>
        <AlertDialogContent className="max-h-[calc(100dvh-48px)] max-w-[420px] overflow-y-auto rounded-xl p-6">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5">
              <TriangleAlert className="h-5 w-5 text-[#dc2626]" />
              <AlertDialogTitle className="text-[16px] font-semibold text-[#24323a]">
                Hapus Permanen
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-1 text-left">
              <span className="block text-[14px] text-[#64748b]">
                <span className="font-medium text-[#24323a]">{purgeTarget?.name}</span> akan dihapus
                permanen beserta seluruh file database tenant-nya.
              </span>
              <span className="mt-1 block text-[13px] text-[#94a3b8]">
                Setelah ini data tidak bisa dipulihkan dengan cara apa pun.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div>
            <label
              htmlFor="purge-confirm-name"
              className="mb-1.5 block text-[11px] font-semibold uppercase text-[#64748b]"
            >
              Ketik <span className="text-[#24323a]">{purgeTarget?.name}</span> untuk konfirmasi
            </label>
            <Input
              id="purge-confirm-name"
              value={confirmName}
              onChange={(event) => setConfirmName(event.target.value)}
              placeholder={purgeTarget?.name}
              disabled={purgeMutation.isPending}
              autoFocus
              className="h-9 border-[#d9e2e5] text-[13px] focus-visible:ring-[#5c9ead]/30"
            />
          </div>

          <AlertDialogFooter className="mt-1 gap-2 sm:space-x-0">
            <AlertDialogCancel
              disabled={purgeMutation.isPending}
              onClick={closePurgeDialog}
              className="h-8 border-[#d9e2e5] text-[13px] text-[#64748b] hover:bg-[#f8fbfc]"
            >
              Batal
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={handlePurge}
              disabled={confirmName.trim() !== purgeTarget?.name || purgeMutation.isPending}
              className="h-8 bg-[#dc2626] px-4 text-[13px] text-white hover:bg-[#b91c1c]"
            >
              {purgeMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {purgeMutation.isPending ? 'Menghapus...' : 'Hapus Permanen'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
