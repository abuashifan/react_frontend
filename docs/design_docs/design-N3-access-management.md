# Design N3 — Access Management (Settings Refactor)

**Module**: Settings (`/settings/*`)  
**Scope**: Refactor UsersPage, RolesPage + tambah InvitationsPage, AccessAuditPage

---

## N3-A: Users Page (`/settings/users`) — Refactor

### Perubahan dari Phase 7

Phase 7 punya tombol "Tambah Pengguna" yang POST ke `/settings/users`.  
Backend tidak punya endpoint create user langsung — harus via undangan.

### Layout Baru

```
WorkspaceLayout
  title: "Pengguna"
  action: [+ Undang Pengguna] (permission: access.invitations.create)
          [Undangan Aktif: X] link ke /settings/invitations

Search: [cari nama/email]

DataTable:
  Kolom:
  - Nama (klik → open dialog detail)
  - Email
  - Peran
  - Status (Aktif / Nonaktif / Menunggu Undangan)
  - Login Terakhir
  - Aksi: [Ubah Peran] [Nonaktifkan / Aktifkan] [Hapus dari Company]
```

### Dialog Detail User

```
Sheet/Drawer dari kanan:
  Header: foto/inisial, nama, email
  
  Section "Peran":
    - Select role (PATCH /access/company-users/{id}/role)
  
  Section "Permission Override" (permission: access.permissions.view):
    - Tampilkan permission override yang berbeda dari role default
    - [Edit Permission Override] → buka dialog checkbox tree
    - [Copy Akses dari User Lain] → dropdown user lain
    - [Reset ke Default Role]
  
  Section "Aksi":
    - [Nonaktifkan] / [Aktifkan] (permission: access.users.deactivate / manage)
    - [Hapus dari Company] (permission: access.users.remove) — dengan confirm dialog
```

---

## N3-B: Roles Page (`/settings/roles`) — Refactor

### Perubahan dari Phase 7

Phase 7: list role → pilih → checkbox tree permission.  
Tambahan: buat role baru, clone role, deactivate/reactivate role.

### Layout Baru

```
WorkspaceLayout
  title: "Peran & Hak Akses"
  action: [+ Buat Peran Baru] (permission: access.roles.create)

Panel kiri (Role List):
  - Daftar role dengan status (aktif/nonaktif)
  - Badge: jumlah users dengan role ini
  - Action: [⋮ Clone] [Nonaktifkan]
  - [+ Buat Peran Baru] di footer

Panel kanan (Permission Editor):
  - Nama role (editable inline jika punya edit permission)
  - Deskripsi (editable)
  - [Simpan] button
  - Separator
  - Checkbox tree permission per group (sama seperti Phase 7)
  - [Simpan Izin] button (PUT /access/roles/{id}/permissions)
```

### Dialog Buat Peran Baru

```
Modal:
  - Nama Peran*
  - Deskripsi
  - Clone dari: [— Mulai kosong —] atau pilih role yang ada
  - [Batal] [Buat Peran]
```

---

## N3-C: Invitations Page (`/settings/invitations`) — Baru

```
WorkspaceLayout
  title: "Undangan"
  action: [+ Kirim Undangan] (permission: access.invitations.create)

DataTable:
  Kolom:
  - Email
  - Peran yang Diundang
  - Dikirim Oleh
  - Tanggal Dikirim
  - Kedaluwarsa
  - Status (pending / accepted / expired / revoked)
  - Aksi:
    [Kirim Ulang] (permission: access.invitations.resend, hanya jika pending)
    [Batalkan] (permission: access.invitations.revoke, hanya jika pending)
```

### Dialog Kirim Undangan

```
Modal:
  - Email*
  - Peran: Select dari roles list
  - Pesan personal (optional)
  - [Batal] [Kirim Undangan]
```

---

## N3-D: Access Audit Page (`/settings/audit`) — Baru

```
WorkspaceLayout
  title: "Audit Akses"
  breadcrumb: [Pengaturan] > [Audit Akses]

FilterSection (inline, bukan sidebar):
  - User: SearchableSelect
  - Tipe event: Select [Semua, Login, Logout, Permission change, Role change, dll]
  - Date range

DataTable:
  Kolom:
  - Waktu (tabular-nums)
  - User
  - Tipe Event
  - Detail (deskripsi singkat)
  - IP Address

Tidak ada pagination manual — pakai infinite scroll atau standard pagination
```

---

## N3-E: Company Settings Page — Refactor Split

### Tab atau Section

Karena backend memisahkan update ke 3 endpoint berbeda, UI sebaiknya ikuti:

```
CompanySettingsPage dengan tabs:
  Tab 1: Profil Perusahaan
    - Nama, Nama Legal, NPWP, Telepon, Email, Alamat
    - → GET /settings/company (read)
    - Tidak ada update endpoint untuk ini! (perlu konfirmasi backend)

  Tab 2: Akuntansi
    - Mata Uang, Awal Tahun Fiskal
    - → PATCH /settings/company/accounting

  Tab 3: Transaksi
    - Auto-post, approval required per dokumen, number formats
    - → PATCH /settings/company/transaction-defaults

  Tab 4: Modul Aktif
    - Toggle: Fixed Assets, Multi-Currency, dll
    - → PATCH /settings/company/modules
```

---

## N3-F: My Preferences Page — Simplified

Hapus preferences (tidak ada backend endpoint).  
Sisakan hanya:

```
WorkspaceLayout title: "Preferensi Saya"

Section "Ganti Password":
  - Password saat ini*
  - Password baru* (min 8 karakter)
  - Konfirmasi password baru*
  - [Ganti Password] → POST /auth/change-password (perlu konfirmasi apakah endpoint ini ada)
```
