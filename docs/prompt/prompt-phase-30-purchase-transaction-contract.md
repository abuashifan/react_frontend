# Prompt — Phase 30: Purchase Transaction Contract

**Phase**: 30  
**Status**: In Progress  
**Referensi utama**: `../issue_docs/issue-33-phase-30-purchase-transaction-contract.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-33-phase-30-purchase-transaction-contract.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/purchase/*
```

Jika backend berubah, baca backend `AGENTS.md` dan modul Purchase yang relevan.

---

## 1. Tujuan Phase

Phase 30 memperbaiki kontrak transaksi Purchase secara menyeluruh:

- purchase request;
- purchase order;
- goods receipt;
- vendor bill;
- payment;
- deposit;
- return.

---

## 2. Non-Negotiable Guardrails

- Jangan membiarkan payload form bergantung pada field legacy yang sudah salah.
- Jangan menutup source conversion error dengan fallback palsu.
- Jangan membiarkan return melewati accounting/inventory control.
- Jangan menghapus draft persistence jika phase membutuhkan itu untuk UX.
- Jangan ubah global router/tab architecture.

---

## 3. Tugas Utama

### Step 1 - Resource adapter

Setiap resource purchase harus punya adapter request/response yang konsisten.

### Step 2 - Source and line rules

Pastikan:

- source picker valid;
- remaining quantity/amount jelas;
- return tidak over-convert;
- line validation canonical;
- lifecycle action sesuai permission.

### Step 3 - Draft and detail behavior

- draft create form tetap tersimpan;
- detail round-trip sama dengan backend;
- error/not-found/permission state jelas;
- no fake data for missing contract.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- representative create/detail/edit screens work;
- source picker and remaining amount visible;
- draft persistence intact;
- return flow obeys control;
- no regression in shell/navigation.

---

## 5. Progress Implementasi (Vendor Bill)

Status per 2026-06-26. Resource lain belum dimulai.

| Step | Finding | Status | Keterangan |
|---|---|---|---|
| 1 | A13-161/162 | ✅ Done | `vendorBillAdapter.ts`: request `bill_date`/`discount_type`+`value`/`tax_rate`; response `bill_number`→`number`, `product_name`, `contact_code`, totals |
| 2 | A13-176/177/178/179 | ✅ Done | List server-side search/status(CSV)/date/per_page; error+retry state; backend `applyListStatus` CSV-aware + test |
| 3 | A13-163 | ✅ Done | `validateVendorBillLines` (Zod): produk/kategori, deskripsi, qty>0, harga≥0; error nested per row |
| 4 | A13-165 | ✅ Done | `vendorBillSourceApi.ts`: cari PO/GR eligible, preview sisa qty; tombol eksplisit (bukan immediate-POST) |
| 5 | A13-167 | ✅ Done | `ConfirmDialog.tsx` (shared); approve & post lewat dialog rangkum dampak |
| 6 | A13-171/162-followup | ⏳ | Field hilang + **gap runtime: label produk per-line tidak preload** (lihat §6) |
| 7 | A13-172 | ⏳ | Cross-date: `due_date ≥ bill_date` |
| 8 | A13-174 | ⏳ | Error/not-found detail + map field error backend ke form |
| 9 | A13-166 | ⏳ | Permission guard |
| 10 | A13-168 | ⏳ | Vendor deposit workflow (apply/refund + applied deposit saat post) |
| 11 | A13-175 | ⏳ | Accessibility (label `htmlFor`, accessible name) |

Setelah Vendor Bill tuntas → replikasi pola adapter ke 6 resource lain (A13-161/162 masih open untuk PR/PO/GR/Deposit/Payment/Return).

---

## 6. Gap Runtime Ditemukan Saat Playwright (2026-06-26)

### GAP-30-001 — Label produk per-line tidak preload di detail/edit

**Finding terkait**: A13-162 follow-up (response adapter sudah benar, tapi rendering belum)  
**Ditemukan**: validasi Playwright Step 1–5, bill detail company 2  
**Gejala**: Data produk per-line dari adapter (`line.product.name`) terbawa ke state `lines`, tapi `SearchableSelect` pada kolom produk di `LineItemsTable` **tidak diberi prop `selectedOptions`** — sehingga saat form dimuat ulang (edit/detail), dropdown tampil kosong meski data ada.  
**Penyebab**: `VendorBillFormPage.tsx` memetakan `bill.lines` ke `EditableLine` (sudah dapat `product_id`), tapi `SearchableSelect` di kolom `product` tidak menerima `selectedOptions=[{ value: l.product_id, label: l.product.name }]`.  
**Acceptance**: di detail/edit bill, nama produk tampil di tiap baris tanpa perlu user mengetik ulang.  
**Fix**: tambah `selectedOptions` ke `SearchableSelect` produk dan kategori-aset per-line (digabung ke Langkah 6 A13-171).
