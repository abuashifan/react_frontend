import { toDateInputValue } from '@/lib/utils'

/**
 * Penulis file .xlsx minimal -- tanpa dependency.
 *
 * Kenapa tidak memakai library: kebutuhan ekspor daftar di aplikasi ini hanya
 * SATU sheet datar (header + baris), sementara paket `xlsx` di npm registry
 * berhenti di 0.18.5 (versi dengan CVE prototype-pollution/ReDoS yang tidak
 * pernah ditambal di registry) dan `exceljs` menambah ratusan kB ke bundle yang
 * sudah kena peringatan >500 kB. Yang ditulis di sini adalah SpreadsheetML
 * paling sederhana yang diterima Excel, LibreOffice, dan Google Sheets: ZIP
 * berisi enam part wajib.
 */

export type XlsxCell = string | number | boolean | Date | null | undefined

/** Format kolom -- menentukan style sel, bukan isinya. */
export type XlsxFormat = 'text' | 'number' | 'currency' | 'date'

// Index ke <cellXfs> di styles.xml di bawah. Urutannya tidak boleh diubah.
const STYLE_DEFAULT = 0
const STYLE_HEADER = 1
const STYLE_DATE = 2
const STYLE_CURRENCY = 3

/** Serial tanggal Excel dihitung dari 1899-12-30 -- Excel mewarisi bug tahun kabisat 1900 dari Lotus 1-2-3. */
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30)
const MS_PER_DAY = 86_400_000

/**
 * Normalisasi nilai tanggal apa pun jadi `Date` UTC tengah malam, siap ditulis
 * sebagai serial Excel. Memakai `toDateInputValue()` supaya aturan parsing-nya
 * PERSIS sama dengan yang dipakai form (`YYYY-MM-DD` diambil apa adanya dari
 * awal string, bukan dikonversi zona waktu) -- tanpa itu datetime ISO bersuffix
 * `Z` bisa mundur satu hari untuk user WIB.
 */
