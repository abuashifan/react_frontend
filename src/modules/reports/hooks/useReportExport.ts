import { useState } from 'react'
import { reportExportApi } from '../services/reportsApi'
import type { ReportParams } from '../types/reports.types'

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function useReportExport(reportType: string) {
  const [isExportingPdf, setExportingPdf] = useState(false)
  const [isExportingExcel, setExportingExcel] = useState(false)

  const exportPdf = async (params: ReportParams, filename?: string) => {
    setExportingPdf(true)
    try {
      const blob = await reportExportApi.exportPdf(reportType, params)
      downloadBlob(blob, filename ?? `${reportType}.pdf`)
    } finally {
      setExportingPdf(false)
    }
  }

  const exportExcel = async (params: ReportParams, filename?: string) => {
    setExportingExcel(true)
    try {
      const blob = await reportExportApi.exportExcel(reportType, params)
      downloadBlob(blob, filename ?? `${reportType}.xlsx`)
    } finally {
      setExportingExcel(false)
    }
  }

  return { exportPdf, exportExcel, isExportingPdf, isExportingExcel }
}
