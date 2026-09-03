import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/useToast'
import { getApiErrorMessage } from '@/lib/apiError'
import { exportXlsx, type XlsxCell, type XlsxFormat } from '@/lib/exportXlsx'

/**
 * Bentuk minimum satu halaman hasil list yang dibutuhkan tombol ini.
 * Sengaja lebih longgar dari `PaginatedResponse` supaya endpoint yang meta-nya
 * bertipe lepas (mis. `fixedAssetApi.list()` yang mengembalikan `ApiResponse`)
 * bisa diadaptasi di sisi pemanggil tanpa memalsukan field yang tidak dipakai.
 */
export interface ExportPage<T> {
  data: T[]
  meta?: { last_page?: number; total?: number }
}

/**
 * Satu kolom di file hasil ekspor. Sengaja TIDAK diturunkan dari
 * `ColumnDef` DataTable: `cell` di sana mengembalikan ReactNode (badge, tombol,
 * span ber-truncate) yang tidak bisa ditulis ke sel spreadsheet. Kolom ekspor
 * mengembalikan nilai mentah -- angka tetap angka supaya bisa dijumlahkan,
 * tanggal tetap tanggal supaya bisa diurutkan dan difilter di Excel.
 */
export interface ExportColumn<T> {
  header: string
  value: (row: T) => XlsxCell
  /** Default `'text'`. `'currency'` memberi pemisah ribuan + 2 desimal. */
  format?: XlsxFormat
}

interface ListExportButtonProps<T> {
  /** Nama file tanpa ekstensi; stempel waktu ditambahkan otomatis. */
  filename: string
  sheetName: string
  columns: ExportColumn<T>[]
  /**
   * Ambil satu halaman memakai filter yang SEDANG aktif di halaman list.
   * Pemanggil wajib meneruskan seluruh parameter filter/sort yang sama dengan
   * query tabel -- itulah yang membuat isi file persis sama dengan yang
   * terlihat di layar (termasuk ikut/tidaknya baris nonaktif).
   */
  fetchPage: (page: number, perPage: typeof EXPORT_PAGE_SIZE) => Promise<ExportPage<T>>
  /** `meta.total` hasil filter saat ini -- dipakai untuk mematikan tombol saat daftar kosong. */
  totalRows?: number
  label?: string
  disabled?: boolean
}

/**
 * Batas atas backend (`AppliesListQuery`: `min(100, per_page)`).
 *
 * Bertipe literal `100`, bukan `number`, supaya bisa langsung diteruskan ke
 * parameter `per_page` yang di beberapa modul bertipe union `25 | 50 | 100`.
 */
const EXPORT_PAGE_SIZE = 100 as const

/**
 * Pagar pengaman: 100 permintaan berturut-turut sudah terasa lama di jaringan
 * kantor, dan file di atas ukuran ini lebih tepat diambil lewat modul Laporan.
 * Kalau kena batas, user diberi tahu -- tidak dipotong diam-diam.
 */
const MAX_EXPORT_ROWS = 10_000

function timestamp(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}`
}

/**
 * Tombol "Export Excel" untuk halaman list.
 *
 * Mengekspor SELURUH baris hasil filter aktif, bukan hanya halaman yang sedang
 * terbuka -- daftar dipaginasi 25 baris, dan file berisi 25 baris pertama saja
 * hampir tidak pernah yang dimaksud user. Barisnya diambil ulang dari server
 * (bukan dari cache tabel) supaya isinya mutakhir saat tombol ditekan.
 *
 * Tidak ada gerbang izin tersendiri: tombol ini hanya muncul di halaman list
 * yang sudah dijaga izin `*.view` modulnya, dan isinya persis data yang sedang
 * ditampilkan di layar.
 */
export function ListExportButton<T>({
  filename,
  sheetName,
  columns,
  fetchPage,
  totalRows,
  label = 'Export',
  disabled,
}: ListExportButtonProps<T>) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const rows: T[] = []
      let page = 1
      let lastPage = 1
      let total = 0

      do {
        const response = await fetchPage(page, EXPORT_PAGE_SIZE)
        const pageRows = response.data ?? []
        rows.push(...pageRows)
        lastPage = response.meta?.last_page ?? 1
        total = response.meta?.total ?? rows.length
        // Halaman kosong menghentikan loop juga: tanpa ini, endpoint yang
        // mengabaikan `page` akan membuat loop berjalan sampai batas maksimum
        // sambil mengambil baris yang sama berulang-ulang.
        if (pageRows.length === 0) break
        page += 1
      } while (page <= lastPage && rows.length < MAX_EXPORT_ROWS)

      if (rows.length === 0) {
        toast.warning('Tidak ada data untuk diekspor dengan filter saat ini.')
        return
      }

      // Terpotong hanya kalau loop berhenti karena batas, PADAHAL masih ada
      // halaman berikutnya -- bukan sekadar karena jumlahnya kebetulan pas.
      const truncated = rows.length >= MAX_EXPORT_ROWS && page <= lastPage
      const exported = rows.slice(0, MAX_EXPORT_ROWS)

      const name = `${filename}-${timestamp()}.xlsx`
      exportXlsx(
        name,
        sheetName,
        columns.map((column) => column.header),
        exported.map((row) => columns.map((column) => column.value(row))),
        columns.map((column) => column.format ?? 'text'),
      )

      if (truncated) {
        toast.warning(`Diekspor ${exported.length.toLocaleString('id-ID')} baris pertama dari ${total.toLocaleString('id-ID')}. Persempit filter untuk mengekspor sisanya.`)
      } else {
        toast.success(`${exported.length.toLocaleString('id-ID')} baris diekspor ke ${name}.`)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Gagal mengekspor data. Coba lagi.'))
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleExport}
      disabled={disabled || isExporting || totalRows === 0}
      title={totalRows === 0 ? 'Tidak ada data untuk diekspor' : 'Export ke Excel (.xlsx) sesuai filter aktif'}
      className="h-8 gap-1.5 border-[#d9e2e5] px-3 text-[13px] text-[#326273] hover:bg-[#f0f9fb]"
    >
      {isExporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
      {isExporting ? 'Menyiapkan...' : label}
    </Button>
  )
}
