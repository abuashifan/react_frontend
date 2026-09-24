import { useState } from 'react'
import { Upload, AlertTriangle, CheckCircle2, Ban } from 'lucide-react'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PermissionGuard } from '@/components/shared/PermissionGuard'
import { VoidConfirmDialog } from '@/components/shared/document/VoidConfirmDialog'
import { useToast } from '@/hooks/useToast'
import { formatCurrency, cn } from '@/lib/utils'
import { useOpenPrimaryTab } from '@/hooks/useOpenPrimaryTab'
import { useImportPresetStore } from '@/modules/imports/stores/useImportPresetStore'
import { getApiErrorMessage } from '@/lib/apiError'
import { useOBStatus, useOBMutations } from '../hooks/useOpeningBalance'
import type { OBJournalSummary, OBStatus } from '../types/openingBalance.types'

/**
 * Papan pemantau Saldo Awal — Fase 8.
 *
 * Menggantikan editor baris + Validasi + Posting + Kunci + Buka Kembali. Saldo
 * awal bukan lagi dokumen yang harus diselesaikan sekali duduk: ia kumpulan
 * jurnal yang boleh dicicil, dan halaman ini cuma menjawab tiga pertanyaan —
 * sudah masuk apa saja, berapa yang belum diakui sebagai ekuitas, dan apakah
 * kartu aset sudah sama dengan buku besarnya.
 */
