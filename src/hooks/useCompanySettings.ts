import { useCompanyStore } from '@/stores/useCompanyStore'

export function useCompanySettings() {
  const { settings } = useCompanyStore()

  return {
    autoPost: settings?.auto_post ?? false,
    requireApproval: settings?.require_approval ?? false,
    currency: settings?.currency ?? 'IDR',
    timezone: settings?.timezone ?? 'Asia/Jakarta',
  }
}
