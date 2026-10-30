import { useState } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useCompanyLetterhead } from '@/modules/settings/hooks/useCompanySettings'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/utils'
import { PRINT_PAPERS, printDocument, type PrintPaper } from './printDocument'
import { TransactionDocumentPrint, type TransactionPrintData } from './TransactionDocumentPrint'

interface Props {
  open: boolean
  onClose: () => void
  data: TransactionPrintData | null
  /** Kwitansi/bukti kas lazimnya setengah A4; dokumen dengan banyak baris A4. */
  defaultPaper?: PrintPaper
}

/** Pratinjau + pilihan kertas sebelum mencetak dokumen transaksi. */
export function DocumentPrintDialog({ open, onClose, data, defaultPaper = 'a4' }: Props) {
  const [paper, setPaper] = useState<PrintPaper>(defaultPaper)
  const [printing, setPrinting] = useState(false)
  const { data: letterheadRes, isLoading } = useCompanyLetterhead(open)
  const letterhead = letterheadRes?.data ?? null
  const { toast } = useToast()

  const handlePrint = async () => {
    if (!data) return
    setPrinting(true)
    try {
      await printDocument(
        <TransactionDocumentPrint data={data} letterhead={letterhead} paper={paper} />,
        { paper, title: [data.title, data.number].filter(Boolean).join(' ') },
      )
      onClose()
    } catch {
      toast.error('Gagal membuka dialog cetak. Coba lagi.')
    } finally {
      setPrinting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-32px)] max-w-[900px] overflow-hidden p-0">
        <DialogHeader className="border-b border-[#e2e8f0] px-5 py-3">
          <DialogTitle className="text-[15px]">Cetak {data?.title ?? 'Dokumen'}</DialogTitle>
          <DialogDescription className="text-[12px]">Periksa pratinjau, pilih ukuran kertas, lalu cetak atau simpan sebagai PDF.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-3 px-5 pt-3">
          <div className="flex gap-1" role="radiogroup" aria-label="Ukuran kertas">
            {(Object.keys(PRINT_PAPERS) as PrintPaper[]).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={paper === key}
                onClick={() => setPaper(key)}
                className={cn('h-8 rounded px-3 text-[12px] font-medium transition-colors', paper === key ? 'bg-[#5c9ead] text-white' : 'bg-[#f1f5f9] text-[#64748b] hover:bg-[#e2e8f0]')}
              >
                {PRINT_PAPERS[key].label}
              </button>
            ))}
          </div>
          <Button type="button" onClick={() => void handlePrint()} disabled={!data || printing || isLoading} className="h-8 gap-1.5 bg-[#e39774] px-4 text-[13px] hover:bg-[#d4845e]">
            <Printer className="h-3.5 w-3.5" />
            {printing ? 'Menyiapkan...' : 'Cetak'}
          </Button>
        </div>

        <div className="m-5 mt-3 max-h-[calc(100dvh-210px)] overflow-auto rounded border border-[#e2e8f0] bg-[#f1f5f9] p-4">
          <div className="mx-auto bg-white p-[10mm] shadow-sm" style={{ width: `${PRINT_PAPERS[paper].widthMm}mm`, maxWidth: '100%' }}>
            {data && <TransactionDocumentPrint data={data} letterhead={letterhead} paper={paper} />}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
