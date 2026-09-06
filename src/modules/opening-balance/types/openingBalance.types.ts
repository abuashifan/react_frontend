// Saldo awal — Fase 8.
//
// Tidak ada lagi batch, status dokumen, maupun baris yang bisa diedit di sini.
// Saldo awal adalah kumpulan jurnal biasa bersumber `opening_balance`, dan yang
// tersisa untuk ditampilkan cuma: tanggalnya, saldo akun perantara, daftar
// jurnalnya, dan rekonsiliasi register aset terhadap buku besar.

export interface OBAccountRef {
  id: number
  account_code: string
  account_name: string
}

export interface OBJournalSummary {
  id: number
  journal_number: string
  journal_date: string | null
  description: string | null
  status: string
  total_debit: number
  line_count: number
  /** `clearing_close` untuk jurnal penutup, `entry` untuk sisanya. */
  role: string
}

export interface OBReconciliationRow {
  account_id: number
  account_code: string | null
  account_name: string | null
  kind: 'cost' | 'accumulated'
  /** Total dari kartu aset yang terdaftar. */
  register_amount: number
  /** Saldo akun yang sama di buku besar. */
  gl_amount: number
  difference: number
}

export interface OBReconciliation {
  enabled: boolean
  asset_count?: number
  rows: OBReconciliationRow[]
  has_difference: boolean
}

// GET /opening-balance/status
export interface OBStatus {
  opening_date: string
  opening_date_locked: boolean
  /** false selama pemetaan akun perantara/ekuitas belum ada. */
  ready: boolean
  clearing_account: OBAccountRef | null
  equity_account: OBAccountRef | null
  /** Positif = saldo debit, negatif = saldo kredit. Nol = neraca pembuka selesai. */
  clearing_balance: number
  is_complete: boolean
  journal_count: number
  journals: OBJournalSummary[]
  fixed_asset_reconciliation: OBReconciliation
}

export interface OBCloseTarget {
  account_id: number
  amount: number
}

export interface OBClosePayload {
  description?: string | null
  targets?: OBCloseTarget[] | null
}
