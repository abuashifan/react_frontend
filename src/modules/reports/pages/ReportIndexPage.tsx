import { useNavigate } from 'react-router-dom'
import { WorkspaceLayout } from '@/components/shared/layout/WorkspaceLayout'
import { PermissionGuard } from '@/components/shared/PermissionGuard'

interface ReportCard { title: string; description: string; path: string }

const FINANCIAL_REPORTS: ReportCard[] = [
  { title: 'Neraca Saldo', description: 'Saldo debit & kredit semua akun per periode', path: '/reports/trial-balance' },
  { title: 'Laba Rugi', description: 'Pendapatan, beban, dan laba bersih per periode', path: '/reports/profit-loss' },
  { title: 'Neraca', description: 'Aset, kewajiban, dan ekuitas per tanggal', path: '/reports/balance-sheet' },
  { title: 'Arus Kas', description: 'Arus masuk dan keluar kas per periode', path: '/reports/cash-flow' },
  { title: 'Ringkasan Keuangan', description: 'Indikator keuangan utama sekilas', path: '/reports/financial-summary' },
]

const LEDGER_REPORTS: ReportCard[] = [
  { title: 'Buku Besar', description: 'Riwayat transaksi per akun dengan saldo berjalan', path: '/reports/general-ledger' },
  { title: 'Piutang Usaha (AR Aging)', description: 'Analisis umur piutang per pelanggan', path: '/reports/ar-aging' },
  { title: 'Hutang Usaha (AP Aging)', description: 'Analisis umur hutang per supplier', path: '/reports/ap-aging' },
  { title: 'Rekonsiliasi', description: 'Perbandingan saldo buku besar vs subledger', path: '/reports/reconciliation' },
]

const INVENTORY_REPORTS: ReportCard[] = [
  { title: 'Laporan Stok', description: 'Saldo, mutasi, dan kartu stok per produk', path: '/reports/stock' },
  { title: 'Analisis Inventori', description: 'Valuasi, stok rendah, dan stok negatif', path: '/reports/inventory-analysis' },
]

// Catatan: "Daftar Transaksi" (/reports/transactions) disembunyikan karena
// route backend belum ada (Audit-12 A12-15). Tambahkan kembali setelah
// endpoint backend tersedia.

function ReportCardItem({ card, onClick }: { card: ReportCard; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col gap-1 rounded-lg border border-[#e2e8f0] bg-white p-4 text-left transition-all hover:border-[#5c9ead] hover:shadow-sm">
      <p className="text-[13px] font-semibold text-[#1e293b]">{card.title}</p>
      <p className="text-[12px] text-[#64748b]">{card.description}</p>
    </button>
  )
}

function Section({ title, cards, navigate }: { title: string; cards: ReportCard[]; navigate: (path: string) => void }) {
  return (
    <div>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{title}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => <ReportCardItem key={c.path} card={c} onClick={() => navigate(c.path)} />)}
      </div>
    </div>
  )
}

export default function ReportIndexPage() {
  const navigate = useNavigate()
  return (
    <PermissionGuard permission="reports.view">
      <WorkspaceLayout title="Laporan" breadcrumb={[{ label: 'Laporan' }]}>
        <div className="space-y-6">
          <Section title="Laporan Keuangan" cards={FINANCIAL_REPORTS} navigate={navigate} />
          <Section title="Buku Besar & Subledger" cards={LEDGER_REPORTS} navigate={navigate} />
          <Section title="Persediaan" cards={INVENTORY_REPORTS} navigate={navigate} />
        </div>
      </WorkspaceLayout>
    </PermissionGuard>
  )
}
