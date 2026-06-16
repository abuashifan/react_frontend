# Prompt — Phase 11: Opening Balance Module

**Phase**: 11  
**Estimasi**: 1 sesi  
**Dependencies**: Phase 10 harus selesai (atau bisa paralel dengan Phase 10)  
**Referensi**: `docs/praproduction_docs/spec-29-opening-balance-module.md`

---

## Tugas

Buat modul Opening Balance lengkap (2 halaman) dan fix onboarding Step5 yang masih mengarah ke endpoint yang tidak ada.

**Baca dulu sebelum mulai:**
1. `docs/gap_docs/gap-03-missing-modules.md` §3B — Opening Balance gap
2. `docs/design_docs/design-N2-opening-balance.md` — desain halaman
3. `docs/praproduction_docs/spec-29-opening-balance-module.md` — full spec dengan types

---

## Context

- Backend sudah ada endpoint `/opening-balance/*` tapi frontend belum ada halaman sama sekali
- Onboarding Step5 saat ini mencoba POST `/accounting/opening-balances` yang tidak ada di backend
- Saldo awal di backend menggunakan konsep "batch" — satu batch berisi banyak baris akun

---

## File yang Dibuat Baru

```
src/modules/opening-balance/
  types/
    openingBalance.types.ts
  services/
    openingBalanceApi.ts
  hooks/
    useOpeningBalance.ts
  pages/
    OpeningBalanceStatusPage.tsx   ← URL: /opening-balance
    OpeningBalanceBatchPage.tsx    ← URL: /opening-balance/:batchId
  routes.tsx
```

---

## File yang Diubah

```
src/modules/onboarding/services/onboardingApi.ts             ← hapus saveOpeningBalance
src/modules/onboarding/components/steps/Step5OpeningBalance.tsx ← ganti ke status + link
src/router/index.tsx                                          ← tambah openingBalanceRoutes
src/router/moduleConfig.ts                                    ← tambah ribbon item (jika di accounting)
```

---

## Urutan Pekerjaan

### Step 1 — Types (`openingBalance.types.ts`)

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
```

### Step 2 — Services (`openingBalanceApi.ts`)

```ts
export const openingBalanceApi = {
  status:       ()                       → GET  /opening-balance/status
  list:         ()                       → GET  /opening-balance/batches
  store:        (payload: {description?})→ POST /opening-balance/batches
  get:          (batchId: number)        → GET  /opening-balance/batches/{batch}
  update:       (batchId, payload)       → PATCH /opening-balance/batches/{batch}
  replaceLines: (batchId, payload)       → PUT  /opening-balance/batches/{batch}/lines
  validate:     (batchId)                → POST /opening-balance/batches/{batch}/validate
  preview:      (batchId)                → GET  /opening-balance/batches/{batch}/preview
  post:         (batchId)                → POST /opening-balance/batches/{batch}/post
  lock:         (batchId)                → POST /opening-balance/batches/{batch}/lock
  reopen:       (batchId)                → POST /opening-balance/batches/{batch}/reopen
}
```

### Step 3 — Hooks (`useOpeningBalance.ts`)

```ts
export function useOBStatus()
// queryKey: ['opening-balance', 'status']

export function useOBBatch(batchId?: number)
// queryKey: ['opening-balance', 'batch', batchId]
// enabled: !!batchId

