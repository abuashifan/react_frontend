import {
  BarChart3,
  BookMarked,
  Building2,
  Clock,
  Landmark,
  Package,
  Receipt,
  RefreshCcw,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import type { FC, SVGProps } from 'react'

type LucideIcon = FC<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>

/**
 * Ikon sidebar per domain laporan, dikunci ke `ReportDomain.categoryPath`.
 *
 * Dipisah dari `reportCategories.ts` yang murni data — file itu tidak boleh
 * bergantung pada komponen React. Ikon di sini meneruskan ikon yang dulu dipakai
 * ribbon Laporan (lihat src/router/legacy/reportsRibbon.legacy.ts) supaya user
 * lama tetap mengenali kategorinya.
 */
export const DOMAIN_ICONS: Record<string, LucideIcon> = {
  financial: BarChart3,
  gl: BookMarked,
  sales: TrendingUp,
  purchase: TrendingDown,
  ar: Clock,
  ap: Clock,
  reconciliation: RefreshCcw,
  inventory: Package,
  'fixed-assets': Building2,
  'cash-bank': Landmark,
  tax: Receipt,
}
