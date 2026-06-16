import { formatCurrency, formatDate } from '@/lib/utils'
import type { FixedAssetReportData, FixedAssetReportRow } from '../../types/fixedAsset.types'

interface FixedAssetReportTableProps {
  data?: FixedAssetReportData
  isLoading?: boolean
}

function rowsFrom(data?: FixedAssetReportData): FixedAssetReportRow[] {
  if (!data) return []
  if (Array.isArray(data)) return data
  const nestedRows = Object.values(data).find((value) => Array.isArray(value))
  if (Array.isArray(nestedRows)) return nestedRows as FixedAssetReportRow[]
  return [data]
}

function headerLabel(key: string) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function renderValue(key: string, value: unknown) {
  if (value === null || value === undefined || value === '') return '-'
  if (key.includes('date') && typeof value === 'string') return formatDate(value)
  if (
    key.includes('amount') ||
    key.includes('cost') ||
    key.includes('depreciation') ||
    key.includes('value') ||
    key.includes('gain_loss')
  ) {
    return formatCurrency(typeof value === 'number' || typeof value === 'string' ? value : null)
  }
  if (typeof value === 'number') return value.toLocaleString('id-ID')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function FixedAssetReportTable({ data, isLoading }: FixedAssetReportTableProps) {
  const rows = rowsFrom(data)
  const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row)))).slice(0, 12)

  if (isLoading) {
    return (
      <div className="rounded-lg border border-[#d9e2e5] bg-white p-6 text-center text-[13px] text-[#64748b]">
        Memuat laporan...
      </div>
    )
  }

  if (rows.length === 0 || columns.length === 0) {
    return (
      <div className="rounded-lg border border-[#d9e2e5] bg-white p-6 text-center text-[13px] text-[#64748b]">
        Tidak ada data laporan.
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden rounded-lg border border-[#d9e2e5] bg-white">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full min-w-max border-collapse text-[13px]">
          <thead>
            <tr className="border-b border-[#d9e2e5] bg-[#eeeeee]">
              {columns.map((column) => (
                <th key={column} className="sticky top-0 bg-[#eeeeee] px-3 py-2 text-left text-[11px] font-bold uppercase text-[#64748b]">
                  {headerLabel(column)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={row.id ?? rowIndex} className="border-b border-[#f1f5f9] hover:bg-[#f8fbfc]">
                {columns.map((column) => (
                  <td key={column} className="px-3 py-2 text-[#24323a]">
                    <span className={column.match(/amount|cost|value|depreciation|gain_loss/) ? 'tabular-nums' : undefined}>
                      {renderValue(column, row[column])}
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
