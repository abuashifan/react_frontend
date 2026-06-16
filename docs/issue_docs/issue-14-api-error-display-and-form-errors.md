# Issue-14 — API Error Display and Form Errors

**Tipe**: Error handling UX + validation mapping  
**Severity**: Medium  
**Sumber**: Audit-11 A11-17  
**Status**: Selesai parsial — Phase 17 shared helper

---

## Ringkasan

Banyak page menangkap error API dengan toast generik seperti `Gagal menyimpan data`, sehingga pesan validasi Laravel dan detail field hilang.

---

## Root Cause

- `catch { toast.error(...) }` mengabaikan `ApiError.message`.
- Laravel 422 biasanya mengirim `errors` per field.
- React Hook Form belum selalu menerima mapping field error dari response.

---

## Area Terkena

```text
src/services/http.ts
src/hooks/useToast.ts
src/modules/**/pages/*FormPage.tsx
src/modules/**/hooks/*.ts
src/modules/**/services/*Api.ts
```

---

## Prinsip Fix

- Buat helper shared untuk ekstrak pesan error user-facing.
- Untuk form, map Laravel validation errors ke `setError()` React Hook Form jika field name cocok.
- Jika field name backend berbeda dari UI DTO, adapter harus menyediakan mapping field error.
- Toast tetap singkat, detail field tampil dekat input.

---

## Acceptance Criteria

- 422 menampilkan pesan validasi backend yang relevan.
- Field error muncul di input terkait bila mapping tersedia.
- Error 401/403/404/500 punya pesan yang jelas dan tidak menyesatkan.
- Tidak ada catch kosong yang membuang error tanpa alasan.
- Build sukses setelah implementasi.

## Catatan Implementasi Phase 17

- Ditambahkan `src/lib/apiError.ts` untuk menjaga `message`, `errors`, deteksi 404, dan mapping Laravel validation errors ke React Hook Form.
- `JournalFormPage` memakai helper ini untuk save/action error.
- Migrasi semua form lama ke helper yang sama masih bisa dilakukan bertahap saat modul-modul tersebut disentuh kembali.
