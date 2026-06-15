import { useState } from 'react'
import { Search } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DocumentStatusBadge } from '@/components/shared/document/DocumentStatusBadge'
import { formatCurrency } from '@/lib/utils'
import { sourceDocumentApi } from '../services/sourceDocumentApi'
import type { SourceDocumentType, SourceDocumentItem } from '../services/sourceDocumentApi'
import type { DocumentStatus } from '@/types/common.types'

interface SourceDocumentPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (doc: SourceDocumentItem) => void
  type: SourceDocumentType
  customerId?: number
  title?: string
}

export function SourceDocumentPicker({
  isOpen,
  onClose,
  onSelect,
  type,
  customerId,
  title = 'Pilih Dokumen Sumber',
}: SourceDocumentPickerProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<SourceDocumentItem | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['sales', 'source-documents', type, customerId, search],
    queryFn: () => sourceDocumentApi.list({ type, customer_id: customerId, search }),
    enabled: isOpen,
  })

  const docs = data?.data ?? []

  const handleConfirm = () => {
    if (!selected) return
    onSelect(selected)
    setSelected(null)
    setSearch('')
    onClose()
  }

  const handleClose = () => {
    setSelected(null)
    setSearch('')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[calc(100dvh-48px)] sm:max-w-lg flex flex-col gap-0 p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-[#f1f5f9]">
          <DialogTitle className="text-[15px]">{title}</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-3 border-b border-[#f1f5f9]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94a3b8]" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nomor dokumen..."
              className="h-8 pl-8 text-[13px]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 max-h-[360px]">
          {isLoading ? (
            <div className="py-8 text-center text-[13px] text-[#94a3b8]">Memuat...</div>
          ) : docs.length === 0 ? (
            <div className="py-8 text-center text-[13px] text-[#94a3b8]">Tidak ada dokumen tersedia.</div>
          ) : (
            <div className="divide-y divide-[#f1f5f9]">
              {docs.map((doc) => (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelected(doc)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#f8fbfc] transition-colors ${selected?.id === doc.id ? 'bg-[#f0f9ff] border-l-2 border-[#5c9ead]' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-[#24323a]">{doc.number}</p>
                    <p className="text-[11px] text-[#64748b] truncate">{doc.customer_name} · {doc.date}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3 shrink-0">
                    <span className="text-[12px] tabular-nums text-[#24323a]">
                      {formatCurrency(doc.grand_total)}
                    </span>
                    <DocumentStatusBadge status={doc.status as DocumentStatus} size="xs" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="px-4 py-3 border-t border-[#f1f5f9] gap-2">
          <Button type="button" variant="outline" className="h-8 text-[13px]" onClick={handleClose}>
            Batal
          </Button>
          <Button
            type="button"
            className="bg-[#e39774] hover:bg-[#d4845e] h-8 text-[13px]"
            disabled={!selected}
            onClick={handleConfirm}
          >
            Pilih
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
