import { useQuery } from '@tanstack/react-query'
import { setupApi } from '../services/onboardingApi'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/stores/useAuthStore'
import type { SetupGate } from '../types/setup.types'

export const SETUP_STATUS_KEY = ['setup', 'status']

/**
 * Status setup awal perusahaan dari backend. Dipakai untuk mengarahkan ke
 * wizard dan untuk menyembunyikan menu yang hanya relevan sekali di awal.
 *
 * Query hanya jalan saat ada perusahaan aktif dan user punya `setup.view`;
 * endpoint-nya dijaga permission itu, jadi memanggilnya tanpa izin hanya
 * menghasilkan 403 berulang.
 */
export function useSetupStatus() {
  const activeCompanyId = useAuthStore((s) => s.activeCompanyId)
  const { can, permissionsLoaded } = usePermission()
  const allowed = !!activeCompanyId && permissionsLoaded && can('setup.view')

  return useQuery({
    queryKey: [...SETUP_STATUS_KEY, activeCompanyId],
    queryFn: setupApi.getStatus,
    enabled: allowed,
    staleTime: 5 * 60 * 1000,
    retry: false,
  })
}

/**
 * Gate versi siap-pakai. Selama status belum diketahui — sedang dimuat, user
 * tidak punya `setup.view`, atau permintaan gagal — nilai baliknya menganggap
 * setup sudah selesai. Sikap ini disengaja: kegagalan membaca status tidak
 * boleh menjebak user ke wizard atau menghilangkan menu yang ia butuhkan.
 */
export function useSetupGate(): SetupGate {
  const { data } = useSetupStatus()

  return data?.data.gate ?? {
    is_finalized: true,
    has_operational_data: true,
    initial_setup_available: false,
  }
}
