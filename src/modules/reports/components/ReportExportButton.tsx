import { useState } from 'react'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { ReportToolButton } from './ReportToolButton'
import { exportXlsx, type XlsxCell, type XlsxFormat } from '@/lib/exportXlsx'

export interface ReportExportButtonProps {
  /** Nama file tanpa ekstensi; stempel waktu ditambahkan otomatis. */
  filename: string
  sheetName: string
  headers: string[]
  /**
   * Dipanggil saat tombol DITEKAN, bukan tiap render. Laporan bisa membawa
   * ribuan baris; membangun matriksnya di setiap render akan terasa di iPad.
   */
  rows: () => XlsxCell[][]
  /**
   * Format per kolom, sejajar dengan `headers`. Kolom tanpa entri dianggap
   * `'text'`. Kolom nominal WAJIB diberi `'currency'` dan tanggal `'date'` --
   * itulah yang membuat selnya bisa dijumlahkan dan diurutkan di Excel.
   */
  formats?: XlsxFormat[]
  /** `'tool'` = ikon di deretan alat laporan; `'outline'` = tombol berlabel. */
  variant?: 'tool' | 'outline'
  disabled?: boolean
  label?: string
}

function timestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
}

/**
 * Tombol "Export Excel" untuk modul Laporan.
 *
 * Bedanya dengan `ListExportButton` di halaman list: laporan sudah memegang
 * SELURUH barisnya di memori (backend mengembalikan satu payload penuh,
 * paginasinya di sisi klien), jadi tidak ada pengambilan ulang per halaman --
 * cukup ratakan apa yang sudah ada. Yang disamakan adalah keluarannya: satu
 * sheet .xlsx, angka sebagai angka, tanggal sebagai tanggal, header di-freeze,
 * autofilter aktif.
 *
 * Menggantikan `lib/exportCsv.ts` yang sudah dihapus: CSV-nya memakai pemisah
 * koma, dan di Windows locale Indonesia (list separator titik koma) file itu
 * menumpuk jadi satu kolom saat dibuka dobel-klik, dengan nominal masuk sebagai
 * teks karena desimalnya bertitik.
 */
export function ReportExportButton({
  filename,
  sheetName,
  headers,
  rows,
  formats,
  variant = 'tool',
  disabled,
  label = 'Export Excel',
}: ReportExportButtonProps) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = () => {
    setIsExporting(true)
    try {
      const data = rows()
      if (data.length === 0) {
        toast.warning('Tidak ada data untuk diekspor dengan parameter saat ini.')
        return
      }

      const name = `${filename}-${timestamp()}.xlsx`
      exportXlsx(name, sheetName, headers, data, formats ?? [])
      toast.success(`${data.length.toLocaleString('id-ID')} baris diekspor ke ${name}.`)
    } catch {
      toast.error('Gagal menyusun file Excel. Coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }

  if (variant === 'tool') {
    return <ReportToolButton icon={Download} label={label} onClick={handleExport} disabled={disabled || isExporting} />
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || isExporting}
      className="h-7 gap-1.5 text-[12px]"
    >
      <Download className="h-3.5 w-3.5" />
      {isExporting ? 'Menyiapkan...' : label}
    </Button>
  )
}
