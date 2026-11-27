import { useLayoutEffect, useRef } from 'react'

/** Lebar dasar halaman laporan di layar HP: sama dengan kertas A4 (210 mm) pada 96 dpi. */
const REPORT_BASE_PX = 794

/**
 * Laporan di HP tidak disusun ulang menjadi kartu: tampil seperti membuka PDF, yaitu halaman
 * selebar kertas yang diperkecil (CSS `zoom`) sampai pas dengan lebar layar. Pengguna memperbesar
 * dengan cubit layar. Kalau isinya lebih lebar dari kertas (tabel lebar, kertas mendatar), lebar
 * dasarnya mengikuti isi supaya tidak ada yang terpotong. Saat mencetak, perbesaran dikembalikan.
 */
export function ReportZoomViewport({ children }: { children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const outerEl = outer.current
    const innerEl = inner.current
    if (!outerEl || !innerEl) return

    const fit = () => {
      const available = outerEl.clientWidth
      if (available <= 0) return
      innerEl.style.zoom = ''
      innerEl.style.width = `${REPORT_BASE_PX}px`
      const natural = Math.max(REPORT_BASE_PX, innerEl.scrollWidth)
      innerEl.style.width = `${natural}px`
      innerEl.style.zoom = String(Math.min(1, available / natural))
    }
    const reset = () => {
      innerEl.style.zoom = ''
      innerEl.style.width = ''
    }

    fit()
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null
    observer?.observe(outerEl)
    // Isi laporan datang belakangan (memuat data, tabel melebar); pantau juga perubahan DOM.
    const mutations = new MutationObserver(fit)
    mutations.observe(innerEl, { childList: true, subtree: true })
    window.addEventListener('beforeprint', reset)
    window.addEventListener('afterprint', fit)
    return () => {
      observer?.disconnect()
      mutations.disconnect()
      window.removeEventListener('beforeprint', reset)
      window.removeEventListener('afterprint', fit)
      reset()
    }
  }, [])

  return (
    <div ref={outer} className="w-full overflow-x-hidden">
      <div ref={inner} className="report-zoom-fit origin-top-left">{children}</div>
    </div>
  )
}
