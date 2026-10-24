import type { TransactionEditMode } from '../types/settings.types'

/** Pilihan mode ubah transaksi -- dipakai Pengaturan → Transaksi dan setup wizard. */
export const EDIT_MODE_OPTIONS: { value: TransactionEditMode; label: string; hint: string }[] = [
  {
    value: 'lock',
    label: 'Lock — hanya draft',
    hint: 'Hanya transaksi draft yang bisa diedit/dihapus, termasuk jurnal manual. Yang sudah diposting harus di-void dulu. Sales Order & Delivery Order tetap mengikuti aturannya sendiri.',
  },
  {
    value: 'open',
    label: 'Open — semua status',
    hint: 'Transaksi yang sudah diposting juga bisa diedit/dihapus, selama tidak tertaut transaksi lain. Saat disimpan, jurnal lama di-void (tetap tersimpan sebagai jejak) lalu diposting ulang.',
  },
]
