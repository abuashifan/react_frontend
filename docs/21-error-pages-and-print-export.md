# 21 — Error Pages & Print/Export

## Error Pages

### Style: Minimal
Tidak ada ilustrasi. Hanya kode error + pesan singkat + tombol aksi.
Konsisten dengan feel Seaside Escape yang clean.

### Layout Semua Error Page

```tsx
// Centered di tengah layar, di atas canvas background
<div className="min-h-screen bg-[#EFEFED] flex items-center justify-center p-6">
  <div className="text-center max-w-sm">

    {/* Kode error */}
    <div className="text-[80px] font-bold text-[#d9e2e5] leading-none mb-4 tabular-nums">
      {code}
    </div>

    {/* Pesan */}
    <p className="text-sm text-[#64748b] mb-8">{message}</p>

    {/* Tombol aksi */}
    <div className="flex gap-3 justify-center">
      {actions}
    </div>

  </div>
</div>
```

---

### 403 — Forbidden

```tsx
<ErrorPage
  code="403"
  message="Anda tidak memiliki akses ke halaman ini."
  actions={[
    <Button variant="outline" onClick={() => navigate(-1)}>Kembali</Button>,
    <Button onClick={() => navigate('/dashboard')}>Ke Dashboard</Button>,
  ]}
/>
```

**Trigger:** Route guard mendeteksi user tidak punya permission yang dibutuhkan.

---

### 404 — Not Found

```tsx
<ErrorPage
  code="404"
  message="Halaman tidak ditemukan."
  actions={[
    <Button variant="outline" onClick={() => navigate(-1)}>Kembali</Button>,
    <Button onClick={() => navigate('/dashboard')}>Ke Dashboard</Button>,
  ]}
/>
```

**Trigger:** React Router tidak menemukan route yang cocok.

---

### 500 — Server Error

```tsx
<ErrorPage
  code="500"
  message="Terjadi kesalahan pada server. Coba lagi."
  actions={[
    <Button variant="outline" onClick={() => window.location.reload()}>Coba Lagi</Button>,
    <Button onClick={() => navigate('/dashboard')}>Ke Dashboard</Button>,
  ]}
/>
```

**Trigger:** API response status 500.

---

### Network Error

```tsx
// Tidak ada kode — hanya icon dan pesan
<div className="min-h-screen bg-[#EFEFED] flex items-center justify-center p-6">
  <div className="text-center max-w-sm">
    <WifiOff className="w-12 h-12 text-[#d9e2e5] mx-auto mb-4" />
    <p className="text-sm font-medium text-[#24323a] mb-2">
      Tidak ada koneksi
    </p>
    <p className="text-xs text-[#64748b] mb-8">
      Tidak dapat terhubung ke server. Periksa koneksi internet Anda.
    </p>
    <Button variant="outline" onClick={() => window.location.reload()}>
      Coba Lagi
    </Button>
  </div>
</div>
```

**Trigger:** Axios interceptor mendeteksi network error (tidak ada response).

---

### Maintenance Mode

```tsx
<div className="min-h-screen bg-[#EFEFED] flex items-center justify-center p-6">
  <div className="text-center max-w-sm">
    <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-4">
      <Settings className="w-8 h-8 text-amber-500 animate-spin-slow" />
    </div>
    <p className="text-sm font-medium text-[#24323a] mb-2">
      Sedang dalam pemeliharaan
    </p>
    <p className="text-xs text-[#64748b] mb-8">
      Sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.
    </p>
    <Button variant="outline" onClick={() => window.location.reload()}>
      Refresh
    </Button>
  </div>
</div>
```

**Trigger:** API response dengan header `X-Maintenance-Mode: true` atau status 503.

---

### Error Boundary (React)

Untuk menangkap error JavaScript yang tidak terduga:

```tsx
// components/shared/ErrorBoundary.tsx
class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#EFEFED] flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="text-[80px] font-bold text-[#d9e2e5] leading-none mb-4">
              Oops
            </div>
            <p className="text-xs text-[#64748b] mb-8">
              Terjadi kesalahan yang tidak terduga.
            </p>
            <Button onClick={() => window.location.reload()}>
              Muat Ulang Halaman
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
```

