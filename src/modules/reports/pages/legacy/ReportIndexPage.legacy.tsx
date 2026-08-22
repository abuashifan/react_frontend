/**
 * ARSIP — halaman index `/reports` yang lama (NONAKTIF sejak 16 Juli 2026).
 *
 * Dulu route `/reports` hanya me-redirect ke kategori default (`/reports/financial`),
 * karena daftar kategori sepenuhnya dilayani ribbon menu. Setelah ribbon Laporan
 * dinonaktifkan, `/reports` dilayani `ReportListPage` yang menampilkan daftar
 * laporan dua panel.
 *
 * Redirect ini juga bermasalah: ia melawan effect di `AppShell` yang menavigasi
 * router mengikuti `getActiveContentPath()` dari tab store (`/reports`), sehingga
 * path yang tersimpan di tab dan URL yang aktif menyimpang.
 *
 * File ini SENGAJA tidak diimport siapa pun — lihat `src/router/legacy/reportsRibbon.legacy.ts`
 * untuk cara mengembalikan model lama secara utuh.
 */
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DEFAULT_DOMAIN } from '../../constants/reportCategories'

export default function ReportIndexPageLegacy() {
  const navigate = useNavigate()
  useEffect(() => {
    navigate(`/reports/${DEFAULT_DOMAIN}`, { replace: true })
  }, [navigate])
  return null
}
