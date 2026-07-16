import { useEffect, useState } from 'react'
import { useCompanyStore } from '@/stores/useCompanyStore'
import { cn, formatDateTime } from '@/lib/utils'
import { DEFAULT_PAGE_MARGIN_MM, resolvePageDimensionsMm } from '../constants/pageSizes'
import { useReportPageSetupStore } from '../stores/useReportPageSetupStore'

interface ReportPrintDocumentProps {
  title: string
  /** Baris parameter di bawah judul, mis. "Per 13 Juli 2026" atau "01 Jan 2026 — 13 Jul 2026". */
  paramLabel: string
  /**
   * Ringkasan filter dimensi yang aktif, mis. "Departemen: Operasional · Proyek: Renovasi".
   * Dirender rata kanan tepat di atas tabel. Lihat `useReportFilterSummary`.
   */
  filterSummary?: string
  children: React.ReactNode
}

/** Inject/update <style id="report-page-size"> berisi @page dinamis sesuai pilihan ukuran kertas. */
function useReportPrintPageStyle() {
  const { size, orientation, customWidthMm, customHeightMm } = useReportPageSetupStore()
  const { widthMm, heightMm } = resolvePageDimensionsMm({ size, orientation, customWidthMm, customHeightMm })

  useEffect(() => {
    let styleEl = document.getElementById('report-page-size') as HTMLStyleElement | null
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'report-page-size'
      document.head.appendChild(styleEl)
    }
    // counter(page)/counter(pages) di @page margin box: dukungan browser bervariasi
    // (best-effort — footer konten utama tetap tampil via .report-print-footer terlepas dari ini).
    styleEl.textContent = `@page {
      size: ${widthMm}mm ${heightMm}mm;
      margin: ${DEFAULT_PAGE_MARGIN_MM}mm;
      @bottom-right { content: "Halaman " counter(page) " dari " counter(pages); font-size: 8pt; color: #94a3b8; }
    }`
    return () => {
      styleEl?.remove()
    }
  }, [widthMm, heightMm])

  return { widthMm, heightMm }
}

/** Paper-shell dokumen laporan Financial Statement — dipakai bersama oleh semua halaman Neraca/Laba Rugi/dll. */
export function ReportPrintDocument({ title, paramLabel, filterSummary, children }: ReportPrintDocumentProps) {
  const { widthMm } = useReportPrintPageStyle()
  const companyName = useCompanyStore((s) => s.activeCompany?.name)
  const [printedAt, setPrintedAt] = useState(() => new Date())

  useEffect(() => {
    const handler = () => setPrintedAt(new Date())
    window.addEventListener('beforeprint', handler)
    return () => window.removeEventListener('beforeprint', handler)
  }, [])

  // Browser print (dan "Simpan sebagai PDF") memakai document.title sebagai nama file
  // dan sebagai teks header/footer bawaan browser kalau user tidak mematikannya —
  // ganti sementara dari judul default aplikasi supaya hasilnya relevan.
  useEffect(() => {
    const previousTitle = document.title
    document.title = companyName ? `${title} - ${companyName}` : title
    return () => {
      document.title = previousTitle
    }
  }, [title, companyName])

  return (
    <div className="report-print-page mx-auto bg-white" style={{ width: `${widthMm}mm`, padding: `${DEFAULT_PAGE_MARGIN_MM}mm` }}>
      <div className="report-print-header space-y-0.5 text-center">
        {companyName && <p className="text-[13px] font-semibold text-[#1e293b]">{companyName}</p>}
        <p className="text-[15px] font-bold uppercase tracking-wide text-[#1e293b]">{title}</p>
        <p className="text-[12px] text-[#334155]">{paramLabel}</p>
      </div>

      {filterSummary && (
        <div className="report-print-meta mt-4 flex justify-end">
          <span className="text-[11px] italic text-[#64748b]">{filterSummary}</span>
        </div>
      )}

      <div className={cn('report-print-body', filterSummary ? 'mt-1.5' : 'mt-4')}>{children}</div>

      <div className="report-print-footer mt-4 flex items-center justify-between border-t border-[#e2e8f0] pt-2 text-[10px] text-[#94a3b8]">
        <span>Dicetak pada {formatDateTime(printedAt)}</span>
        <span>Seaside Escape ERP</span>
      </div>
    </div>
  )
}
