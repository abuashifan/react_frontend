# Issue-10 — Journal Totals and Account Labels

**Tipe**: List/detail display bug  
**Severity**: High  
**Sumber**: Audit-11 A11-05  
**Status**: Belum selesai

---

## Ringkasan

Journal list menampilkan total debit/kredit `Rp 0`, sementara detail journal memiliki line debit/kredit. Pada halaman detail, field akun pada baris jurnal juga bisa terlihat kosong walaupun backend mengirim relation account.

---

## Root Cause

1. Backend list journal mengirim header journal tanpa agregat line.
2. Frontend `JournalListPage` membaca `total_debit` dan `total_credit`, lalu fallback ke `0`.
3. Detail backend sudah memuat `lines.account`, tetapi state line frontend hanya menyimpan `account_id`.
4. `SearchableSelect` butuh `selectedOptions` agar label akun bisa ditampilkan dari value yang sudah ada.

---

## File Terkena

```text
src/modules/accounting/types/journalEntry.types.ts
src/modules/accounting/services/journalEntryApi.ts
src/modules/accounting/hooks/useJournalEntryList.ts
src/modules/accounting/pages/JournalListPage.tsx
src/modules/accounting/pages/JournalFormPage.tsx
src/components/shared/form/SearchableSelect.tsx
```

Backend referensi read-only:

```text
/workspace/laravel_backend/app/Modules/Accounting/Services/JournalEntryService.php
/workspace/laravel_backend/app/Modules/Accounting/Routes/api.php
```

---

## Opsi Fix

Opsi ideal:

- Backend list menambahkan agregat `total_debit` dan `total_credit`.
- Frontend type mengikuti response tersebut.

Opsi sementara frontend:

- Jika list response menyertakan `lines`, hitung total dari lines.
- Jika tidak ada aggregate dan tidak ada lines, tampilkan `-` atau status "belum tersedia", bukan `Rp 0` yang menyesatkan.

Untuk label akun:

- Saat load detail, bentuk `selectedOptions` dari `line.account`.
- Pastikan label memakai `account_code - account_name`.

---

## Acceptance Criteria

- Journal list tidak menampilkan `Rp 0` palsu untuk journal yang punya lines.
- Jika aggregate belum tersedia, UI tidak menampilkan angka yang menyesatkan.
- Detail journal menampilkan label akun pada semua line existing.
- Save/update tetap mengirim `account_id`, bukan object account.
- Build sukses setelah implementasi.
