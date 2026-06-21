# Design N2 — Opening Balance Module

**Module**: Opening Balance (`/opening-balance`)  
**Pattern**: Workspace dengan line editor, mirip Stock Opname

---

## Overview

Opening Balance adalah proses satu kali saat setup awal perusahaan — memasukkan saldo awal semua akun sebelum mulai transaksi di sistem.

---

## N2-A: Opening Balance Status Page (`/opening-balance`)

```
WorkspaceLayout
  title: "Saldo Awal"
  breadcrumb: [Saldo Awal]

Status Banner (full-width card)
  - Status: [Belum Dimulai / Draft / Diposting / Dikunci]
  - Jumlah akun dengan saldo: X
  - Total debit: Rp X | Total kredit: Rp X
  - Selisih: Rp X (merah jika > 0, hijau jika = 0)

Action Buttons:
  - Jika belum ada batch → [Mulai Input Saldo Awal] (POST /opening-balance/batches)
  - Jika draft → [Lanjutkan Input] (link ke batch page)
  - Jika posted/locked → [Lihat Detail] | [Buka Kembali] (permission: opening_balance.reopen)
```

---

## N2-B: Opening Balance Batch Page (`/opening-balance/:batchId`)

### Layout

```
WorkspaceLayout
  title: "Input Saldo Awal"
  breadcrumb: [Saldo Awal] > [Batch #X]

Status bar:
  - Status batch: draft / validated / posted / locked
  - Tombol: [Refresh] [Validasi] [Preview] [Posting] [Kunci]
```

### Tabel Baris Saldo

```
Tabel dengan kolom:
  - [checkbox] (untuk multi-select)
  - Kode Akun
  - Nama Akun
  - Tipe (Debit/Kredit berdasarkan normal balance akun)
  - Saldo Awal (input number, editable inline)
  - Keterangan (input text, editable inline)

Footer tabel:
  - Total Debit: Rp X
  - Total Kredit: Rp X
  - Selisih: Rp X (merah/hijau)

Action bar bawah:
  - [Simpan Baris] → PUT /opening-balance/batches/{batch}/lines
  - [Validasi] → POST /opening-balance/batches/{batch}/validate
```

### Alur Status

```
draft → (validasi) → validated → (preview OK) → (posting) → posted → (lock) → locked
         ↑ error kembali ke draft               ↑ bisa reopen
```

### Preview Sheet

Drawer/modal yang menampilkan jurnal yang akan dibuat:
```
Jurnal Opening Balance Preview
  Lines:
    [Kode] [Nama Akun]     Debit      Kredit
    1-1000  Kas            Rp 10jt
    2-1000  Modal Awal                Rp 10jt
  Total:                   Rp 10jt    Rp 10jt

  [Batal] [Konfirmasi Posting]
```

---

## N2-C: States

| Status | UI |
|--------|----|
| draft | Tabel editable, semua tombol tersedia |
| validated | Tabel read-only, tombol Preview + Posting aktif |
| posted | Tabel read-only, hanya Kunci dan Buka Kembali |
| locked | Tabel read-only, hanya Buka Kembali (jika ada permission) |

---

## N2-D: Integrasi Onboarding

Saat Step 5 (Opening Balance) di Onboarding Wizard:
- Tombol "Input Saldo Awal" membuka `/opening-balance` di tab baru atau redirect
- Onboarding wizard cek `GET /setup/opening-balance/preview` untuk validasi sebelum finalize
