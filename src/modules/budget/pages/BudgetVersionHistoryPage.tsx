import { useParams } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { cn, formatCurrency, formatDate } from '@/lib/utils'
import { useBudgetVersions } from '../hooks/useBudgetVersions'
import { BudgetStatusBadge } from '../components/BudgetStatusBadge'

/**
 * Riwayat versi anggaran. Revisi tidak pernah menimpa versi lama, jadi seluruh
 * rantai v1 → v2 → v3 tetap terbaca beserta alasan perubahannya.
 */
export default function BudgetVersionHistoryPage() {
  const { id } = useParams()
  const submissionId = id ? Number(id) : undefined

  const { data, isLoading, isError } = useBudgetVersions(submissionId)
  const versions = data?.data ?? []

  return (
    <WorkspaceLayout
      title="Riwayat Versi Anggaran"
      breadcrumb={[
        { label: 'Anggaran', path: '/budget' },
        { label: 'Pengajuan', path: `/budget/submissions/${id}` },
        { label: 'Riwayat Versi' },
      ]}
    >
      <div className="space-y-3">
        {isLoading && <p className="text-[13px] text-[#64748b]">Memuat riwayat versi...</p>}

        {isError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-[12px] text-red-700">
            Gagal memuat riwayat versi.
          </div>
        )}

        {!isLoading && versions.length === 0 && (
          <p className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-4 py-6 text-center text-[13px] text-[#64748b]">
            Belum ada versi tercatat.
          </p>
        )}

        {versions.length > 0 && (
          <div className="overflow-auto rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead className="bg-[#1e293b]">
                <tr>
                  <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Versi</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Status</th>
                  <th className="px-3 py-2 text-right text-[11px] font-bold uppercase tracking-wide text-white">Total Anggaran</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Alasan Revisi</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Dibuat</th>
                  <th className="px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-white">Disetujui</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {versions.map((version) => (
                  <tr
                    key={version.id}
                    className={cn('hover:bg-[#f8fafc]', version.is_active && 'bg-green-50/60')}
                  >
                    <td className="px-3 py-1.5">
                      <span className="font-medium text-[#334155]">Versi {version.version_no}</span>
                      {version.is_active && (
                        <span className="ml-2 rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                          Versi Aktif
                        </span>
                      )}
                      {/* Dua penghitung berbeda: "Revisi ke-N" = berapa kali
                          ditolak sebelum disetujui, "Versi N" = versi anggaran. */}
                      {version.revision_number > 1 && (
                        <span className="ml-2 text-[10px] text-[#94a3b8]">
                          Revisi ke-{version.revision_number}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-1.5">
                      <BudgetStatusBadge status={version.status} />
                    </td>
                    <td className="px-3 py-1.5 text-right font-medium tabular-nums">
                      {formatCurrency(parseFloat(version.total_amount))}
                    </td>
                    <td className="px-3 py-1.5 text-[#64748b]">{version.revision_reason ?? '—'}</td>
                    <td className="px-3 py-1.5 text-[#64748b]">
                      {version.created_at ? formatDate(version.created_at) : '—'}
                    </td>
                    <td className="px-3 py-1.5 text-[#64748b]">
                      {version.approved_at ? formatDate(version.approved_at) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
