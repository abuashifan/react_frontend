import { useQuery, type UseQueryResult } from '@tanstack/react-query'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import type { PaginatedResponse } from '@/types/api.types'
import type { ReportParams } from '../types/reports.types'

/** Master data dimensi jumlahnya kecil — satu halaman besar cukup untuk memetakan id → nama. */
const LOOKUP_PER_PAGE = 200
const LOOKUP_STALE_MS = 5 * 60 * 1000

interface NamedRecord {
  id: number
  name: string
}

function resolveLabel<T extends NamedRecord>(
  prefix: string,
  id: number | undefined,
  query: UseQueryResult<PaginatedResponse<T>>,
): string | null {
  if (!id) return null
  if (query.isLoading) return `${prefix}: memuat…`
  // Dimensi yang sudah dinonaktifkan/dihapus tidak ada di daftar aktif — tampilkan
  // id-nya apa adanya daripada menyembunyikan fakta bahwa filternya menyala.
  const name = query.data?.data.find((row) => row.id === id)?.name
  return `${prefix}: ${name ?? `#${id}`}`
}

/**
 * Ringkasan filter dimensi yang sedang aktif, mis. "Departemen: Marketing · Proyek: Renovasi".
 *
 * `ReportParams` hanya menyimpan id, jadi namanya diambil dari master data. Query
 * hanya jalan bila dimensinya memang difilter, dan hasilnya dipakai bersama antar
 * laporan lewat cache TanStack Query.
 *
 * Mengembalikan `undefined` bila tidak ada filter dimensi aktif.
 */
export function useReportFilterSummary(params: ReportParams | null | undefined): string | undefined {
  const departmentId = params?.department_id
  const projectId = params?.project_id
  const warehouseId = params?.warehouse_id

  const departments = useQuery({
    queryKey: ['master-data', 'departments', 'lookup'],
    queryFn: () => departemenApi.list({ is_active: true, per_page: LOOKUP_PER_PAGE }),
    enabled: !!departmentId,
    staleTime: LOOKUP_STALE_MS,
  })
  const projects = useQuery({
    queryKey: ['master-data', 'projects', 'lookup'],
    queryFn: () => proyekApi.list({ status: 'active', per_page: LOOKUP_PER_PAGE }),
    enabled: !!projectId,
    staleTime: LOOKUP_STALE_MS,
  })
  const warehouses = useQuery({
    queryKey: ['master-data', 'warehouses', 'lookup'],
    queryFn: () => gudangApi.list({ is_active: true, per_page: LOOKUP_PER_PAGE }),
    enabled: !!warehouseId,
    staleTime: LOOKUP_STALE_MS,
  })

  const parts = [
    resolveLabel('Departemen', departmentId, departments),
    resolveLabel('Proyek', projectId, projects),
    resolveLabel('Gudang', warehouseId, warehouses),
  ].filter((part): part is string => part !== null)

  return parts.length > 0 ? parts.join(' · ') : undefined
}
