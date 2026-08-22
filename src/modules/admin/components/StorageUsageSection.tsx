import { useClientStorage } from '../hooks/useClientUsers'
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
  const { data, isLoading } = useClientStorage(clientId)
  const companies = data?.data ?? []

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
          <div key={company.id} className="rounded-md border border-[#e2e8f0] p-3">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="text-[13px] font-medium text-[#24323a] truncate">{company.name}</span>
              {company.near_limit && (
                <span className="shrink-0 rounded-full bg-[#FEE2E2] text-[#991B1B] text-[10px] font-medium px-2 py-0.5">
                  Mendekati batas
                </span>
              )}
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
          </div>
        ))}
      </div>
    </section>
  )
}
