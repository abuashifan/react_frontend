import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { getApiErrorMessage, getUpgradeUrl } from '@/lib/apiError'

/**
 * Layar penolakan fitur (skema tier, Fase 2) — satu tempat untuk seluruh
 * aplikasi, dipanggil dari interceptor axios (`http.ts`), bukan dari setiap
 * halaman satu per satu. Setiap aksi normalnya sudah tersembunyi lewat
 * `PermissionGuard` (daftar izin dari `/auth/permissions` sudah disaring
 * paket), jadi FEATURE_NOT_IN_PLAN semestinya jarang benar-benar sampai ke
 * sini — kalau sampai, ini jaring pengamannya.
 */
export function notifyFeatureNotInPlan(error: unknown): void {
  const url = getUpgradeUrl(error)
  const message = getApiErrorMessage(error, 'Fitur ini tidak termasuk dalam paket langganan Anda.')

  toast({
    description: message,
    variant: 'destructive',
    duration: 8000,
    action: url ? (
      <ToastAction altText="Minta Upgrade via WhatsApp" onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}>
        Minta Upgrade
      </ToastAction>
    ) : undefined,
  })
}
