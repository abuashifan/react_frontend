# Issue-06 — Report Endpoint Fixes

**Tipe**: Bug + Missing Feature  
**Severity**: Medium  
**Estimasi fix**: 1 sesi  
**Referensi**: [gap-06-report-gaps.md](../gap_docs/gap-06-report-gaps.md)

---

## Fix 1: AR Aging dan AP Aging — Verifikasi Endpoint

Status Audit-11: `src/modules/reports/services/reportsApi.ts` sudah benar untuk AR/AP aging saat dicek:

```ts
arAging: (params) => http.get('/sales/ar/aging', { params })
apAging: (params) => http.get('/purchase/ap/aging', { params })
```

Instruksi lama di bawah hanya berlaku jika ada regresi:

```ts
// Jika ada:
arAging: (params) => http.get('/reports/ar-aging', { params })
// Harus diganti ke:
arAging: (params) => http.get('/sales/ar/aging', { params })

// Jika ada:
apAging: (params) => http.get('/reports/ap-aging', { params })
// Harus diganti ke:
apAging: (params) => http.get('/purchase/ap/aging', { params })
```

---

## Fix 2: Sembunyikan Tombol Export (Backend Belum Ada)

Di semua report pages yang punya tombol Export PDF / Export Excel:

```tsx
// Opsi A: Hapus tombol export sementara
// Opsi B: Wrap dengan feature flag atau comment

// Untuk sekarang: hapus tombol dari UI, hapus pemanggilan useReportExport
// Atau: tampilkan sebagai disabled dengan tooltip "Segera hadir"
```

File yang terpengaruh:
```
src/modules/reports/pages/TrialBalancePage.tsx
src/modules/reports/pages/GeneralLedgerPage.tsx
src/modules/reports/pages/ProfitLossPage.tsx
src/modules/reports/pages/BalanceSheetPage.tsx
src/modules/reports/pages/CashFlowPage.tsx
src/modules/reports/hooks/useReportExport.ts   (bisa dibiarkan, hanya tidak dipanggil)
```

---

## Fix 3: Tambah Tab di ReconciliationPage

`src/modules/reports/pages/ReconciliationPage.tsx` saat ini punya tab: `ar`, `ap`, `inventory`.

Tambahkan 3 tab baru:

```tsx
const TABS = [
  { id: 'ar',                label: 'AR',              endpoint: '/reports/reconciliation/ar' },
  { id: 'ap',                label: 'AP',              endpoint: '/reports/reconciliation/ap' },
  { id: 'inventory',         label: 'Persediaan',      endpoint: '/reports/reconciliation/inventory' },
  { id: 'grni',              label: 'GRNI',            endpoint: '/reports/reconciliation/grni' },
  { id: 'customer-deposits', label: 'Deposit Customer', endpoint: '/reports/reconciliation/customer-deposits' },
  { id: 'vendor-deposits',   label: 'Deposit Vendor',  endpoint: '/reports/reconciliation/vendor-deposits' },
]
```

---

## Fix 4: Tambah Tombol Approve di JournalFormPage

```tsx
// src/modules/accounting/pages/JournalFormPage.tsx

// Tambah mutation:
const approveMutation = useMutation({
  mutationFn: () => journalEntryApi.approve(id),
  onSuccess: () => { queryClient.invalidateQueries(...); toast.success('Jurnal disetujui.') }
})

// Tambah tombol (kondisional: hanya tampil jika status === 'draft'):
<PermissionGuard permission="journal.approve" fallback={null}>
  {journal?.status === 'draft' && (
    <Button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}>
      Setujui
    </Button>
  )}
</PermissionGuard>
```

Tambahkan endpoint di `journalEntryApi.ts`:
```ts
approve: (id: number) => http.post(`/journals/${id}/approve`)
```

---

## Fix 5: Disable atau Hapus TransactionListPage

`/reports/transactions` tidak punya backend endpoint.  
Sementara ini: hapus route-nya dari `reportsRoutes` atau redirect ke 404.

```tsx
// src/modules/reports/routes.tsx
// Hapus atau comment:
// { path: '/reports/transactions', element: <ProtectedRoute>...</ProtectedRoute> }
```

---

## Catatan Audit-11

- Export endpoint `/reports/{type}/export/pdf|excel` belum terlihat di backend dan tetap harus dianggap gap.
- `transactionList()` masih memanggil `/reports/transactions`, endpoint ini belum terlihat di backend.
- Reconciliation report perlu expose endpoint backend tambahan: GRNI, customer deposits, vendor deposits.
- Jangan mengubah AR/AP aging ke `/reports/ar-aging` atau `/reports/ap-aging`; path canonical yang ada saat ini adalah `/sales/ar/aging` dan `/purchase/ap/aging`.
