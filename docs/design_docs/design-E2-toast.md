# E2 — Toast Notification

> Feedback singkat untuk aksi yang berhasil, gagal, atau perlu perhatian.

---

## Anatomi per Tipe

```
SUCCESS
┌─────────────────────────────────────────┐
│ ✓  Invoice berhasil diposting           │ ×
└─────────────────────────────────────────┘
bg #f0fdf4 | border-left 3px solid #22c55e | icon color #16a34a

ERROR
┌─────────────────────────────────────────┐
│ ✕  Gagal menyimpan. Customer wajib diisi│ ×
└─────────────────────────────────────────┘
bg #fef2f2 | border-left 3px solid #ef4444 | icon color #dc2626

WARNING
┌─────────────────────────────────────────┐
│ ⚠  Periode akuntansi akan ditutup       │ ×
└─────────────────────────────────────────┘
bg #fffbeb | border-left 3px solid #f59e0b | icon color #d97706

INFO
┌─────────────────────────────────────────┐
│ ℹ  Data berhasil disinkronkan           │ ×
└─────────────────────────────────────────┘
bg #eff6ff | border-left 3px solid #3b82f6 | icon color #2563eb
```

---

## Spesifikasi Container

```
position      : fixed bottom-4 right-4 z-[100]
display       : flex flex-col gap-2
max-width     : 360px
min-width     : 280px
```

---

## Toast Item

```
bg            : sesuai tipe (lihat atas)
border        : 1px solid rgba(0,0,0,0.06)
border-left   : 3px solid (warna tipe)
border-radius : 8px
padding       : 12px 14px
display       : flex items-start gap-10px
box-shadow    : 0 4px 12px rgba(0,0,0,0.10)

Icon:
  size        : 16px
  flex-shrink : 0
  margin-top  : 1px

Text:
  font        : 13px
  color       : #24323a
  line-height : 1.4
  flex        : 1

Dismiss (×):
  size        : 16px
  color       : #94a3b8
  hover color : #64748b
  flex-shrink : 0
  cursor      : pointer
```

---

## Behavior

```
Posisi        : pojok kanan bawah, di atas bottom bar
Stack max     : 3 toast sekaligus (yang keempat replace yang pertama)
Animasi masuk : slide-in dari kanan (translateX 100% → 0), 200ms ease-out
Animasi keluar: fade-out + slide-right, 150ms ease-in

Auto-dismiss:
  success     : 3 detik
  info        : 3 detik
  warning     : 4 detik
  error       : 5 detik (lebih lama karena perlu dibaca)

Hover pause   : timer pause saat mouse hover di atas toast
```

---

## Progress Bar (Opsional)

```
Tampil di bawah text (dalam toast item)
height        : 2px
bg default    : rgba(0,0,0,0.08)
bg progress   : warna tipe (lebih gelap)
border-radius : 0 0 0 8px (kiri bawah)
Animasi       : lebar shrink dari 100% → 0% sesuai durasi auto-dismiss
```
