import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'

export type PrintPaper = 'a4' | 'half-a4'

/** Ukuran kertas cetak. "Setengah A4" = A5 mendatar, umum untuk kwitansi/bukti kas. */
export const PRINT_PAPERS: Record<PrintPaper, { label: string; page: string; widthMm: number }> = {
  'a4': { label: 'A4', page: 'A4 portrait', widthMm: 210 },
  'half-a4': { label: 'Setengah A4', page: 'A5 landscape', widthMm: 210 },
}

const PAGE_MARGIN_MM = 10

/**
 * Cetak satu dokumen lewat iframe tersembunyi.
 *
 * Halaman aplikasi penuh dengan shell (tab, sidebar, form) dan layout
 * scroll/overflow yang memotong hasil cetak; laporan mengatasinya dengan CSS
 * print khusus. Dokumen transaksi dicetak terpisah supaya multi-halaman dan
 * ukuran kertas (A4 / setengah A4) tidak bergantung pada layout halaman.
 * Stylesheet aplikasi disalin ke iframe agar kelas Tailwind tetap berlaku;
 * konten dirender tanpa provider aplikasi, jadi komponennya wajib murni (props).
 */
export async function printDocument(content: ReactNode, { paper, title }: { paper: PrintPaper; title: string }): Promise<void> {
  const iframe = document.createElement('iframe')
  iframe.setAttribute('aria-hidden', 'true')
  Object.assign(iframe.style, { position: 'fixed', right: '0', bottom: '0', width: '0', height: '0', border: '0' })
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument
  const win = iframe.contentWindow
  if (!doc || !win) {
    iframe.remove()
    return
  }

  doc.open()
  doc.write('<!doctype html><html lang="id"><head><meta charset="utf-8"></head><body></body></html>')
  doc.close()
  doc.title = title

  const loads: Promise<void>[] = []
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    const copy = node.cloneNode(true) as HTMLElement
    if (copy instanceof HTMLLinkElement) {
      loads.push(new Promise((resolve) => { copy.onload = () => resolve(); copy.onerror = () => resolve() }))
    }
    doc.head.appendChild(copy)
  })
  const pageStyle = doc.createElement('style')
  pageStyle.textContent = `
    @page { size: ${PRINT_PAPERS[paper].page}; margin: ${PAGE_MARGIN_MM}mm; }
    html, body { background: #fff; margin: 0; }
    * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  `
  doc.head.appendChild(pageStyle)

  const mount = doc.createElement('div')
  doc.body.appendChild(mount)
  const root = createRoot(mount)
  root.render(content)

  await Promise.all(loads)
  await new Promise((resolve) => setTimeout(resolve, 250))

  const cleanup = () => {
    root.unmount()
    iframe.remove()
  }
  win.addEventListener('afterprint', () => setTimeout(cleanup, 0), { once: true })
  win.focus()
  win.print()
  // Kembalikan fokus ke aplikasi; tanpa ini keyboard (Escape, Tab) tertahan di iframe.
  window.focus()
  // Beberapa browser (Safari iPad) tidak memicu afterprint -- bersihkan cadangan.
  setTimeout(() => { if (iframe.isConnected) cleanup() }, 60_000)
}
