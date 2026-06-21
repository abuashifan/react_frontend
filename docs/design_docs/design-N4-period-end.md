# Design N4 — Period-End Processing

**Module**: Accounting → Akhir Periode (`/accounting/period-end`)  
**Pattern**: Status + checklist + action page (satu halaman)

---

## Overview

Period-End Processing adalah proses penutupan periode akuntansi (biasanya bulanan):
menjalankan depresiasi, accrual, rekonsiliasi otomatis, dll.

---

## Layout Page

```
WorkspaceLayout
  title: "Proses Akhir Periode"
  breadcrumb: [Buku Besar] > [Akhir Periode]

── Bagian Atas: Selector & Status ──
  [Pilih Periode: YYYY-MM selector]  [Cek Status]

Status Card:
  - Periode: Januari 2026
  - Status: [Belum Dijalankan / Sedang Berjalan / Selesai / Dibuka Kembali]
  - Terakhir dijalankan: 2026-01-31 14:23 oleh Admin

── Bagian Tengah: Checklist ──
  List item per checklist:
  ┌─────────────────────────────────────────────────────────┐
  │ ✅  Semua jurnal di periode sudah diposting             │
  │ ✅  Rekonsiliasi bank selesai                           │
  │ ⚠️  Depresiasi aktiva tetap belum dijalankan           │
  │ ✅  Saldo AR sudah direkonsiliasi                       │
  │ ✅  Saldo AP sudah direkonsiliasi                       │
  └─────────────────────────────────────────────────────────┘

  Status item:
  - ✅ (hijau) = selesai
  - ⚠️ (amber) = ada yang kurang / warning
  - ❌ (merah) = belum selesai / blocker

── Bagian Bawah: Actions ──
  [Buka Kembali] (hanya jika sudah selesai, permission: period_end.reopen)
  [Jalankan Proses Akhir Periode] (hanya jika belum dijalankan, permission: period_end.run)
```

---

## Konfirmasi Dialog

Sebelum POST `/accounting/period-end/run`:

```
Dialog: Konfirmasi Proses Akhir Periode
  ⚠️ Proses ini akan:
  - Menghitung dan membuat jurnal depresiasi aktiva tetap
  - Menutup periode akuntansi
  - Memblokir jurnal baru untuk periode ini

  Periode: Januari 2026
  
  [Batal] [Ya, Jalankan Proses]
```

---

## Period Selector

```tsx
// Bukan date picker — hanya YYYY-MM
<select>
  <option value="2026-01">Januari 2026</option>
  <option value="2025-12">Desember 2025</option>
  ...
</select>
```

Atau gunakan 2 select: [Bulan] [Tahun].

---

## Ribbon Item

Tambahkan ke Accounting ribbon:
```ts
{ id: 'period-end', label: 'Akhir Periode', icon: CheckCircle2, path: '/accounting/period-end', permission: 'period_end.view' }
```
