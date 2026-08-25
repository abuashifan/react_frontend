import { Flame, ShoppingCart, Briefcase, Factory, FileText } from 'lucide-react'
import type { FC, SVGProps } from 'react'
type LucideIcon = FC<SVGProps<SVGSVGElement> & { size?: number | string; strokeWidth?: number | string }>

/**
 * Kunci sessionStorage untuk posisi langkah wizard. Dipakai OnboardingPage
 * (menyimpan/memulihkan) dan Step6Complete (membersihkan setelah finalize).
 */
export const WIZARD_STATE_KEY = 'seaside-onboarding-wizard'

// ─── COA Templates ────────────────────────────────────────────────────────────

export interface CoaTemplate {
  id: string
  label: string
  description: string
  Icon: LucideIcon
}

/**
 * Metadata presentasi (ikon) per template -- data akun asli (termasuk jumlah
 * akun) datang dari `setupApi.listCoaTemplates()`. Dipetakan by `id` supaya
 * ikon tidak perlu dikirim backend.
 */
export const COA_TEMPLATES: CoaTemplate[] = [
  { id: 'gas_agent', label: 'Agen Gas', description: 'COA standar untuk bisnis distribusi gas LPG', Icon: Flame },
  { id: 'trading', label: 'Perdagangan Umum', description: 'COA standar untuk bisnis dagang barang', Icon: ShoppingCart },
  { id: 'service', label: 'Jasa', description: 'COA standar untuk bisnis jasa dan konsultan', Icon: Briefcase },
  { id: 'manufacture', label: 'Manufaktur', description: 'COA standar untuk bisnis produksi', Icon: Factory },
  { id: 'blank', label: 'Kosong', description: 'Mulai dari nol, buat COA sendiri', Icon: FileText },
]