export function toExcelDate(value: string | Date | null | undefined): Date | null {
  const iso = toDateInputValue(value)
  if (iso === '') return null
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

/**
 * Normalisasi nilai uang/kuantitas jadi `number` untuk sel spreadsheet.
 *
 * Backend Laravel mengirim kolom `decimal` sebagai STRING (mis. `"1500000.00"`).
 * Kalau string itu ditulis apa adanya, Excel menerimanya sebagai teks: tidak
 * bisa dijumlahkan, tidak bisa dipakai pivot, dan rata kiri di kolom nominal.
 * Nilai yang tidak bisa jadi angka berhingga dikembalikan `null` (sel kosong),
 * bukan `0` -- "tidak ada data" dan "nol" tidak boleh tertukar di laporan.
 */
export function toExcelNumber(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' && value.trim() === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) ? parsed : null
}

function excelSerial(date: Date): number {
  return (Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - EXCEL_EPOCH_UTC) / MS_PER_DAY
}

/**
 * Escape teks untuk XML sekaligus membuang karakter kontrol yang ILEGAL di XML
 * 1.0 -- satu saja lolos, Excel menolak SELURUH file, bukan cuma selnya. Tab,
 * newline, dan carriage return sengaja dipertahankan.
 */
function escapeXml(value: string): string {
  return value
    // eslint-disable-next-line no-control-regex -- justru karakter kontrol inilah yang harus dibuang
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/** 0 -> A, 25 -> Z, 26 -> AA. */
function columnName(index: number): string {
  let name = ''
  let n = index
  while (n >= 0) {
    name = String.fromCharCode(65 + (n % 26)) + name
    n = Math.floor(n / 26) - 1
  }
  return name
}

function cellXml(ref: string, value: XlsxCell, format: XlsxFormat): string {
  if (value === null || value === undefined || value === '') return ''

  if (value instanceof Date) {
    return `<c r="${ref}" s="${STYLE_DATE}"><v>${excelSerial(value)}</v></c>`
  }
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return ''
    const style = format === 'currency' ? STYLE_CURRENCY : STYLE_DEFAULT
    return `<c r="${ref}" s="${style}"><v>${value}</v></c>`
  }
  if (typeof value === 'boolean') {
    return `<c r="${ref}" t="b"><v>${value ? 1 : 0}</v></c>`
  }
  // `t="inlineStr"` dipilih supaya tidak perlu part sharedStrings.xml terpisah.
  return `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(value)}</t></is></c>`
}

function rowXml(rowIndex: number, cells: XlsxCell[], formats: XlsxFormat[], headerRow = false): string {
  const body = cells
    .map((cell, i) => {
      const ref = `${columnName(i)}${rowIndex}`
      if (headerRow) {
        return `<c r="${ref}" s="${STYLE_HEADER}" t="inlineStr"><is><t xml:space="preserve">${escapeXml(String(cell ?? ''))}</t></is></c>`
      }
      return cellXml(ref, cell, formats[i] ?? 'text')
    })
    .join('')
  return `<row r="${rowIndex}">${body}</row>`
}

/**
 * Lebar kolom ditaksir dari isi terpanjang, dibatasi 10--50 karakter supaya satu
 * kolom catatan panjang tidak membuat sheet melebar ke mana-mana.
 */
function columnWidths(headers: string[], rows: XlsxCell[][], formats: XlsxFormat[]): number[] {
  return headers.map((header, i) => {
    let longest = header.length
    for (const row of rows) {
      const value = row[i]
      if (value === null || value === undefined) continue
      const length = value instanceof Date ? 10 : String(value).length
      if (length > longest) longest = length
    }
    // Angka mata uang tampil lebih lebar dari panjang digit mentahnya karena
    // pemisah ribuan dan dua desimal ditambahkan oleh format sel.
    if (formats[i] === 'currency') longest += 4
    return Math.min(50, Math.max(10, longest + 2))
  })
}

function sheetXml(headers: string[], rows: XlsxCell[][], formats: XlsxFormat[]): string {
  const lastColumn = columnName(Math.max(0, headers.length - 1))
  const lastRow = rows.length + 1
  const cols = columnWidths(headers, rows, formats)
    .map((width, i) => `<col min="${i + 1}" max="${i + 1}" width="${width}" customWidth="1"/>`)
    .join('')

  const body = [
    rowXml(1, headers, formats, true),
    ...rows.map((row, i) => rowXml(i + 2, row, formats)),
  ].join('')

  // Urutan elemen di dalam <worksheet> ditentukan skema OOXML dan tidak boleh
  // ditukar: sheetViews -> cols -> sheetData -> autoFilter.
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${cols}</cols><sheetData>${body}</sheetData><autoFilter ref="A1:${lastColumn}${lastRow}"/></worksheet>`
}

const CONTENT_TYPES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`

const ROOT_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`

const WORKBOOK_RELS_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`

/** numFmtId kustom wajib >= 164; 0-163 sudah dipesan Excel untuk format bawaan. */
const STYLES_XML = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="2"><numFmt numFmtId="164" formatCode="dd/mm/yyyy"/><numFmt numFmtId="165" formatCode="#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="4"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`

function workbookXml(sheetName: string): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${escapeXml(sheetName)}" sheetId="1" r:id="rId1"/></sheets></workbook>`
}

// --- ZIP (metode "store", tanpa kompresi) ------------------------------------

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let bit = 0; bit < 8; bit++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

interface ZipEntry {
  name: string
  size: number
  crc: number
  offset: number
}

/**
 * Bungkus beberapa file jadi satu arsip ZIP tanpa kompresi.
 *
 * Tanpa kompresi karena XML hasil ekspor daftar berukuran wajar dan Excel
 * menerima entry ber-method 0 sama saja -- menambahkan DEFLATE berarti
 * menambahkan implementasi kompresi sendiri tanpa manfaat sepadan.
 */
function zip(files: { name: string; content: string }[]): Blob {
  const encoder = new TextEncoder()
  const chunks: Uint8Array[] = []
  const entries: ZipEntry[] = []
  let offset = 0

  const push = (bytes: Uint8Array) => {
    chunks.push(bytes)
    offset += bytes.length
  }

  const header = (size: number) => {
    const buffer = new ArrayBuffer(size)
    return { view: new DataView(buffer), bytes: new Uint8Array(buffer) }
  }

  for (const file of files) {
    const nameBytes = encoder.encode(file.name)
    const data = encoder.encode(file.content)
    const crc = crc32(data)

    const { view, bytes } = header(30)
    view.setUint32(0, 0x04034b50, true)
    view.setUint16(4, 20, true) // versi minimum
    view.setUint16(6, 0x0800, true) // flag: nama file UTF-8
    view.setUint16(8, 0, true) // metode: store
    view.setUint16(10, 0, true) // waktu modifikasi (tetap)
    view.setUint16(12, 0x2821, true) // tanggal modifikasi (tetap)
    view.setUint32(14, crc, true)
    view.setUint32(18, data.length, true)
    view.setUint32(22, data.length, true)
    view.setUint16(26, nameBytes.length, true)
    view.setUint16(28, 0, true)

    entries.push({ name: file.name, size: data.length, crc, offset })
    push(bytes)
    push(nameBytes)
    push(data)
  }

  const centralDirectoryOffset = offset
  for (const entry of entries) {
    const nameBytes = encoder.encode(entry.name)
    const { view, bytes } = header(46)
    view.setUint32(0, 0x02014b50, true)
    view.setUint16(4, 20, true)
    view.setUint16(6, 20, true)
    view.setUint16(8, 0x0800, true)
    view.setUint16(10, 0, true)
    view.setUint16(12, 0, true)
    view.setUint16(14, 0x2821, true)
    view.setUint32(16, entry.crc, true)
    view.setUint32(20, entry.size, true)
    view.setUint32(24, entry.size, true)
    view.setUint16(28, nameBytes.length, true)
    view.setUint16(30, 0, true)
    view.setUint16(32, 0, true)
    view.setUint16(34, 0, true)
    view.setUint16(36, 0, true)
    view.setUint32(38, 0, true)
    view.setUint32(42, entry.offset, true)
    push(bytes)
    push(nameBytes)
  }

  const { view, bytes } = header(22)
  view.setUint32(0, 0x06054b50, true)
  view.setUint16(8, entries.length, true)
  view.setUint16(10, entries.length, true)
  view.setUint32(12, offset - centralDirectoryOffset, true)
  view.setUint32(16, centralDirectoryOffset, true)
  push(bytes)

  return new Blob(chunks as BlobPart[], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
}

/**
 * Nama sheet Excel: maksimal 31 karakter dan tidak boleh memuat : \ / ? * [ ].
 * Excel menolak membuka file kalau aturan ini dilanggar.
 */
function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[:\\/?*[\]]/g, ' ').trim()
  return (cleaned === '' ? 'Sheet1' : cleaned).slice(0, 31)
}

export function exportXlsx(
  filename: string,
  sheetName: string,
  headers: string[],
  rows: XlsxCell[][],
  formats: XlsxFormat[] = [],
): void {
  const blob = zip([
    { name: '[Content_Types].xml', content: CONTENT_TYPES_XML },
    { name: '_rels/.rels', content: ROOT_RELS_XML },
    { name: 'xl/workbook.xml', content: workbookXml(sanitizeSheetName(sheetName)) },
    { name: 'xl/_rels/workbook.xml.rels', content: WORKBOOK_RELS_XML },
    { name: 'xl/styles.xml', content: STYLES_XML },
    { name: 'xl/worksheets/sheet1.xml', content: sheetXml(headers, rows, formats) },
  ])

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`
  anchor.click()
  URL.revokeObjectURL(url)
}
