# GAP-05 — Dashboard Tidak Punya Backend Endpoint

**Severity**: 🟡 Medium  
**Tipe**: Frontend punya service, backend tidak punya endpoint

---

## Kondisi Saat Ini

`src/modules/dashboard/services/dashboardApi.ts` memanggil:
```ts
GET /dashboard/summary    → tidak ada di backend
GET /dashboard/pending    → tidak ada di backend
GET /dashboard/chart      → tidak ada di backend
GET /dashboard/activities → tidak ada di backend
```

`DashboardPage.tsx` sudah aktif di route `/` (Phase 7), sehingga semua KPI card dan chart **akan error** saat pertama kali dibuka.

---

## Pilihan Solusi

### Opsi A: Backend tambah dashboard endpoints (Direkomendasikan jika backend bisa)

Backend buat satu endpoint baru atau beberapa:
```
GET /dashboard/summary    → total AR, AP, cash balance, current month profit
GET /dashboard/pending    → count pending invoices, bills, low stock, dll
GET /dashboard/chart      → sales/purchase per bulan, cash flow per bulan
GET /dashboard/activities → recent transactions
```

**Pro**: Frontend tidak perlu perubahan besar, data selalu konsisten.  
**Con**: Backend perlu tambah modul baru.

### Opsi B: Compose dari endpoint yang sudah ada (Frontend-only fix)

Ganti `dashboardApi` untuk memanggil endpoint yang sudah ada:

```ts
// Ganti dashboardApi.summary() dengan:
GET /sales/ar/customer-summary     → AR total
GET /purchase/ap/vendor-summary    → AP total

// Ganti dashboardApi.pending() dengan:
GET /sales/invoices?status=draft&per_page=1   → count pending invoices
GET /purchase/bills?status=draft&per_page=1   → count pending bills
GET /inventory/reports/low-stock?per_page=1   → count low stock

// Chart: tidak ada endpoint yang cocok → bisa skip atau hardcode kosong

// Activities: tidak ada dedicated endpoint → bisa skip
```

**Pro**: Tidak perlu perubahan backend.  
**Con**: Multiple requests, tidak semua data tersedia, chart tidak bisa dibuat.

### Opsi C: Fallback graceful (Quick fix)

Sementara backend belum siap, ubah dashboard agar:
- KPI cards menampilkan skeleton/empty state yang elegan (bukan error)
- Charts tidak dirender jika data tidak ada
- Tidak ada error toast saat gagal fetch

**Pro**: Cepat, tidak breaking.  
**Con**: Dashboard tidak informatif.

---

## Rekomendasi

Pilih **Opsi C** dulu sebagai quick fix (tambahkan `retry: false` dan `enabled: false` atau graceful empty state), sambil diskusi ke backend tentang **Opsi A**.

---

## File yang Perlu Diubah (Opsi C)

```
src/modules/dashboard/hooks/useDashboardData.ts   — tambah retry: false, staleTime tinggi
src/modules/dashboard/components/KpiCards.tsx      — pastikan empty state elegan jika data undefined
src/modules/dashboard/components/SalesPurchaseChart.tsx  — handle data kosong tanpa crash
src/modules/dashboard/components/CashFlowChart.tsx       — handle data kosong
src/modules/dashboard/components/PendingDocumentAlerts.tsx — handle null gracefully
src/modules/dashboard/components/RecentActivity.tsx       — handle empty array
```