export default function OpeningBalanceStatusPage() {
  const { toast } = useToast()
  const { data, isLoading } = useOBStatus()
  const { setOpeningDate, closeClearing, voidJournal } = useOBMutations()
  const openTab = useOpenPrimaryTab()

  const [dateDraft, setDateDraft] = useState('')
  const [voidTarget, setVoidTarget] = useState<OBJournalSummary | null>(null)

  const status = data?.data

  /**
   * Halaman impor hidup di modul Master Data, jadi tab primernya didaftarkan
   * dulu — AppShell mengarahkan router ke tab aktif saat mount, sehingga
   * navigate() telanjang akan dipantulkan balik.
   */
  const openImport = (profile: string) => {
    useImportPresetStore.getState().requestProfile(profile)
    openTab({
      id: 'master-data-import',
      menuKey: 'import',
      label: 'Impor Data',
      module: 'master-data',
      path: '/master-data/import',
    })
  }

  const handleSaveDate = async () => {
    if (!dateDraft) return
    try {
      await setOpeningDate.mutateAsync(dateDraft)
      toast.success('Tanggal saldo awal disimpan.')
      setDateDraft('')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menyimpan tanggal saldo awal.'))
    }
  }

  const handleClose = async () => {
    try {
      await closeClearing.mutateAsync({})
      toast.success('Saldo perantara ditutup ke ekuitas.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal menutup saldo perantara.'))
    }
  }

  const handleVoid = async (reason: string) => {
    if (!voidTarget) return
    try {
      await voidJournal.mutateAsync({ journalId: voidTarget.id, reason })
      toast.success(`Jurnal ${voidTarget.journal_number} dibatalkan.`)
      setVoidTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal membatalkan jurnal.'))
    }
  }

  if (isLoading || !status) {
    return (
      <WorkspaceLayout title="Saldo Awal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal' }]}>
        <div className="flex h-32 items-center justify-center text-[13px] text-[#64748b]">Memuat...</div>
      </WorkspaceLayout>
    )
  }

  return (
    <WorkspaceLayout title="Saldo Awal" breadcrumb={[{ label: 'Akuntansi' }, { label: 'Saldo Awal' }]}>
      <div className="max-w-4xl space-y-4">
        {!status.ready && (
          <Notice tone="warning">
            Pemetaan akun saldo awal belum lengkap. Terapkan Daftar Akun lebih dulu di wizard Setup,
            lalu petakan akun perantara dan ekuitas di Pengaturan → Pemetaan Akun.
          </Notice>
        )}

        <ClearingCard status={status} onClose={() => void handleClose()} closing={closeClearing.isPending} />

        <section className="rounded-lg border border-[#e2e8f0] bg-white p-5">
          <h2 className="text-[14px] font-semibold text-[#24323a]">Tanggal Saldo Awal</h2>
          <p className="mt-1 text-[12px] text-[#64748b]">
            Posisi keuangan diukur pada tanggal ini, dan akumulasi penyusutan aset warisan dihitung
            per tanggal ini juga. Isi dengan batas periode — biasanya awal tahun fiskal.
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="w-52">
              <Label htmlFor="ob-date" className="text-[12px] text-[#334155]">Tanggal</Label>
              <Input
                id="ob-date"
                type="date"
                value={dateDraft || status.opening_date}
                disabled={status.opening_date_locked}
                onChange={(event) => setDateDraft(event.target.value)}
                className="mt-1 h-9 text-[13px] tabular-nums"
              />
            </div>
            {status.opening_date_locked ? (
              <p className="pb-2 text-[11px] text-[#64748b]">
                Terkunci — sudah ada jurnal pembuka bertanggal ini. Batalkan jurnalnya dulu kalau tanggalnya salah.
              </p>
            ) : (
              <PermissionGuard permission="opening_balance.manage" fallback={null}>
                <Button
                  type="button"
                  onClick={() => void handleSaveDate()}
                  disabled={!dateDraft || setOpeningDate.isPending}
                  className="h-9 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]"
                >
                  {setOpeningDate.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </PermissionGuard>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-[#e2e8f0] bg-white p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-[14px] font-semibold text-[#24323a]">Jurnal Pembuka</h2>
              <p className="mt-1 text-[12px] text-[#64748b]">
                Berkas boleh dicicil — kas hari ini, piutang besok. Tiap berkas jadi satu jurnal yang
                bisa dibatalkan sendiri.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="h-9 gap-1.5 text-[13px]" onClick={() => openImport('opening_balance')}>
                <Upload className="h-3.5 w-3.5" /> Impor Saldo Akun
              </Button>
              <Button type="button" variant="outline" className="h-9 gap-1.5 text-[13px]" onClick={() => openImport('fixed_asset_opening')}>
                <Upload className="h-3.5 w-3.5" /> Impor Aset Tetap
              </Button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto rounded-md border border-[#e2e8f0]">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-[#f8fafc] text-left text-[#64748b]">
                  <th className="px-3 py-2 font-medium">Nomor</th>
                  <th className="px-3 py-2 font-medium">Tanggal</th>
                  <th className="px-3 py-2 font-medium">Keterangan</th>
                  <th className="px-3 py-2 text-right font-medium">Nilai</th>
                  <th className="px-3 py-2 text-right font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {status.journals.map((journal) => (
                  <tr key={journal.id} className="border-t border-[#f1f5f9]">
                    <td className="px-3 py-2 font-medium text-[#334155]">
                      {journal.journal_number}
                      {journal.role === 'clearing_close' && (
                        <Badge className="ml-2 bg-[#E0E7FF] px-1.5 py-0 text-[10px] text-[#3730A3] hover:bg-[#E0E7FF]">
                          penutup
                        </Badge>
                      )}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-[#64748b]">{journal.journal_date}</td>
                    <td className="px-3 py-2 text-[#64748b]">{journal.description}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-[#334155]">{formatCurrency(journal.total_debit)}</td>
                    <td className="px-3 py-2 text-right">
                      <PermissionGuard permission="opening_balance.reopen" fallback={null}>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 gap-1 text-[11px]"
                          onClick={() => setVoidTarget(journal)}
                        >
                          <Ban className="h-3 w-3" /> Batalkan
                        </Button>
                      </PermissionGuard>
                    </td>
                  </tr>
                ))}
                {status.journals.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-6 text-center text-[#94a3b8]">
                      Belum ada jurnal pembuka. Mulai dengan mengimpor berkas neraca saldo lama.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <ReconciliationCard status={status} onImportAssets={() => openImport('fixed_asset_opening')} />
      </div>

      <VoidConfirmDialog
        isOpen={voidTarget !== null}
        onClose={() => setVoidTarget(null)}
        onConfirm={(reason) => void handleVoid(reason)}
        documentNumber={voidTarget?.journal_number ?? ''}
        isLoading={voidJournal.isPending}
        title="Batalkan Jurnal Pembuka"
        description={`Jurnal ${voidTarget?.journal_number ?? ''} akan dibatalkan dan saldo perantara kembali seperti sebelum berkas ini masuk.`}
        warning="Jurnal lain tidak ikut terpengaruh."
      />
    </WorkspaceLayout>
  )
}

function ClearingCard({ status, onClose, closing }: { status: OBStatus; onClose: () => void; closing: boolean }) {
  const balance = status.clearing_balance
  const settled = Math.abs(balance) < 0.01

  return (
    <section className="rounded-lg border border-[#e2e8f0] bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-semibold text-[#24323a]">
            {status.clearing_account
              ? `${status.clearing_account.account_code} ${status.clearing_account.account_name}`
              : 'Saldo Awal (Perantara)'}
          </h2>
          <p className="mt-1 max-w-lg text-[12px] text-[#64748b]">
            Setiap jurnal pembuka berlawanan dengan akun ini, jadi saldonya adalah{' '}
            <strong>ekuitas pembuka yang belum diakui</strong> — aset dikurangi liabilitas. Tutup ke
            {' '}{status.equity_account ? `${status.equity_account.account_code} ${status.equity_account.account_name}` : 'akun ekuitas'} kalau angkanya sudah benar.
          </p>
        </div>
        <div className="text-right">
          <p className={cn('text-[26px] font-semibold tabular-nums', settled ? 'text-green-700' : 'text-[#24323a]')}>
            {formatCurrency(Math.abs(balance))}
          </p>
          <p className="text-[11px] text-[#64748b]">
            {settled ? 'Sudah nol — neraca pembuka selesai' : balance > 0 ? 'saldo debit' : 'saldo kredit'}
          </p>
        </div>
      </div>

      {!settled && status.journal_count > 0 && (
        <PermissionGuard permission="opening_balance.post" fallback={null}>
          <Button
            type="button"
            onClick={onClose}
            disabled={closing}
            className="mt-4 h-9 bg-[#e39774] px-5 text-[13px] hover:bg-[#d4845e]"
          >
            {closing ? 'Menutup...' : 'Tutup ke Ekuitas'}
          </Button>
        </PermissionGuard>
      )}

      {settled && status.journal_count > 0 && (
        <p className="mt-3 flex items-center gap-1.5 text-[12px] text-green-700">
          <CheckCircle2 className="h-3.5 w-3.5" /> Seluruh saldo awal sudah diakui sebagai ekuitas.
        </p>
      )}
    </section>
  )
}

function ReconciliationCard({ status, onImportAssets }: { status: OBStatus; onImportAssets: () => void }) {
  const reconciliation = status.fixed_asset_reconciliation

  if (!reconciliation.enabled || reconciliation.rows.length === 0) return null

  return (
    <section className="rounded-lg border border-[#e2e8f0] bg-white p-5">
      <h2 className="text-[14px] font-semibold text-[#24323a]">Kartu Aset vs Buku Besar</h2>
      <p className="mt-1 max-w-2xl text-[12px] text-[#64748b]">
        Selisih di sini <strong>bukan galat</strong>. Pendaftaran aset boleh sebagian — tanah bisa
        berdiri di beberapa lokasi sementara yang terdaftar baru satu. Lanjutkan pendaftarannya kapan
        saja, atau betulkan saldo akunnya kalau memang keliru.
      </p>

      <div className="mt-3 overflow-x-auto rounded-md border border-[#e2e8f0]">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-[#f8fafc] text-left text-[#64748b]">
              <th className="px-3 py-2 font-medium">Akun</th>
              <th className="px-3 py-2 text-right font-medium">Buku Besar</th>
              <th className="px-3 py-2 text-right font-medium">Kartu Aset</th>
              <th className="px-3 py-2 text-right font-medium">Selisih</th>
            </tr>
          </thead>
          <tbody>
            {reconciliation.rows.map((row) => (
              <tr key={`${row.account_id}-${row.kind}`} className="border-t border-[#f1f5f9]">
                <td className="px-3 py-2 text-[#334155]">
                  {row.account_code} {row.account_name}
                  <span className="ml-1.5 text-[10px] text-[#94a3b8]">
                    {row.kind === 'cost' ? 'harga perolehan' : 'akumulasi'}
                  </span>
                </td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.gl_amount)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(row.register_amount)}</td>
                <td className={cn('px-3 py-2 text-right tabular-nums font-medium', Math.abs(row.difference) < 0.01 ? 'text-green-700' : 'text-[#92400E]')}>
                  {formatCurrency(row.difference)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reconciliation.has_difference && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md border border-[#FDE68A] bg-[#FFFBEB] p-3">
          <p className="text-[12px] text-[#92400E]">
            <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
            Ada akun aset tetap yang saldonya belum sama dengan kartu aset terdaftar.
          </p>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-[11px]" onClick={onImportAssets}>
            <Upload className="h-3.5 w-3.5" /> Daftarkan Aset Lagi
          </Button>
        </div>
      )}
    </section>
  )
}

function Notice({ tone, children }: { tone: 'warning'; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'rounded-md border p-3 text-[12px]',
        tone === 'warning' && 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]',
      )}
    >
      <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />
      {children}
    </div>
  )
}
