import { useCompanyWorkflow } from './useCompanySettings'
import type { TransactionEditMode } from '../types/settings.types'

/**
 * Mode ubah transaksi perusahaan aktif (Pengaturan → Transaksi).
 *
 * - `lock` (bawaan): hanya status di `lockChangeable` (bawaan: draft) yang
 *   boleh diedit/dihapus; yang sudah diposting harus di-void dulu.
 * - `open`: semua status kecuali void boleh diedit/dihapus. Backend tetap
 *   menolak kalau transaksinya masih tertaut transaksi lain -- layar tidak
 *   bisa tahu itu sendiri, jadi pesannya ditampilkan dari galat API.
 *
 * Selama pengaturan belum termuat, aturannya `lock` supaya tombol tidak
 * muncul lalu hilang.
 */
export function useTransactionEditMode() {
  const { data } = useCompanyWorkflow()
  const mode: TransactionEditMode = data?.data?.transaction_edit_mode === 'open' ? 'open' : 'lock'

  const canChange = (status?: string | null, lockChangeable: string[] = ['draft']): boolean => {
    if (!status || status === 'void') return false
    return mode === 'open' ? true : lockChangeable.includes(status)
  }

  return { mode, isOpen: mode === 'open', canChange }
}
