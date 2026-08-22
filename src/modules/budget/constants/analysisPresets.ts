import type { BudgetAnalysisParams, BudgetGroupBy } from '../types/budget.types'

/**
 * Preset entri menu Monitoring & katalog laporan.
 *
 * Keempat entri Monitoring bukan halaman terpisah — mereka `BudgetAnalysisPage`
 * dengan filter awal berbeda. Nilai di sini hanya **mengisi state awal** saat
 * halaman mount; setelah itu pengguna bebas mengubah filter dan URL tidak ikut
 * berubah. Sinkronisasi dua arah tidak dibutuhkan dan hanya akan membuat tombol
 * Back browser berperilaku aneh.
 */
export interface AnalysisPreset {
  label: string
  groupBy: BudgetGroupBy[]
  mode: NonNullable<BudgetAnalysisParams['mode']>
  direction?: 'revenue' | 'expense'
  /** Urutkan serapan tertinggi lebih dulu — hanya untuk preset utilization. */
  sortByUtilization?: boolean
}

export const ANALYSIS_PRESETS: Record<string, AnalysisPreset> = {
  'vs-actual': { label: 'Budget vs Actual', groupBy: ['account'], mode: 'summary' },
  variance: { label: 'Analisis Variance', groupBy: ['account'], mode: 'variance' },
  utilization: { label: 'Serapan Anggaran', groupBy: ['account'], mode: 'summary', sortByUtilization: true },
  // group_by kosong = satu baris total; drill-down yang menurunkannya per dimensi.
  summary: { label: 'Ringkasan Anggaran', groupBy: [], mode: 'summary' },
  'by-account': { label: 'Anggaran per Akun', groupBy: ['account'], mode: 'summary' },
  'by-cost-center': { label: 'Anggaran per Cost Center', groupBy: ['department'], mode: 'summary' },
  'by-project': { label: 'Anggaran per Proyek', groupBy: ['project'], mode: 'summary' },
  'by-period': { label: 'Anggaran per Bulan', groupBy: ['period'], mode: 'summary' },
  revenue: { label: 'Anggaran Pendapatan', groupBy: ['account'], mode: 'summary', direction: 'revenue' },
  expense: { label: 'Anggaran Beban', groupBy: ['account'], mode: 'summary', direction: 'expense' },
}

/**
 * Preset tak dikenal dikembalikan `null`, bukan dilempar error — URL bisa datang
 * dari bookmark lama atau tautan yang salah ketik, dan halaman tetap harus bisa
 * dibuka dengan filter default.
 */
export function resolvePreset(key: string | null): AnalysisPreset | null {
  if (!key) return null
  return ANALYSIS_PRESETS[key] ?? null
}
