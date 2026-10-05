import { useRef, useState } from 'react'
import { AlertTriangle, Download, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { accountMappingApi } from '../services/accountMappingApi'
import { getApiErrorMessage } from '@/lib/apiError'
import type { AccountMappingImportResult } from '../types/accountMapping.types'

interface AccountMappingImportDialogProps {
  open: boolean
  onClose: () => void
  /** Dipanggil setelah berkas diterapkan (minimal satu baris applied/error) -- pemanggil yang me-refetch daftar mapping. */
  onApplied: () => void
}

/**
 * Dipakai bersama oleh Pengaturan -> Pemetaan Akun dan Step 3 wizard setup --
 * keduanya sudah memakai `AccountMappingGroupedFields` dan endpoint yang
 * sama, jadi dialog impor ini juga satu implementasi untuk keduanya.
 *
 * Beda dari `CoaImportDialog`: hasil impor di sini LANGSUNG diterapkan oleh
 * backend lewat `updateMapping()` per baris (tidak ada tahap pratinjau/edit
 * terpisah) -- mapping_key adalah daftar tetap, bukan data yang dibuat
 * baru, jadi tidak ada draft yang perlu disunting sebelum disimpan.
 */
export function AccountMappingImportDialog({ open, onClose, onApplied }: AccountMappingImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<AccountMappingImportResult | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reset = () => {
    setFile(null)
    setResult(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    const hadEffect = !!result && (result.applied_count > 0)
    reset()
    onClose()
    if (hadEffect) onApplied()
  }

  const handleUpload = async () => {
    if (!file) return
    setIsUploading(true)
    setError(null)
    try {
      const response = await accountMappingApi.importFile(file)
      setResult(response.data)
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, 'Gagal membaca berkas. Pastikan formatnya CSV atau XLSX.'))
    } finally {
      setIsUploading(false)
    }
  }

  const problemRows = result?.results.filter((row) => row.status === 'error') ?? []

  return (
    <Dialog open={open} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent className="flex max-h-[calc(100dvh-48px)] w-[calc(100vw-32px)] max-w-[560px] flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="flex-shrink-0 border-b border-[#d9e2e5] bg-[#326273] px-4 py-2.5">
          <DialogTitle className="text-[14px] font-semibold text-white">Impor Pemetaan Akun dari File</DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
          <p className="text-[12px] text-[#64748b]">
            Unggah berkas CSV/XLSX dengan kolom <strong>Mapping Key</strong> dan <strong>Account Code</strong>.
            Baris yang kolom Account Code-nya dikosongkan akan dibiarkan -- mapping yang sudah ada untuk key
            itu tidak ikut berubah. Unduh templat untuk daftar mapping key yang valid beserta pemetaan saat ini.
          </p>

          <Button
            type="button"
            variant="outline"
            className="h-8 w-fit gap-1.5 text-[12px]"
            onClick={() => void accountMappingApi.downloadImportTemplate()}
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
                <span className="tabular-nums font-semibold text-[#3f9d7b]">{result.applied_count}</span> diterapkan,{' '}
                <span className="tabular-nums font-semibold text-[#64748b]">{result.skipped_count}</span> dibiarkan
                {result.error_count > 0 && (
                  <>
                    , <span className="tabular-nums font-semibold text-red-600">{result.error_count}</span> gagal.
                  </>
                )}
              </p>

              {problemRows.length > 0 && (
                <div className="max-h-[160px] space-y-1 overflow-y-auto rounded-md border border-red-200 bg-red-50 p-2.5 text-[11px] text-red-700">
                  {problemRows.map((row) => (
                    <p key={row.row}>
                      Baris {row.row} ({row.mapping_key || '-'}): {row.message}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-shrink-0 items-center justify-end gap-2 border-t border-[#d9e2e5] px-4 py-2.5">
          <Button type="button" variant="outline" onClick={handleClose} className="h-8 px-4 text-[13px]">
            {result ? 'Tutup' : 'Batal'}
          </Button>
          {!result && (
            <Button
              type="button"
              disabled={!file || isUploading}
              onClick={() => void handleUpload()}
              className="h-8 gap-1.5 bg-[#5c9ead] px-5 text-[13px] hover:bg-[#4a8a9b]"
            >
              <Upload className="w-3.5 h-3.5" /> {isUploading ? 'Menerapkan...' : 'Terapkan Berkas'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
