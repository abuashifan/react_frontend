# Phase 1D — Shared Components

**Label:** `ui-component`
**Status:** ✅ Done
**Verifikasi:** `npm run build` dan `npm run lint` lulus tanpa error.
**Commit:** `feat(shared): data table, form components, document components`

---

## Issues

### ISSUE-1D-01 — DocumentStatusBadge
- Badge warna per status dokumen
- Status: draft, approved, confirmed, posted, void, cancelled, dll.
- Menggunakan `STATUS_LABELS` dari `constants.ts`
- File: `src/components/shared/document/DocumentStatusBadge.tsx`

### ISSUE-1D-02 — DataTable
- Base table untuk semua list page
- Fitur: checkbox sticky (column kiri), sortable header, pagination, bulk action bar
- Generic typed: `DataTable<T>`
- Column definition menggunakan TanStack Table pattern
- Empty state built-in
- Loading skeleton rows
- File: `src/components/shared/table/DataTable.tsx`

### ISSUE-1D-03 — TablePagination
- Dropdown pilih page size: 25 / 50 / 100
- Info "Menampilkan X–Y dari Z data"
- Tombol prev/next/first/last
- File: `src/components/shared/table/TablePagination.tsx`

### ISSUE-1D-04 — BulkActionBar
- Muncul di atas tabel saat ada row yang di-check
- Tampilkan jumlah item terpilih
- Slot untuk action buttons (void, delete, export, dll.)
- File: `src/components/shared/table/BulkActionBar.tsx`

### ISSUE-1D-05 — SearchableSelect
- Dropdown dengan search input + debounce 300ms
- Support async search (callback ke API)
- Support value tunggal dan multiple
- Tampilkan loading state saat fetch
- File: `src/components/shared/form/SearchableSelect.tsx`

### ISSUE-1D-06 — FormSection
- Section wrapper dengan judul
- Grid 2 kolom default, support `col-span-2` per field
- File: `src/components/shared/form/FormSection.tsx`

### ISSUE-1D-07 — LineItemsTable (base)
- Tabel line items untuk form transaksi
- Kolom: no, produk (searchable), qty, satuan, harga, diskon, subtotal, hapus
- Baris tambah di bawah
- Kalkulasi otomatis subtotal per baris
- File: `src/components/shared/form/LineItemsTable.tsx`

### ISSUE-1D-08 — FormSummary
- Panel total di kanan bawah form
- Tampilkan: subtotal, diskon, pajak, grand total
- Right-aligned, `tabular-nums`
- File: `src/components/shared/form/FormSummary.tsx`

### ISSUE-1D-09 — DocumentLockedBanner
- Banner kuning di atas form jika dokumen terkunci
- Tampilkan alasan lock (ada transaksi turunan yang sudah posted)
- File: `src/components/shared/document/DocumentLockedBanner.tsx`

### ISSUE-1D-10 — VoidConfirmDialog
- Dialog konfirmasi sebelum void dokumen
- Input: alasan void (wajib diisi)
- Tombol: Batal / Void Dokumen (merah)
- File: `src/components/shared/document/VoidConfirmDialog.tsx`

### ISSUE-1D-11 — DocumentActionBar
- Komponen di FixedBottomBar untuk action buttons dokumen
- Tombol kontekstual sesuai status: Simpan Draft, Submit, Approve, Post, Void, Edit
- Handle permission check per tombol
- File: `src/components/shared/document/DocumentActionBar.tsx`

### ISSUE-1D-12 — useDocumentActions hook
- Hook reusable untuk workflow aksi dokumen
- Wrap API calls: save, submit, approve, post, void
- Handle loading state + toast notifikasi
- Handle konfirmasi dialog sebelum aksi destruktif
- File: `src/hooks/useDocumentActions.ts`

### ISSUE-1D-13 — Toast system (useToast hook)
- Hook `useToast()` untuk trigger notifikasi
- Tipe: success, error, warning, info
- Auto-dismiss setelah beberapa detik
- Provider sudah ada di `main.tsx`
- File: `src/components/shared/feedback/ToastProvider.tsx`

### ISSUE-1D-14 — EmptyState
- Komponen untuk tabel/halaman kosong
- Slot: icon, title, description, action button
- File: `src/components/shared/feedback/EmptyState.tsx`

### ISSUE-1D-15 — SystemGeneratedBadge
- Badge khusus untuk dokumen yang digenerate oleh sistem (bukan manual)
- Contoh: jurnal otomatis dari posting invoice
- File: `src/components/shared/document/SystemGeneratedBadge.tsx`
