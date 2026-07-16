/**
 * ARSIP — Ribbon menu modul Laporan (NONAKTIF sejak 16 Juli 2026).
 *
 * Dulu `MODULE_CONFIGS.reports.ribbonItems` berisi 12 entri di bawah ini. Ribbon
 * untuk modul Laporan dinonaktifkan karena hanya berfungsi sebagai pemilih
 * kategori — satu klik ekstra yang tidak memberi informasi apa pun sebelum user
 * sampai ke daftar laporan. Penggantinya: klik "Laporan" di Topbar langsung
 * membuka tab "Daftar Laporan" (`ReportListPage`), yang memuat kategori-kategori
 * ini sebagai sidebar.
 *
 * File ini SENGAJA tidak diimport siapa pun — disimpan agar model lama mudah
 * dihidupkan kembali. Modul lain (Penjualan, Pembelian, dst) TIDAK terpengaruh
 * dan tetap memakai ribbon seperti biasa.
 *
 * Cara menghidupkan kembali:
 *   1. Di `src/router/moduleConfig.ts`, hapus `opensListDirectly: true` dari entri
 *      `reports` dan kembalikan `ribbonItems: LEGACY_REPORTS_RIBBON_ITEMS`.
 *   2. Kembalikan route `/reports` ke `ReportIndexPage.legacy.tsx` bila ingin
 *      perilaku redirect lama (lihat `src/modules/reports/pages/legacy/`).
 */
import {
  BarChart3,
  BookMarked,
  Bookmark,
  Building2,
  Clock,
  Landmark,
  Package,
  Receipt,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { RibbonItem } from '@/router/moduleConfig'

export const LEGACY_REPORTS_RIBBON_ITEMS: RibbonItem[] = [
  { id: 'financial', label: 'Keuangan', icon: BarChart3, path: '/reports/financial', permission: 'reports.view' },
  { id: 'gl', label: 'Buku Besar', icon: BookMarked, path: '/reports/gl', permission: 'reports.view' },
  { id: 'sales', label: 'Penjualan', icon: TrendingUp, path: '/reports/sales', permission: 'reports.view' },
  { id: 'purchase', label: 'Pembelian', icon: TrendingDown, path: '/reports/purchase', permission: 'reports.view' },
  { id: 'ar', label: 'Piutang', icon: Clock, path: '/reports/ar', permission: 'reports.view' },
  { id: 'ap', label: 'Hutang', icon: Clock, path: '/reports/ap', permission: 'reports.view' },
  { id: 'reconciliation', label: 'Rekonsiliasi', icon: RefreshCcw, path: '/reports/reconciliation', permission: 'reports.view' },
  { id: 'inventory', label: 'Persediaan', icon: Package, path: '/reports/inventory', permission: 'reports.view' },
  { id: 'fixed-assets', label: 'Aktiva Tetap', icon: Building2, path: '/reports/fixed-assets', permission: 'reports.view' },
  { id: 'cash-bank', label: 'Kas & Bank', icon: Landmark, path: '/reports/cash-bank', permission: 'reports.view' },
  { id: 'tax', label: 'Pajak', icon: Receipt, path: '/reports/tax', permission: 'reports.view' },
  { id: 'saved', label: 'Tersimpan', icon: Bookmark, path: '/reports/saved', permission: 'reports.view' },
]
