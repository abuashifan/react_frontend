# Spec-29 — Phase 11: Opening Balance Module

**Phase**: 11  
**Tipe**: Modul baru + fix onboarding  
**Estimasi**: 1 sesi  
**Referensi**: gap-03 §3B, gap-04, design-N2

---

## Folder Structure

```
src/modules/opening-balance/
  types/
    openingBalance.types.ts
  services/
    openingBalanceApi.ts
  hooks/
    useOpeningBalance.ts
  pages/
    OpeningBalanceStatusPage.tsx
    OpeningBalanceBatchPage.tsx
  routes.tsx
```

---

## Types (`openingBalance.types.ts`)

```ts
export type OBBatchStatus = 'draft' | 'validated' | 'posted' | 'locked'

export interface OBStatus {
  has_batches: boolean
  active_batch_id?: number | null
  status?: OBBatchStatus | null
  is_locked: boolean
  total_accounts: number
  total_debit: number
  total_credit: number
  difference: number
}

export interface OBLine {
  id?: number
  account_id: number
  account?: { id: number; code: string; name: string }
  debit?: number | null
  credit?: number | null
  description?: string | null
}

export interface OBBatch {
  id: number
  status: OBBatchStatus
  description?: string | null
  lines: OBLine[]
  total_debit: number
  total_credit: number
  difference: number
  created_at: string
  posted_at?: string | null
  locked_at?: string | null
}

export interface OBBatchPayload {
  description?: string
}

export interface OBLinesPayload {
  lines: Array<{
    account_id: number
    debit?: number | null
    credit?: number | null
    description?: string | null
  }>
}
```

---

## Services (`openingBalanceApi.ts`)

```ts
export const openingBalanceApi = {
  status:       ()              → GET  /opening-balance/status
  list:         ()              → GET  /opening-balance/batches
  store:        (payload)       → POST /opening-balance/batches
  get:          (batchId)       → GET  /opening-balance/batches/{batch}
  update:       (batchId, p)    → PATCH /opening-balance/batches/{batch}
  replaceLines: (batchId, p)    → PUT  /opening-balance/batches/{batch}/lines
  validate:     (batchId)       → POST /opening-balance/batches/{batch}/validate
  preview:      (batchId)       → GET  /opening-balance/batches/{batch}/preview
  post:         (batchId)       → POST /opening-balance/batches/{batch}/post
  lock:         (batchId)       → POST /opening-balance/batches/{batch}/lock
  reopen:       (batchId)       → POST /opening-balance/batches/{batch}/reopen
}
```

---

## Hooks (`useOpeningBalance.ts`)

```ts
export function useOBStatus()
// queryKey: ['opening-balance', 'status']

export function useOBBatch(batchId?: number)
// queryKey: ['opening-balance', 'batch', batchId], enabled: !!batchId

export function useOBMutations() {
  return {
    createBatch:  useMutation → openingBalanceApi.store
    replaceLines: useMutation → openingBalanceApi.replaceLines
    validate:     useMutation → openingBalanceApi.validate
    post:         useMutation → openingBalanceApi.post
    lock:         useMutation → openingBalanceApi.lock
    reopen:       useMutation → openingBalanceApi.reopen
  }
}
```

---

## Pages

### `OpeningBalanceStatusPage.tsx`

URL: `/opening-balance`

```
WorkspaceLayout title: "Saldo Awal"

Status Card:
  - Status saldo (belum dimulai / draft / diposting / dikunci)
  - Total debit vs kredit vs selisih
  - Tombol sesuai status:
    * Belum ada batch → [Mulai Input Saldo Awal] (POST /opening-balance/batches → redirect ke batch page)
    * Draft → [Lanjutkan Input] (navigate ke /opening-balance/{batchId})
    * Posted/Locked → [Lihat Detail] [Buka Kembali] (jika ada permission)
```

### `OpeningBalanceBatchPage.tsx`

URL: `/opening-balance/:batchId`

```
WorkspaceLayout title: "Input Saldo Awal"

Status bar (inline): status badge + action buttons

Tabel editable:
  Kolom: Kode Akun | Nama Akun | Debit | Kredit | Keterangan
  - Semua baris dari GET /opening-balance/batches/{batch} (lines)
  - Editable inline (controlled state lokal, save satu kali via PUT /lines)
  - Tambah baris: SearchableSelect COA → tambah ke state

Footer:
  Total Debit | Total Kredit | Selisih (hijau jika 0, merah jika ada)

Action buttons (kondisional berdasarkan status):
  draft:
    [Simpan Baris] → PUT /lines
    [Validasi]     → POST /validate
  validated:
    [Lihat Preview] → GET /preview → tampilkan dialog
    [Posting]       → POST /post (dengan konfirmasi dialog)
  posted:
    [Kunci]         → POST /lock (dengan konfirmasi)
    [Buka Kembali]  → POST /reopen (permission: opening_balance.reopen)
  locked:
    [Buka Kembali]  → POST /reopen (permission: opening_balance.reopen)
```

---

## Routes (`routes.tsx`)

```tsx
/opening-balance           → OpeningBalanceStatusPage   permission: opening_balance.view
/opening-balance/:batchId  → OpeningBalanceBatchPage    permission: opening_balance.view
```

---

## Tambahkan ke `router/index.tsx`

```tsx
import { openingBalanceRoutes } from '@/modules/opening-balance/routes'
...openingBalanceRoutes,
```

---

## Fix Onboarding

File: `src/modules/onboarding/services/onboardingApi.ts`

```ts
// Hapus:
saveOpeningBalance: (companyId, payload) =>
  http.post(`/accounting/opening-balances`, payload)

// Bukan tanggung jawab onboarding untuk manage OB detail
// Onboarding Step5 cukup cek status via:
// GET /setup/opening-balance/preview
// Dan redirect ke /opening-balance untuk input
```

File: `src/modules/onboarding/components/steps/Step5OpeningBalance.tsx`

```tsx
// Ganti dari form inline → tampilkan status OB + link ke /opening-balance
// Jika OB sudah posted → tampilkan summary
// Jika belum → [Buka Halaman Input Saldo Awal] (link ke /opening-balance)
```

---

## Tambah ke Ribbon (Accounting atau menu tersendiri)

Opsi: tambahkan ke ribbon Accounting sebagai item terpisah:
```ts
{ id: 'opening-balance', label: 'Saldo Awal', icon: Archive, path: '/opening-balance', permission: 'opening_balance.view' }
```

Atau buat module tersendiri jika dianggap terlalu besar. Diskusikan dengan user.

---

## Build & Commit

```bash
npm run build   # harus 0 error
git commit -m "feat(opening-balance): phase 11 — opening balance module + fix onboarding step5"
git push
```
