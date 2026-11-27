import {
  Database, BookMarked, Wallet, Banknote,
  ShoppingCart, ShoppingBag, Boxes, Building, FileBarChart2, Settings,
} from 'lucide-react'
import type { FC, SVGProps } from 'react'

type LucideIcon = FC<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>

// Ikon modul topbar TIDAK diambil dari `ModuleConfig` — petanya di sini,
// dikunci id modul. Menambah modul di moduleConfig.ts tanpa menambah entri di
// sini membuat tombolnya muncul tanpa ikon, tanpa error apa pun: pemakaiannya
// `{Icon && <Icon />}`.
export const MODULE_ICONS: Record<string, LucideIcon> = {
  'master-data': Database,
  accounting:   BookMarked,
  budget:       Wallet,
  'cash-bank':  Banknote,
  sales:        ShoppingCart,
  purchase:     ShoppingBag,
  inventory:    Boxes,
  'fixed-assets': Building,
  reports:      FileBarChart2,
  settings:     Settings,
}

