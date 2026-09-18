import { useState } from 'react'
import { Loader2, RefreshCw, TriangleAlert } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { useClientStorage, useClientUserMutations } from '../hooks/useClientUsers'
import { cn } from '@/lib/utils'
import type { ClientCompanyStorage } from '@/types/admin.types'

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 MB'
  const mb = bytes / 1024 / 1024
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(0)} MB`
}

function formatDate(value: string | null): string {
  if (!value) return 'Belum pernah diukur'
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function barColor(percent: number): string {
  if (percent >= 90) return 'bg-[#DC2626]'
  if (percent >= 75) return 'bg-[#D97706]'
  return 'bg-[#5c9ead]'
}

/**
 * Tab Penyimpanan (Fase 4, skema tier "Area admin") — satu baris per
 * perusahaan milik client, bukan satu angka gabungan. Angkanya seakurat
 * pengukuran harian terakhir (`php artisan storage:measure`); bisa basi
 * sampai satu hari, sama seperti yang dipakai gerbang unggahan impor.
 */
export function StorageUsageSection({ clientId }: { clientId: number }) {
  const { toast } = useToast()
  const { data, isLoading } = useClientStorage(clientId)
  const { repairTenant } = useClientUserMutations()
  const companies = data?.data ?? []
  const [repairTarget, setRepairTarget] = useState<ClientCompanyStorage | null>(null)

  const handleRepair = async () => {
    if (!repairTarget) return

    try {
      await repairTenant.mutateAsync({ clientId, companyId: repairTarget.id })
      toast.success(`Database tenant ${repairTarget.name} berhasil dibuat ulang.`)
      setRepairTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal membuat ulang tenant database.'))
    }
  }

  return (
    <section className="bg-white border border-[#d9e2e5] rounded-lg p-5 mt-3">
      <div className="mb-4">
        <h2 className="text-[14px] font-semibold text-[#24323a]">Pemakaian Penyimpanan</h2>
        <p className="text-[12px] text-[#64748b] mt-0.5">
          Diukur dari ukuran berkas database tenant + berkas impor tersimpan, per perusahaan.
          Kuota menahan penambahan data baru — data yang sudah ada tetap bisa dibaca.
        </p>
      </div>

      {isLoading && <p className="text-[12px] text-[#94a3b8]">Memuat...</p>}
      {!isLoading && companies.length === 0 && (
        <p className="text-[12px] text-[#94a3b8]">Client ini belum memiliki perusahaan.</p>
      )}

      <div className="flex flex-col gap-3">
        {companies.map((company: ClientCompanyStorage) => (
          <div
            key={company.id}
            className={cn(
              'rounded-md border p-3',
              company.tenant_file_exists ? 'border-[#e2e8f0]' : 'border-[#FCA5A5] bg-[#FEF2F2]',
            )}
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[13px] font-medium text-[#24323a] truncate">{company.name}</span>
              <div className="flex shrink-0 items-center gap-1.5">
                {company.near_limit && (
                  <span className="rounded-full bg-[#FEE2E2] text-[#991B1B] text-[10px] font-medium px-2 py-0.5">
                    Mendekati batas
                  </span>
                )}
                {!company.tenant_file_exists && (
                  <span className="flex items-center gap-1 rounded-full bg-[#FEE2E2] text-[#991B1B] text-[10px] font-medium px-2 py-0.5">
                    <TriangleAlert className="h-3 w-3" /> Database hilang
                  </span>
                )}
              </div>
            </div>

            <div className="h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', barColor(company.percent_used))}
                style={{ width: `${Math.min(100, company.percent_used)}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-1.5 text-[11px] text-[#64748b]">
              <span className="tabular-nums">
                {formatBytes(company.used_bytes)} / {formatBytes(company.quota_bytes)}
                {' '}
                <span className="tabular-nums">({company.percent_used.toFixed(1)}%)</span>
              </span>
              <span>Diukur: {formatDate(company.measured_at)}</span>
            </div>

            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setRepairTarget(company)}
                className={cn(
                  'flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium',
                  company.tenant_file_exists
                    ? 'text-[#64748b] hover:bg-[#f1f5f9]'
                    : 'bg-[#dc2626] text-white hover:bg-[#b91c1c]',
                )}
              >
                <RefreshCw className="h-3 w-3" /> Buat Ulang Database
              </button>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={repairTarget !== null}>
        <AlertDialogContent className="max-h-[calc(100dvh-48px)] max-w-[420px] overflow-y-auto rounded-xl p-6">
          <AlertDialogHeader>
            <div className="flex items-center gap-2.5">
              <TriangleAlert className="h-5 w-5 text-[#dc2626]" />
              <AlertDialogTitle className="text-[16px] font-semibold text-[#24323a]">
                Buat Ulang Tenant Database
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-1 text-left">
              <span className="block text-[14px] text-[#64748b]">
                Database tenant <span className="font-medium text-[#24323a]">{repairTarget?.name}</span>{' '}
                akan dibuat ulang kosong dari nol (skema penuh, siap dipakai lagi).
              </span>
              <span className="mt-1 block text-[13px] text-[#dc2626]">
                {repairTarget?.tenant_file_exists
                  ? 'Seluruh data yang sudah ada di dalamnya (transaksi, master data, dst.) akan HILANG dan tidak bisa dipulihkan.'
                  : 'Data lama sudah hilang (file tidak ditemukan) — ini cuma membuat wadah kosong baru supaya company-nya bisa dipakai lagi.'}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter className="mt-1 gap-2 sm:space-x-0">
            <AlertDialogCancel
              disabled={repairTenant.isPending}
              onClick={() => setRepairTarget(null)}
              className="h-8 border-[#d9e2e5] text-[13px] text-[#64748b] hover:bg-[#f8fbfc]"
            >
              Batal
            </AlertDialogCancel>
            <Button
              type="button"
              onClick={() => void handleRepair()}
              disabled={repairTenant.isPending}
              className="h-8 bg-[#dc2626] px-4 text-[13px] text-white hover:bg-[#b91c1c]"
            >
              {repairTenant.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {repairTenant.isPending ? 'Membuat ulang...' : 'Buat Ulang'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  )
}
