import { useQuery } from '@tanstack/react-query'
import { documentHistoryApi } from '../services/documentHistoryApi'

/** Riwayat edit satu dokumen; hanya diambil saat dialog riwayat dibuka (`enabled`). */
export function useDocumentHistory(documentType: string, id: number, enabled: boolean) {
  return useQuery({
    queryKey: ['accounting', 'document-history', documentType, id],
    queryFn: async () => (await documentHistoryApi.show(documentType, id)).data,
    enabled,
  })
}
