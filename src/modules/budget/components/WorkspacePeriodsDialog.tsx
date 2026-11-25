import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DataTable, type ColumnDef, type PaginationState } from '@/components/shared/table/DataTable'
import { formatDate } from '@/lib/utils'
import type { WorkspaceBudgetPeriod } from '../types/budget.types'

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })

function amount(minor: string | bigint | null) {
  if (minor === null) return '—'
  const value = BigInt(minor)
  const fraction = value % 100n
  const formatted = rupiah.format(value / 100n)
  return fraction === 0n ? formatted : formatted + ',' + String(fraction).padStart(2, '0')
}

const amountStyle = { className: 'text-right tabular-nums whitespace-nowrap', headerClassName: 'text-right' }
const columns: ColumnDef<WorkspaceBudgetPeriod>[] = [
  { id: 'name', header: 'Nama periode', size: 200, cell: ({ original }) => original.name },
  { id: 'dates', header: 'Rentang', size: 200, cell: ({ original }) => formatDate(original.period_from) + ' – ' + formatDate(original.period_to) },
  { id: 'limit', header: 'Pagu', meta: amountStyle, cell: ({ original }) => amount(original.limit_minor) },
  { id: 'committed', header: 'Komitmen', meta: amountStyle, cell: ({ original }) => amount(original.committed_minor) },
  {
    id: 'remaining', header: 'Sisa pagu', meta: amountStyle,
    cell: ({ original }) => amount(original.limit_minor === null || original.committed_minor === null
      ? null : BigInt(original.limit_minor) - BigInt(original.committed_minor)),
  },
]

export function WorkspacePeriodsDialog({ periods, workspaceUrl }: { periods: WorkspaceBudgetPeriod[]; workspaceUrl: string }) {
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: 25 })
  const first = pagination.pageIndex * pagination.pageSize
  return (
    <Dialog>
      <DialogTrigger asChild><Button type="button" variant="outline" size="sm">Pagu Workspace</Button></DialogTrigger>
      <DialogContent className="flex max-h-[calc(100dvh-96px)] w-[calc(100%-32px)] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle>Pagu Workspace</DialogTitle>
          <DialogDescription>Anggaran unit dan komitmen kegiatan yang dikelola di Finlite Workspace.</DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-auto rounded-md border border-border">
          <DataTable columns={columns} data={periods.slice(first, first + pagination.pageSize)} totalRows={periods.length}
            pagination={pagination} onPaginationChange={setPagination} />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button type="button" variant="outline">Tutup</Button></DialogClose>
          {workspaceUrl && <Button asChild><a href={workspaceUrl + '/budget/annual'} target="_blank" rel="noopener noreferrer">Buka Workspace</a></Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
