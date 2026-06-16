# Phase 5 — Inventory Module

**Label:** `inventory`
**Status:** ⏳ Belum dimulai (bisa paralel dengan Phase 3 & 4 setelah Phase 2 selesai)
**Verifikasi:** Stock balance update setelah movement. Opname finalize berfungsi.
**Commit:** `feat(inventory): complete phase 5 — inventory management`

---

## Sub-phase 5A — Stock Balance & Movement

### ISSUE-5A-01 — Stock Balance List Page
- Kolom: produk, gudang, qty on hand, qty reserved, qty available
- Filter sidebar: gudang, kategori produk, status stok (normal/low/negative)
- File: `src/modules/inventory/pages/StockBalanceListPage.tsx`

### ISSUE-5A-02 — Stock Balance Detail Page
- Detail per produk + gudang: history saldo, mutasi masuk/keluar
- Tampilkan semua movement yang mempengaruhi saldo ini
- File: `src/modules/inventory/pages/StockBalanceDetailPage.tsx`

### ISSUE-5A-03 — Stock Movement List Page
- Kolom: nomor, tanggal, tipe movement (in/out/transfer), produk, gudang, qty, status
- Filter sidebar: tipe, gudang, produk, tanggal, status
- File: `src/modules/inventory/pages/StockMovementListPage.tsx`

### ISSUE-5A-04 — Stock Movement Form (manual)
- Fields: tanggal, tipe (in/out/transfer), gudang asal/tujuan, produk, qty, catatan
- Actions: Simpan Draft, Post, Void
- File: `src/modules/inventory/pages/StockMovementFormPage.tsx`

### ISSUE-5A-05 — Stock Movement post/void actions
- Post: update saldo stok + generate jurnal inventory
- Void: reverse saldo dan jurnal
- Konfirmasi dialog sebelum void

---

## Sub-phase 5B — Adjustment & Opname

### ISSUE-5B-01 — Stock Adjustment List Page
- Kolom: nomor, tanggal, gudang, alasan, status
- Filter sidebar: gudang, status, tanggal
- File: `src/modules/inventory/pages/StockAdjustmentListPage.tsx`

### ISSUE-5B-02 — Stock Adjustment Form Page
- Header: tanggal, gudang, alasan penyesuaian
- Line items: produk, qty sistem, qty aktual, selisih, catatan
- Actions: Simpan Draft, Approve, Post, Void
- File: `src/modules/inventory/pages/StockAdjustmentFormPage.tsx`

### ISSUE-5B-03 — Stock Opname List Page
- Kolom: nomor opname, tanggal, gudang, status, jumlah item
- Filter sidebar: gudang, status, tanggal
- File: `src/modules/inventory/pages/StockOpnameListPage.tsx`

### ISSUE-5B-04 — Stock Opname Form Page
- Step 1: pilih gudang → generate lines (semua produk di gudang tersebut)
- Step 2: input qty aktual per produk (bisa inline edit di tabel)
- Step 3: review selisih → finalize
- Actions: Generate Lines, Finalize, Void
- File: `src/modules/inventory/pages/StockOpnameFormPage.tsx`
