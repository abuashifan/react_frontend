# Prompt — Phase 8: P0 Contract Fixes

**Phase**: 8  
**Estimasi**: 1 sesi  
**Dependencies**: Phase 7 (Dashboard & Settings) harus sudah selesai  
**Referensi**: `docs/praproduction_docs/spec-26-p0-contract-fixes.md`

---

## Tugas

Ini adalah phase corrective (bukan feature). Semua ini adalah bug yang sudah ada di kode saat ini — mismatch antara frontend dan backend contract yang benar.

**Baca dulu sebelum mulai:**
1. `docs/gap_docs/gap-01-p0-contract-fixes.md` — daftar semua gap yang harus di-fix
2. `docs/issue_docs/issue-01-permission-keys.md` — per-file fix untuk permission keys
3. `docs/issue_docs/issue-02-ribbon-paths.md` — 3 path fix di moduleConfig.ts
4. `docs/issue_docs/issue-03-fiscal-year-http-methods.md` — PATCH→GET/POST fix
5. `docs/issue_docs/issue-04-bank-recon-methods.md` — PATCH→POST fix
6. `docs/issue_docs/issue-05-settings-endpoints.md` — settings endpoint mapping
7. `docs/issue_docs/issue-06-report-endpoint-fixes.md` — 5 report fixes
8. `docs/praproduction_docs/spec-26-p0-contract-fixes.md` — full spec dengan kode

---

## Urutan Pekerjaan

### Step 1 — Permission Keys (issue-01)

File yang diubah:
- `src/modules/sales/routes.tsx` — `delivery-orders` → `delivery_orders`
- `src/modules/purchase/routes.tsx` — `goods-receipts` → `goods_receipts`
- `src/modules/inventory/routes.tsx` — `stock-opname` → `opname` (tanpa 's')
- `src/modules/accounting/routes.tsx` — sesuai tabel di issue-01
- `src/router/moduleConfig.ts` — semua permission di ribbonItems yang ada dash

Cek semua file `routes.tsx` per modul, cari pattern `permission="..."` yang menggunakan `-` lalu ganti dengan `_`.

### Step 2 — Ribbon Paths (issue-02)

File: `src/router/moduleConfig.ts`

3 path yang salah:
- `sales` ribbonItem `delivery-orders` → path: `/sales/delivery-orders` ✓ (path URL boleh pakai dash)
  
**Yang diperbaiki bukan path URL-nya, tapi permission key-nya** (sudah di Step 1).

Cek juga apakah ada ribbon path yang mengarah ke route yang tidak ada di `router/index.tsx`.

### Step 3 — FiscalYear HTTP Methods (issue-03)

File: `src/modules/accounting/services/fiscalYearApi.ts`

Endpoint yang salah method:
- `GET /accounting/fiscal-years/{id}/preview` — bukan PATCH, ubah ke `http.get`
- `GET /accounting/fiscal-years/{id}/checklist` — bukan PATCH, ubah ke `http.get`
- `POST /accounting/fiscal-years/{id}/close` — bukan PATCH, ubah ke `http.post`
- `POST /accounting/fiscal-years/{id}/reopen` — bukan PATCH, ubah ke `http.post`

Jika ada hook yang menggunakan `useMutation` untuk preview/checklist, ubah ke `useQuery` (karena GET = query, bukan mutation).

File yang mungkin perlu update: `src/modules/accounting/hooks/useFiscalYear.ts`

### Step 4 — Bank Recon HTTP Methods (issue-04)

File: `src/modules/cash-bank/services/bankReconApi.ts`

Endpoint yang salah method:
- `POST /cash-bank/reconciliations/{id}/refresh-lines` — bukan PATCH
- `POST /cash-bank/reconciliations/{id}/mark-lines` — bukan PATCH

Endpoint yang tidak ada di backend (hapus dari service):
- `POST /cash-bank/reconciliations/{id}/finalize` → gunakan `complete` jika ada, atau hapus

Tambahkan jika belum ada:
- `PATCH /cash-bank/reconciliations/{id}` — update header rekonsiliasi

File yang mungkin perlu update: `src/modules/cash-bank/hooks/useBankRecon.ts`

### Step 5 — Report Endpoint Fixes (issue-06)

File yang diubah:
1. `src/modules/accounting/services/reportApi.ts` — AR aging: `/reports/ar-aging`, AP aging: `/reports/ap-aging`
2. Disable semua tombol Export di halaman report (tombol ada tapi backend endpoint belum ada)
3. Bank Recon report: tambah tab untuk GRNI recon dan deposit recon jika endpoint sudah ada
4. Journal approve: hapus tombol approve dari JournalListPage jika endpoint tidak ada
5. Account Ledger: cek endpoint `/reports/account-ledger` vs `/reports/general-ledger`

### Step 6 — Verify Build

```bash
cd /workspace/frontend
npm run build   # Harus 0 error
```

### Step 7 — Update Docs

Update `docs/struktur_frontend.md` jika ada perubahan file (kemungkinan tidak ada file baru, hanya file yang diubah).

### Step 8 — Commit & Push

```bash
rtk git add src/modules/accounting/services/fiscalYearApi.ts
rtk git add src/modules/cash-bank/services/bankReconApi.ts
rtk git add src/router/moduleConfig.ts
# ... semua file yang diubah
rtk git commit -m "fix(contracts): phase 8 — align permission keys, HTTP methods, and endpoints to backend"
rtk git push
```

---

## Cek Akhir

Sebelum dianggap selesai, pastikan:
- [ ] `npm run build` 0 error
- [ ] Tidak ada permission key yang menggunakan `-` (semua pakai `_`)
- [ ] FiscalYear preview/checklist menggunakan `http.get` (bukan `http.patch`)
- [ ] FiscalYear close/reopen menggunakan `http.post` (bukan `http.patch`)
- [ ] BankRecon refresh-lines/mark-lines menggunakan `http.post`

---

## Hal yang TIDAK Dikerjakan di Phase Ini

- Membuat halaman baru
- Mengubah desain halaman
- Mengubah state management
- Implementasi fitur baru

Hanya fix contract mismatch yang sudah ada.
