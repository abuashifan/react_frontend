# Issue-12 — SearchableSelect Selected Options Audit

**Tipe**: Shared component usage bug  
**Severity**: Medium  
**Sumber**: Audit-11 A11-15, design-C3  
**Status**: Belum selesai

---

## Ringkasan

`SearchableSelect` tidak bisa menampilkan label hanya dari ID. Halaman edit/detail yang sudah punya value harus mengirim `selectedOptions` dari relation backend atau dari preloaded option.

Gejala paling terlihat ada di Journal detail: akun line kosong walaupun `account_id` ada.

---

## Root Cause

- Value form hanya menyimpan ID.
- Option search bersifat async dan belum tentu memuat item selected saat page dibuka.
- Jika `selectedOptions` tidak diberikan, komponen tidak punya label untuk value existing.

---

## Area yang Perlu Diaudit

```text
src/modules/accounting/pages/JournalFormPage.tsx
src/modules/master-data/pages/*FormPage.tsx
src/modules/sales/pages/*FormPage.tsx
src/modules/purchase/pages/*FormPage.tsx
src/modules/cash-bank/pages/*FormPage.tsx
src/modules/inventory/pages/*FormPage.tsx
src/modules/onboarding/components/steps/*.tsx
```

Shared component:

```text
src/components/shared/form/SearchableSelect.tsx
```

---

## Prinsip Fix

- Jangan ubah value menjadi object penuh; form payload tetap kirim ID.
- Bentuk `selectedOptions` dari relation response detail.
- Label harus memakai domain label yang jelas, misalnya `account_code - account_name`.
- Jika relation tidak dikirim backend, service detail atau page harus fetch option by ID bila endpoint tersedia.

---

## Acceptance Criteria

- Semua form edit/detail menampilkan label untuk selected value.
- Tidak ada selected select yang tampak kosong padahal field value ada.
- Search async tetap bekerja setelah selected option diberikan.
- Build sukses setelah implementasi.
