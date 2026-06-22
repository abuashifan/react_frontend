import { Input } from '@/components/ui/input'
import { LineItemsTable, type LineItemColumn } from '@/components/shared/form/LineItemsTable'
import { SearchableSelect } from '@/components/shared/form/SearchableSelect'
import { coaApi } from '@/modules/master-data/services/coaApi'
import { departemenApi } from '@/modules/master-data/services/departemenApi'
import { proyekApi } from '@/modules/master-data/services/proyekApi'
import type { CashBankLine } from '../types/cashBank.types'
import type { CashAllocationLineValues } from '../schemas/cashBankSchemas'
import type { FieldErrors } from 'react-hook-form'

interface CashAllocationTableProps {
  items: CashAllocationLineValues[]
  sourceLines?: CashBankLine[]
  isReadOnly: boolean
  error?: string
  lineErrors?: Partial<Record<number, FieldErrors<CashAllocationLineValues>>>
  onAdd: () => void
  onRemove: (index: number) => void
  onUpdate: <K extends keyof CashAllocationLineValues>(index: number, field: K, value: CashAllocationLineValues[K]) => void
}

export function CashAllocationTable({
  items,
  sourceLines = [],
  isReadOnly,
  error,
  lineErrors = [],
  onAdd,
  onRemove,
  onUpdate,
}: CashAllocationTableProps) {
  const columns: LineItemColumn<CashAllocationLineValues>[] = [
    {
      id: 'account',
      header: 'Akun Lawan',
      width: 200,
      render: ({ item, index, isReadOnly: rowReadOnly }) => {
        const source = sourceLines[index]
        return (
          <SearchableSelect
            value={item.account_id || null}
            onChange={(value) => onUpdate(index, 'account_id', value ?? 0)}
            onSearch={(query) => coaApi.search(query, { isActive: true })}
            placeholder="Pilih akun..."
            ariaLabel={`Akun lawan baris ${index + 1}`}
            disabled={rowReadOnly}
            size="sm"
            error={lineErrors[index]?.account_id?.message ?? (item.account_id <= 0 ? 'Akun lawan wajib dipilih' : undefined)}
            selectedOptions={source?.account ? [{
              value: source.account.id,
              label: source.account.name,
              sublabel: source.account.code,
            }] : []}
          />
        )
      },
    },
    {
      id: 'amount',
      header: 'Jumlah',
      width: 130,
      align: 'right',
      render: ({ item, index, isReadOnly: rowReadOnly }) => (
        <div>
          <Input
            aria-label={`Jumlah alokasi baris ${index + 1}`}
            type="number"
            value={item.amount || ''}
            onChange={(event) => onUpdate(index, 'amount', Number(event.target.value))}
            disabled={rowReadOnly}
            className="h-8 text-right text-[12px] tabular-nums"
            min={0.01}
            step="0.01"
          />
          {(lineErrors[index]?.amount?.message ?? (item.amount <= 0 ? 'Jumlah line harus lebih dari 0' : undefined)) && (
            <p className="mt-1 text-[11px] text-red-500">
              {lineErrors[index]?.amount?.message ?? 'Jumlah line harus lebih dari 0'}
            </p>
          )}
        </div>
      ),
    },
    {
      id: 'department',
      header: 'Departemen',
      width: 160,
      render: ({ item, index, isReadOnly: rowReadOnly }) => {
        const source = sourceLines[index]
        return (
          <SearchableSelect
            value={item.department_id ?? null}
            onChange={(value) => onUpdate(index, 'department_id', value)}
            onSearch={departemenApi.search}
            placeholder="Opsional"
            ariaLabel={`Departemen baris ${index + 1}`}
            disabled={rowReadOnly}
            size="sm"
            selectedOptions={source?.department ? [{
              value: source.department.id,
              label: source.department.name,
              sublabel: source.department.code,
            }] : []}
          />
        )
      },
    },
    {
      id: 'project',
      header: 'Proyek',
      width: 160,
      render: ({ item, index, isReadOnly: rowReadOnly }) => {
        const source = sourceLines[index]
        return (
          <SearchableSelect
            value={item.project_id ?? null}
            onChange={(value) => onUpdate(index, 'project_id', value)}
            onSearch={proyekApi.search}
            placeholder="Opsional"
            ariaLabel={`Proyek baris ${index + 1}`}
            disabled={rowReadOnly}
            size="sm"
            selectedOptions={source?.project ? [{
              value: source.project.id,
              label: source.project.name,
              sublabel: source.project.code,
            }] : []}
          />
        )
      },
    },
    {
      id: 'description',
      header: 'Keterangan',
      width: 180,
      render: ({ item, index, isReadOnly: rowReadOnly }) => (
        <Input
          aria-label={`Keterangan alokasi baris ${index + 1}`}
          value={item.description ?? ''}
          onChange={(event) => onUpdate(index, 'description', event.target.value)}
          disabled={rowReadOnly}
          placeholder="Keterangan..."
          className="h-8 text-[12px]"
        />
      ),
    },
  ]

  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">
        Alokasi Akun <span className="text-red-500">*</span>
      </p>
      <LineItemsTable
        items={items}
        columns={columns}
        onAdd={onAdd}
        onRemove={onRemove}
        onUpdate={() => undefined}
        isReadOnly={isReadOnly}
        addLabel="Tambah Baris"
      />
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  )
}
