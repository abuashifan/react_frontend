import { useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import { gudangApi } from '@/modules/master-data/services/gudangApi'
import type { ReportParams } from '../types/reports.types'

export interface DimensionFilterConfig {
  department?: boolean
  project?: boolean
  warehouse?: boolean
}

interface Props {
  params: ReportParams
  onChange: (p: Partial<ReportParams>) => void
  onSubmit: () => void
  mode?: 'range' | 'as_of_date'
  isLoading?: boolean
  dimensions?: DimensionFilterConfig
}

export function ReportFilterParameter({ params, onChange, onSubmit, mode = 'range', isLoading, dimensions }: Props) {
  const searchDept = useCallback((q: string) => departemenApi.search(q), [])
  const searchProject = useCallback((q: string) => proyekApi.search(q), [])
  const searchWarehouse = useCallback((q: string) => gudangApi.search(q), [])

  const hasDimensions = dimensions && (dimensions.department || dimensions.project || dimensions.warehouse)

  return (
    <div className="rounded-lg border border-[#e2e8f0] bg-white p-4">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Parameter Laporan</p>
      <div className="flex flex-wrap items-end gap-3">
        {mode === 'range' ? (
          <>
            <div className="flex flex-col gap-1">
              <Label htmlFor="report-start-date" className="text-[11px] font-medium text-[#64748b]">Dari Tanggal</Label>
              <Input id="report-start-date" type="date" value={params.start_date ?? ''} onChange={(e) => onChange({ start_date: e.target.value })} className="h-8 w-40 text-[13px]" />
            </div>
            <div className="flex flex-col gap-1">
              <Label htmlFor="report-end-date" className="text-[11px] font-medium text-[#64748b]">Sampai Tanggal</Label>
              <Input id="report-end-date" type="date" value={params.end_date ?? ''} onChange={(e) => onChange({ end_date: e.target.value })} className="h-8 w-40 text-[13px]" />
            </div>
          </>
        ) : (
          <div className="flex flex-col gap-1">
            <Label htmlFor="report-as-of-date" className="text-[11px] font-medium text-[#64748b]">Per Tanggal</Label>
            <Input id="report-as-of-date" type="date" value={params.as_of_date ?? ''} onChange={(e) => onChange({ as_of_date: e.target.value })} className="h-8 w-40 text-[13px]" />
          </div>
        )}

        {hasDimensions && (
          <>
            {dimensions.department && (
              <div className="flex flex-col gap-1 w-44">
                <Label className="text-[11px] font-medium text-[#64748b]">Departemen</Label>
                <SearchableSelect
                  value={params.department_id ?? null}
                  onChange={(val) => onChange({ department_id: val ?? undefined })}
                  onSearch={searchDept}
                  placeholder="Semua departemen"
                  size="sm"
                />
              </div>
            )}
            {dimensions.project && (
              <div className="flex flex-col gap-1 w-44">
                <Label className="text-[11px] font-medium text-[#64748b]">Proyek</Label>
                <SearchableSelect
                  value={params.project_id ?? null}
                  onChange={(val) => onChange({ project_id: val ?? undefined })}
                  onSearch={searchProject}
                  placeholder="Semua proyek"
                  size="sm"
                />
              </div>
            )}
            {dimensions.warehouse && (
              <div className="flex flex-col gap-1 w-44">
                <Label className="text-[11px] font-medium text-[#64748b]">Gudang</Label>
                <SearchableSelect
                  value={params.warehouse_id ?? null}
                  onChange={(val) => onChange({ warehouse_id: val ?? undefined })}
                  onSearch={searchWarehouse}
                  placeholder="Semua gudang"
                  size="sm"
                />
              </div>
            )}
          </>
        )}

        <Button onClick={onSubmit} disabled={isLoading} className="h-8 bg-[#5c9ead] px-4 text-[13px] hover:bg-[#4a8a9b]">
          {isLoading ? 'Memuat...' : 'Tampilkan'}
        </Button>
      </div>
    </div>
  )
}
