import { useState } from 'react'
import { FormLayout } from '@/components/shared/layout/FormLayout'
import { FormSection } from '@/components/shared/form/FormSection'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { useToast } from '@/hooks/useToast'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/lib/utils'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { useFiscalYearStatus, useFiscalYearMutations } from '../hooks/useFiscalYear'

export default function FiscalYearPage() {
  const { toast } = useToast()
  const { can } = usePermission()
  const { data, isLoading } = useFiscalYearStatus()
  const { close, reopen } = useFiscalYearMutations()

  const [closingDate, setClosingDate] = useState('')
  const [retainedEarningsId, setRetainedEarningsId] = useState<number | null>(null)
  const [reopenReason, setReopenReason] = useState('')

  const fy = data?.data?.active_fiscal_year

  const handleClose = async () => {
    if (!fy) return
    try {
      await close.mutateAsync({ id: fy.id, payload: { closing_entry_date: closingDate || undefined, retained_earnings_account_id: retainedEarningsId ?? undefined } })
      toast.success('Tahun fiskal berhasil ditutup.')
    } catch { toast.error('Gagal menutup tahun fiskal.') }
  }

  const handleReopen = async () => {
    if (!fy || !reopenReason.trim()) { toast.error('Alasan reopen wajib diisi.'); return }
    try {
      await reopen.mutateAsync({ id: fy.id, payload: { reopen_reason: reopenReason } })
      toast.success('Tahun fiskal berhasil dibuka kembali.')
      setReopenReason('')
    } catch { toast.error('Gagal membuka kembali tahun fiskal.') }
  }

  if (isLoading) {
    return (
      <FormLayout title="Tahun Fiskal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Tahun Fiskal' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat data...</div>
      </FormLayout>
    )
  }

  return (
    <FormLayout title="Tahun Fiskal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Tahun Fiskal' }]}>
      <div className="space-y-3">
        <FormSection title="Tahun Fiskal Aktif">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tahun</span>
            <span className="text-[15px] font-semibold text-[#334155]">{fy?.year ?? '-'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Periode</span>
            <span className="text-[13px] text-[#334155]">{fy ? `${formatDate(fy.start_date)} – ${formatDate(fy.end_date)}` : '-'}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Status</span>
            <span className={`text-[13px] font-semibold ${fy?.status === 'open' ? 'text-green-600' : 'text-red-600'}`}>
              {fy?.status === 'open' ? 'Terbuka' : 'Ditutup'}
            </span>
          </div>
          {fy?.closed_at && (
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Ditutup Pada</span>
              <span className="text-[13px] text-[#334155]">{formatDate(fy.closed_at)}</span>
            </div>
          )}
        </FormSection>

        {fy?.status === 'open' && can('accounting.fiscal-years.manage') && (
          <FormSection title="Tutup Tahun Fiskal">
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Tanggal Jurnal Penutup</Label>
              <Input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} className="h-9 text-[13px]" />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Akun Laba Ditahan</Label>
              <SearchableSelect value={retainedEarningsId} onChange={(v) => setRetainedEarningsId(v)} onSearch={coaApi.search} placeholder="Pilih akun laba ditahan..." />
            </div>
            <div className="md:col-span-2">
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[12px] text-amber-800">
                ⚠ Menutup tahun fiskal akan mengunci semua periode di tahun ini dan membuat jurnal penutup secara otomatis. Pastikan semua transaksi sudah diposting.
              </div>
            </div>
            <div className="md:col-span-2">
              <Button onClick={() => void handleClose()} disabled={close.isPending} className="h-9 bg-red-600 px-4 text-[13px] hover:bg-red-700">
                Tutup Tahun Fiskal {fy?.year}
              </Button>
            </div>
          </FormSection>
        )}

        {fy?.status === 'closed' && can('accounting.fiscal-years.manage') && (
          <FormSection title="Buka Kembali Tahun Fiskal">
            <div className="flex flex-col gap-1 md:col-span-2">
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Alasan Reopen <span className="text-red-500">*</span></Label>
              <Input value={reopenReason} onChange={(e) => setReopenReason(e.target.value)} placeholder="Alasan membuka kembali tahun fiskal..." className="h-9 text-[13px]" />
            </div>
            <div className="md:col-span-2">
              <Button onClick={() => void handleReopen()} disabled={reopen.isPending} className="h-9 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9c]">
                Buka Kembali Tahun Fiskal
              </Button>
            </div>
          </FormSection>
        )}
      </div>
    </FormLayout>
  )
}
