# D3 — Fixed Bottom Bar (Action Bar)

> Bar aksi di bawah form dokumen.
> Tombol yang muncul ditentukan oleh status dokumen + permission user.

---

## Anatomi

```
┌─────────────────────────────────────────────────────────────┐
│  INV-2026-001 · Draft              [Batal] [Simpan] [Post] │
└─────────────────────────────────────────────────────────────┘
h=56px | bg=#ffffff | border-top 1px solid #d9e2e5 | px-6
position: fixed bottom-0 left-0 right-0 z-40
```

---

## Layout

```
Kiri:
  Nomor dokumen  : font 13px, font-weight 600, color #24323a
  Separator " · ": color #d9e2e5
  Status badge   : DocumentStatusBadge size sm

Kanan:
  Action buttons : flex gap-2
  Urutan kiri→kanan: Destructive | Secondary | Primary
```

---

## Tombol per Status Dokumen

### Auto-Post ENABLED (setting perusahaan)

```
Form baru / draft + punya permission create:
  [Post]  ← primary

posted + tidak ada dependence + punya permission void:
  [Void]  ← destructive

posted + ada dependence posted:
  (tidak ada tombol) ← locked

void:
  (tidak ada tombol)
```

### Auto-Post DISABLED

```
Form baru / draft + permission create:
  [Simpan Draft]  ← secondary

Form baru / draft + permission create + permission post:
  [Simpan Draft]  [Post]

Form baru / draft + permission create + permission approve:
  [Simpan Draft]  [Approve]

approved + permission post:
  [Tolak]  [Post]

approved + permission reject only:
  [Tolak]

posted + permission void + tidak ada dependence:
  [Void]

posted + ada dependence / void:
  (tidak ada tombol)
```

---

## Spesifikasi Tombol

```
height        : 32px (semua tombol)
border-radius : 6px
font          : 13px, font-weight 500
padding       : 0 16px

PRIMARY (Post, Approve):
  bg          : #e39774
  color       : #ffffff
  border      : 0
  hover bg    : #d4845e
  shadow      : 0 2px 6px rgba(227,151,116,0.3)
  loading     : spinner + "Memproses..."

SECONDARY (Simpan Draft):
  bg          : #ffffff
  color       : #326273
  border      : 1px solid #d9e2e5
  hover bg    : #f8fbfc
  hover border: #5c9ead

OUTLINE-NEUTRAL (Batal, Tolak):
  bg          : #ffffff
  color       : #64748b
  border      : 1px solid #d9e2e5
  hover bg    : #f8fbfc

DESTRUCTIVE (Void):
  bg          : #ffffff
  color       : #991B1B
  border      : 1px solid #fecaca
  hover bg    : #fef2f2
  hover border: #ef4444
```

---

## Loading State

```
Saat button diklik → loading state:
  spinner  : 14px, animate-spin, color inherit
  text     : "Memproses..."
  disabled : semua tombol lain disabled (opacity 50%, cursor not-allowed)
  pointer-events: none
```

---

## Visibility Rules

```
TAMPIL  : secondary tab form aktif (bukan "Daftar")
HIDDEN  : secondary tab "Daftar" aktif (list view)
HIDDEN  : dokumen system-generated
HIDDEN  : dokumen void/locked tanpa aksi tersedia
```

---

## Batal Button

```
Selalu ada saat form dalam edit mode (draft/baru)
Klik Batal:
  Jika form bersih (tidak ada perubahan) → tutup secondary tab langsung
  Jika ada perubahan → dialog konfirmasi:
    "Ada perubahan yang belum disimpan. Keluar tanpa menyimpan?"
    [Tetap di sini]  [Keluar tanpa simpan]
```