---

## Print & Export

### Tiga Tombol di Compact Bar Laporan

```tsx
<div className="flex items-center gap-2">
  {/* Print */}
  <Button
    variant="outline"
    size="sm"
    onClick={() => window.print()}
  >
    <Printer className="w-4 h-4 mr-1.5" />
    Print
  </Button>

  {/* Export PDF — server-side */}
  <Button
    variant="outline"
    size="sm"
    onClick={handleExportPdf}
    disabled={isExportingPdf}
  >
    {isExportingPdf
      ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
      : <FileDown className="w-4 h-4 mr-1.5" />
    }
    {isExportingPdf ? 'Menyiapkan...' : 'Export PDF'}
  </Button>

  {/* Export Excel — server-side, hanya tabular report */}
  {isTabularReport && (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExportExcel}
      disabled={isExportingExcel}
    >
      {isExportingExcel
        ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
        : <FileSpreadsheet className="w-4 h-4 mr-1.5" />
      }
      {isExportingExcel ? 'Menyiapkan...' : 'Export Excel'}
    </Button>
  )}
</div>
```

---

### Print (window.print())

CSS `@media print` wajib didefinisikan untuk semua halaman laporan:

```css
@media print {
  /* Sembunyikan elemen UI */
  .topbar,
  .ribbon-panel,
  .filter-sidebar,
  .compact-filter-bar,
  .fixed-bottom-bar,
  .modal,
  button {
    display: none !important;
  }

  /* Report content full width */
  .report-content {
    width: 100%;
    margin: 0;
    padding: 0;
  }

  /* Page break */
  .page-break {
    page-break-before: always;
  }

  /* Angka tabular */
  .tabular-nums {
    font-variant-numeric: tabular-nums;
  }

  /* Border tampil di print */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
```

---

### Export PDF — Server-side

```typescript
// API call
export async function exportReportPdf(
  reportId: string,
  params: ReportParams
): Promise<void> {
  const response = await http.get(`/reports/${reportId}/export/pdf`, {
    params,
    responseType: 'blob',
  })

  // Trigger download
  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `laporan-${reportId}-${formatDate(new Date())}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}

// Hook
export function useExportPdf(reportId: string) {
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)

  const exportPdf = async (params: ReportParams) => {
    setIsExporting(true)
    try {
      await exportReportPdf(reportId, params)
      toast.success('File PDF berhasil diunduh.')
    } catch (error) {
      toast.error('Gagal mengunduh PDF. Coba lagi.')
    } finally {
      setIsExporting(false)
    }
  }

  return { exportPdf, isExporting }
}
```

---

### Export Excel — Server-side

```typescript
// API call — sama seperti PDF tapi endpoint berbeda
export async function exportReportExcel(
  reportId: string,
  params: ReportParams
): Promise<void> {
  const response = await http.get(`/reports/${reportId}/export/excel`, {
    params,
    responseType: 'blob',
  })

  const url = URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = `laporan-${reportId}-${formatDate(new Date())}.xlsx`
  link.click()
  URL.revokeObjectURL(url)
}
```

**Export Excel hanya tersedia untuk tabular report.**
Financial statement (Neraca, Laba Rugi, dll.) tidak memiliki tombol Export Excel.

---

### Export untuk Dokumen Transaksi

Selain laporan, dokumen transaksi (Invoice, PO, dll.) juga punya tombol Print dan Export PDF di fixed bottom bar:

```tsx
// Di fixed bottom bar form transaksi — sebelah kiri tombol aksi
<div className="flex items-center gap-2 mr-auto">
  <Button variant="ghost" size="sm" onClick={() => window.print()}>
    <Printer className="w-4 h-4 mr-1.5" />
    Print
  </Button>
  <Button variant="ghost" size="sm" onClick={handleExportPdf}>
    <FileDown className="w-4 h-4 mr-1.5" />
    PDF
  </Button>
</div>
```

Endpoint: `GET /sales/invoices/{id}/export/pdf`
