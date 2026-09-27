import { useRef, useState } from 'react'
import { AlertTriangle, Download, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { setupApi } from '../services/onboardingApi'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import type { CoaImportResult, CoaTemplateAccountInput } from '../types/setup.types'

interface CoaImportDialogProps {
  open: boolean
  onClose: () => void
  /** Dipanggil saat user menekan "Gunakan Hasil Impor" -- akun yang berhasil dibaca menjadi draft template "Kosong". */
  onImported: (accounts: CoaTemplateAccountInput[]) => void
}

/**
 * Alternatif input manual di `CoaTemplateModal`: baca berkas CSV/XLSX milik
 * user jadi draft akun lewat `POST /setup/coa-templates/import`. Hasilnya
 * BELUM disimpan -- user masih bisa pratinjau/edit di `CoaTemplateModal`
 * sebelum menekan Lanjutkan (yang memanggil `apply()` seperti biasa).
 */
export function CoaImportDialog({ open, onClose, onImported }: CoaImportDialogProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<CoaImportResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      const response = await setupApi.importCoaFile(file)
      setResult(response.data)
      if (response.data.skipped.length > 0) {
        toast.error(`${response.data.skipped.length} baris dilewati -- lihat rinciannya di bawah.`)
      }
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, 'Gagal membaca berkas. Pastikan formatnya CSV atau XLSX.'))
    } finally {
      setIsUploading(false)
    }
  }

  const handleUseResult = () => {
    if (!result) return
    onImported(result.accounts)
    handleClose()
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-48px)] w-[calc(100vw-32px)] max-w-[560px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-[#d9e2e5] bg-[#326273] px-4 py-2.5">
          <DialogTitle className="text-[14px] font-semibold text-white">Impor COA dari File</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
          <p className="text-[12px] text-[#64748b]">
            Unggah berkas CSV/XLSX dengan kolom <strong>Code, Name, Type</strong> (wajib), serta{' '}
            <strong>Parent Code</strong> dan <strong>Cash/Bank</strong> (opsional). Header berbahasa Indonesia
            (Kode, Nama, Tipe, Induk, Kas/Bank) juga dikenali.
          </p>

          <Button
            type="button"
            variant="outline"
            className="h-8 w-fit gap-1.5 text-[12px]"
            onClick={() => void setupApi.downloadCoaImportTemplate()}
          >
            <Download className="w-3.5 h-3.5" /> Unduh Templat (.xlsx)
          </Button>

          <div>
            <Label className="text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">Berkas</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt,.xlsx"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setResult(null); setError(null) }}
              className="mt-1 block w-full text-[12px] text-[#64748b] file:mr-3 file:rounded-md file:border-0 file:bg-[#5c9ead] file:px-3 file:py-1.5 file:text-[12px] file:text-white hover:file:bg-[#4a8a9b]"
            />
          </div>

          {error && (
            <p className="flex items-center gap-1.5 text-[11px] text-red-500">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              {error}
            </p>
          )}

          {result && (
            <div className="space-y-2">
              <p className="text-[12px] text-[#24323a]">
                <span className="tabular-nums font-semibold">{result.accounts.length}</span> akun berhasil dibaca
                {result.skipped.length > 0 && (
                  <>
                    , <span className="tabular-nums font-semibold text-[#b45309]">{result.skipped.length}</span> baris dilewati.
                  </>
                )}
              </p>

              {result.skipped.length > 0 && (
                <div className="max-h-[160px] space-y-1 overflow-y-auto rounded-md border border-[#FDE68A] bg-[#FFFBEB] p-2.5 text-[11px] text-[#92400E]">
                  {result.skipped.map((row, index) => (
                    <p key={`${row.row ?? 'x'}-${index}`}>
                      {row.row !== null ? `Baris ${row.row}` : row.code ? `Akun ${row.code}` : 'Baris'}: {row.errors.join(' ')}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-[#d9e2e5] px-4 py-2.5">
          <Button type="button" variant="outline" onClick={handleClose} className="h-8 px-4 text-[13px]">
            Batal
          </Button>
          {result ? (
            <Button
              type="button"
              disabled={result.accounts.length === 0}
              onClick={handleUseResult}
              className="h-8 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]"
            >
              Gunakan Hasil Impor
            </Button>
          ) : (
            <Button
              type="button"
              disabled={!file || isUploading}
              onClick={() => void handleUpload()}
              className="h-8 gap-1.5 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]"
            >
              <Upload className="w-3.5 h-3.5" /> {isUploading ? 'Membaca...' : 'Baca Berkas'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
