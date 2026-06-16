import { Link } from 'react-router-dom'
import { CalendarDays, Calendar, ArrowRight } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'

export default function AccountingPeriodPage() {
  return (
    <WorkspaceLayout title="Periode Akuntansi" breadcrumb={[{ label: 'Pengaturan' }, { label: 'Periode Akuntansi' }]}>
      <div className="space-y-3">
        <p className="text-[13px] text-[#64748b]">Kelola tahun fiskal dan kunci periode akuntansi melalui modul Buku Besar.</p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Link to="/accounting/fiscal-years" className="group flex items-center gap-4 rounded-lg border border-[#e2e8f0] bg-white p-4 transition hover:border-[#5c9ead] hover:shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f9fc]">
              <CalendarDays className="h-5 w-5 text-[#5c9ead]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-[#1e2d35]">Tahun Fiskal</p>
              <p className="text-[11px] text-[#64748b]">Buka dan tutup tahun fiskal</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#94a3b8] transition group-hover:text-[#5c9ead]" />
          </Link>
          <Link to="/accounting/period-locks" className="group flex items-center gap-4 rounded-lg border border-[#e2e8f0] bg-white p-4 transition hover:border-[#5c9ead] hover:shadow-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0f9fc]">
              <Calendar className="h-5 w-5 text-[#5c9ead]" />
            </div>
            <div className="flex-1">
              <p className="text-[13px] font-semibold text-[#1e2d35]">Kunci Periode</p>
              <p className="text-[11px] text-[#64748b]">Kunci periode agar tidak bisa diubah</p>
            </div>
            <ArrowRight className="h-4 w-4 text-[#94a3b8] transition group-hover:text-[#5c9ead]" />
          </Link>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