export function useOBMutations() {
  const qc = useQueryClient()
  return {
    createBatch:  useMutation({ mutationFn: openingBalanceApi.store, onSuccess: () => qc.invalidateQueries(['opening-balance']) })
    replaceLines: useMutation({ ... })
    validate:     useMutation({ ... })
    post:         useMutation({ ... })
    lock:         useMutation({ ... })
    reopen:       useMutation({ ... })
  }
}
```

### Step 4 — OpeningBalanceStatusPage.tsx

**URL**: `/opening-balance`

Layout: `WorkspaceLayout` dengan judul "Saldo Awal"

**Status Card** berdasarkan `useOBStatus()`:

| Kondisi | Tampilan | Action |
|---------|----------|--------|
| `has_batches = false` | "Belum ada saldo awal" | Tombol [Mulai Input Saldo Awal] → POST /batches → navigate ke /opening-balance/{id} |
| `status = 'draft'` | Status badge "Draft" + angka | Tombol [Lanjutkan Input] → navigate ke /opening-balance/{active_batch_id} |
| `status = 'validated'` | Status badge "Tervalidasi" | Tombol [Lihat Detail] + [Posting] |
| `status = 'posted'` | Status badge "Diposting" | Tombol [Lihat Detail] + [Kunci] |
| `status = 'locked'` | Status badge "Dikunci" | Tombol [Lihat Detail] + [Buka Kembali] (permission: `opening_balance.reopen`) |

**Summary (jika sudah ada batch)**:
```
Total Debit  : Rp X
Total Kredit : Rp X
Selisih      : Rp X (hijau jika 0, merah jika ada)
```

### Step 5 — OpeningBalanceBatchPage.tsx

**URL**: `/opening-balance/:batchId`

Layout: `WorkspaceLayout` + FormLayout-style header

**Header**: status badge + tombol aksi berdasarkan status batch

**Tabel Editable**:
- Kolom: Kode Akun | Nama Akun | Debit | Kredit | Keterangan
- State lokal: `lines: OBLine[]` — di-load dari `useOBBatch(batchId)`
- Tambah baris: SearchableSelect COA (`coaApi.search(q)`) → tambah ke state lokal
- Hapus baris: tombol × per baris (jika status masih draft)
- Footer: Total Debit | Total Kredit | Selisih

**Action Buttons Kondisional**:
```
status === 'draft':
  [Simpan Baris] → PUT /lines  (kirim semua lines lokal)
  [Validasi]     → POST /validate

status === 'validated':
  [Lihat Preview] → GET /preview → tampilkan Dialog
  [Posting]       → POST /post + konfirmasi Dialog

status === 'posted':
  [Kunci]         → POST /lock + konfirmasi Dialog
  [Buka Kembali]  → POST /reopen (PermissionGuard: opening_balance.reopen)

status === 'locked':
  [Buka Kembali]  → POST /reopen (PermissionGuard: opening_balance.reopen)
```

**Format angka**: semua angka debit/kredit menggunakan `tabular-nums` dan format `Rp X.XXX,XX`

### Step 6 — Fix Onboarding Step5

**File**: `src/modules/onboarding/components/steps/Step5OpeningBalance.tsx`

Ganti dari form input inline menjadi:
1. Load status dari `GET /setup/opening-balance/preview` (jika endpoint ada di backend)
2. Jika belum ada OB atau endpoint tidak ada → tampilkan tombol [Buka Halaman Input Saldo Awal] yang link ke `/opening-balance`
3. Jika sudah ada OB posted → tampilkan summary (total debit, kredit, selisih)

**File**: `src/modules/onboarding/services/onboardingApi.ts`

Hapus atau comment out:
```ts
// Hapus ini:
saveOpeningBalance: (companyId, payload) =>
  http.post(`/accounting/opening-balances`, payload)
```

### Step 7 — Routes

```tsx
// src/modules/opening-balance/routes.tsx
export const openingBalanceRoutes = [
  {
    path: '/opening-balance',
    element: (
      <ProtectedRoute permission="opening_balance.view">
        <OpeningBalanceStatusPage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/opening-balance/:batchId',
    element: (
      <ProtectedRoute permission="opening_balance.view">
        <OpeningBalanceBatchPage />
      </ProtectedRoute>
    ),
  },
]
```

### Step 8 — Router & ModuleConfig

Di `src/router/index.tsx`:
```tsx
import { openingBalanceRoutes } from '@/modules/opening-balance/routes'
// ...spread di routes array
...openingBalanceRoutes,
```

Di `src/router/moduleConfig.ts` — tambahkan ke accounting ribbonItems:
```ts
{ id: 'opening-balance', label: 'Saldo Awal', icon: Archive, path: '/opening-balance', permission: 'opening_balance.view' }
```

Import `Archive` dari lucide-react jika belum ada.

### Step 9 — Verify Build & Commit

```bash
cd /workspace/frontend
npm run build   # harus 0 error
rtk git add src/modules/opening-balance/
rtk git add src/modules/onboarding/
rtk git add src/router/index.tsx src/router/moduleConfig.ts
rtk git commit -m "feat(opening-balance): phase 11 — opening balance module + fix onboarding step5"
rtk git push
```

---

## Hal yang Harus Diperhatikan

1. **`useNavigate`** — setelah POST /batches berhasil, navigate ke `/opening-balance/${result.data.id}`
2. **Lines state management** — jangan simpan di Zustand, cukup `useState` lokal di BatchPage
3. **Total calculation** — hitung total debit/kredit/selisih di client dari lines state
4. **Format angka input** — gunakan `type="number"` atau custom input component yang ada, jangan buat komponen baru
5. **PermissionGuard** — wrap semua tombol aksi
6. **Update docs/struktur_frontend.md** setelah selesai
