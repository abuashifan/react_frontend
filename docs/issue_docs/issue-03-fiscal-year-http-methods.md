# Issue-03 — Fiscal Year HTTP Method Salah

**Tipe**: Bug  
**Severity**: Critical  
**Estimasi fix**: 15 menit (1 file)  
**File**: `src/modules/accounting/services/fiscalYearApi.ts`

---

## Deskripsi

`fiscalYearApi` menggunakan `http.patch()` untuk semua action, padahal backend menggunakan `GET` (untuk query) dan `POST` (untuk mutasi).

---

## Fix di `fiscalYearApi.ts`

```ts
// SEBELUM (salah):
preview: (id: number) =>
  http.patch(`/accounting/fiscal-years/${id}/closing-preview`)

checklist: (id: number) =>
  http.patch(`/accounting/fiscal-years/${id}/closing-checklist`)

close: (id: number) =>
  http.patch(`/accounting/fiscal-years/${id}/close`)

reopen: (id: number) =>
  http.patch(`/accounting/fiscal-years/${id}/reopen`)

// SESUDAH (benar):
preview: (id: number) =>
  http.get(`/accounting/fiscal-years/${id}/closing-preview`)

checklist: (id: number) =>
  http.get(`/accounting/fiscal-years/${id}/closing-checklist`)

close: (id: number) =>
  http.post(`/accounting/fiscal-years/${id}/close`)

reopen: (id: number) =>
  http.post(`/accounting/fiscal-years/${id}/reopen`)
```

---

## Implikasi ke Hook

`useFiscalYear.ts` menggunakan `preview` dan `checklist` via `useMutation`. Setelah diubah ke `http.get`, keduanya harus diubah menjadi `useQuery` (bukan mutation), karena GET tidak mengubah data.

```ts
// Ubah di useFiscalYear.ts:

// SEBELUM:
const previewMutation = useMutation({ mutationFn: () => fiscalYearApi.preview(id) })

// SESUDAH:
const { data: previewData, isLoading: previewLoading } = useQuery({
  queryKey: ['fiscal-year', id, 'closing-preview'],
  queryFn: () => fiscalYearApi.preview(id),
  enabled: !!id,
})
```

---

## Files yang Terpengaruh

```
src/modules/accounting/services/fiscalYearApi.ts   — ubah http.patch ke GET/POST
src/modules/accounting/hooks/useFiscalYear.ts      — ubah preview/checklist dari mutation ke query
src/modules/accounting/pages/FiscalYearPage.tsx    — sesuaikan cara pakai (data dari query, bukan mutation result)
```
