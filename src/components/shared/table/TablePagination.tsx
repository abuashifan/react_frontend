import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PAGINATION_OPTIONS } from '@/lib/constants'

export interface PaginationState {
  pageIndex: number         // 0-based
  pageSize: 25 | 50 | 100
}

interface TablePaginationProps {
  pagination: PaginationState
  totalRows: number
  onChange: (state: PaginationState) => void
  isFetching?: boolean
}

export function TablePagination({ pagination, totalRows, onChange, isFetching }: TablePaginationProps) {
  const { pageIndex, pageSize } = pagination
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize))
  const currentPage = pageIndex + 1
  const from = totalRows === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min(currentPage * pageSize, totalRows)

  const goTo = (index: number) => onChange({ ...pagination, pageIndex: index })

  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#d9e2e5] bg-white">
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-[#64748b]">Baris per halaman</span>
        <Select
          value={String(pageSize)}
          onValueChange={(v) =>
            onChange({ pageIndex: 0, pageSize: Number(v) as 25 | 50 | 100 })
          }
          disabled={isFetching}
        >
          <SelectTrigger className="h-7 w-[72px] text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PAGINATION_OPTIONS.map((opt) => (
              <SelectItem key={opt} value={String(opt)} className="text-[12px]">
                {opt}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-[12px] text-[#64748b]">
          {from}–{to} dari {totalRows.toLocaleString('id-ID')}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goTo(0)}
            disabled={pageIndex === 0 || isFetching}
            aria-label="Halaman pertama"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goTo(pageIndex - 1)}
            disabled={pageIndex === 0 || isFetching}
            aria-label="Halaman sebelumnya"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <span className="text-[12px] font-medium text-[#24323a] min-w-[56px] text-center tabular-nums">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goTo(pageIndex + 1)}
            disabled={currentPage >= totalPages || isFetching}
            aria-label="Halaman berikutnya"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => goTo(totalPages - 1)}
            disabled={currentPage >= totalPages || isFetching}
            aria-label="Halaman terakhir"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
