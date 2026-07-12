import { useNavigate } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Trash2, Users } from 'lucide-react'
import { useSavedReports, useDeleteSavedReport } from '../hooks/useSavedReports'
import { reportKeyLabel, buildSavedReportUrl } from '../constants/reportKeyRoutes'
import { ReportError } from '../components/ReportError'

export default function SavedReportsPage() {
  const navigate = useNavigate()
  const { data: reports, isLoading, isError, refetch } = useSavedReports()
  const del = useDeleteSavedReport()

  const handleDelete = (id: number) => {
    if (window.confirm('Hapus laporan tersimpan ini?')) del.mutate(id)
  }

  return (
    <WorkspaceLayout title="Laporan Tersimpan" breadcrumb={[{ label: 'Laporan', path: '/reports' }, { label: 'Laporan Tersimpan' }]}>
      <div className="space-y-4">
        {isLoading && <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat laporan tersimpan...</div>}
        {isError && <ReportError onRetry={() => refetch()} />}

        {!isLoading && !isError && (reports?.length ?? 0) === 0 && (
          <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-white py-12 text-center text-[13px] text-[#94a3b8]">
            Belum ada laporan tersimpan. Buka sebuah laporan, jalankan filternya, lalu klik "Simpan Laporan".
          </div>
        )}

        {!isLoading && !isError && (reports?.length ?? 0) > 0 && (
          <div className="overflow-hidden rounded-lg border border-[#e2e8f0]">
            <table className="w-full text-[13px]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Nama</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Laporan</th>
                  <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</th>
                  <th className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {reports?.map((r) => (
                  <tr key={r.id} className="hover:bg-[#f8fafc]">
                    <td className="px-4 py-2.5 font-medium text-[#1e293b]">{r.name}</td>
                    <td className="px-4 py-2.5 text-[#475569]">{reportKeyLabel(r.report_key)}</td>
                    <td className="px-4 py-2.5">
                      {r.is_owner ? (
                        r.shared_user_ids.length > 0 ? (
                          <Badge variant="secondary" className="gap-1 text-[11px]"><Users className="h-3 w-3" />Dibagikan ke {r.shared_user_ids.length}</Badge>
                        ) : (
                          <span className="text-[12px] text-[#94a3b8]">Pribadi</span>
                        )
                      ) : (
                        <Badge variant="outline" className="text-[11px]">Dibagikan ke saya</Badge>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="text-[12px]" onClick={() => navigate(buildSavedReportUrl(r.report_key, r.params))}>
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />Buka
                        </Button>
                        {r.is_owner && (
                          <Button variant="outline" size="sm" className="text-[12px] text-red-600 hover:text-red-700" disabled={del.isPending} onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
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
