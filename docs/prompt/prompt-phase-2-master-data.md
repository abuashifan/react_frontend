# Phase 2 — Master Data

**Label:** `master-data`
**Status:** ⏳ Belum dimulai (tunggu Phase 1 bersih)
**Verifikasi:** CRUD semua master data berfungsi, SearchableSelect bisa cari data master.
**Commit:** `feat(master-data): complete phase 2 — all master data modules`

---

## Sub-phase 2A — COA & Kontak

### ISSUE-2A-01 — COA List Page
- Tampilkan tree struktur COA (parent → children)
- Kolom: kode akun, nama akun, tipe, status aktif
- Filter sidebar: tipe akun, status
- Bulk action: activate / deactivate
- File: `src/modules/master-data/pages/CoaListPage.tsx`

### ISSUE-2A-02 — COA Form Page
- Create + edit akun
- Fields: kode, nama, tipe akun, akun induk (SearchableSelect), deskripsi
- Action: activate / deactivate
- File: `src/modules/master-data/pages/CoaFormPage.tsx`

### ISSUE-2A-03 — Kontak List Page
- Kolom: kode, nama, tipe (customer/supplier/both), telepon, email, status
- Filter sidebar: tipe kontak, status
- File: `src/modules/master-data/pages/KontakListPage.tsx`

### ISSUE-2A-04 — Kontak Form Page
- Fields: kode (auto), nama, tipe (customer/supplier/both), telepon, email, alamat, NPWP, payment term
- File: `src/modules/master-data/pages/KontakFormPage.tsx`

---

## Sub-phase 2B — Produk & Inventory Master

### ISSUE-2B-01 — Produk List Page
- Kolom: kode, nama, kategori, satuan, harga jual, status
- Filter sidebar: kategori, status
- File: `src/modules/master-data/pages/ProdukListPage.tsx`

### ISSUE-2B-02 — Produk Form Page
- Fields: kode, nama, kategori, satuan, is_stock_item, harga jual, harga beli, akun penjualan, akun pembelian, akun inventory
- File: `src/modules/master-data/pages/ProdukFormPage.tsx`

### ISSUE-2B-03 — Kategori Produk List & Form
- List: nama kategori, jumlah produk
- Form: nama, deskripsi
- File: `src/modules/master-data/pages/KategoriProdukPage.tsx`

### ISSUE-2B-04 — Satuan List & Form
- List: nama, simbol
- Form: nama (required), simbol (required), presisi desimal
- File: `src/modules/master-data/pages/SatuanPage.tsx`

### ISSUE-2B-05 — Gudang List & Form
- List: nama, alamat, status
- Form: nama (required), alamat, status aktif
- File: `src/modules/master-data/pages/GudangPage.tsx`

---

## Sub-phase 2C — Supporting Master Data

### ISSUE-2C-01 — Payment Terms List & Form
- List: nama, jumlah hari
- Form: nama (required), hari (required), deskripsi
- File: `src/modules/master-data/pages/PaymentTermsPage.tsx`

### ISSUE-2C-02 — Departemen List & Form
- List: kode, nama, status
- Form: kode (auto), nama (required)
- File: `src/modules/master-data/pages/DepartemenPage.tsx`

### ISSUE-2C-03 — Proyek List & Form
- List: kode, nama, status, tanggal mulai/selesai
- Form: kode (auto), nama, status (active/completed/cancelled), tanggal
- File: `src/modules/master-data/pages/ProyekPage.tsx`

### ISSUE-2C-04 — Account Mapping Settings Page
- Tampilkan semua mapping: label → akun terpilih (SearchableSelect COA)
- Simpan semua sekaligus (bukan per baris)
- File: `src/modules/master-data/pages/AccountMappingPage.tsx`
