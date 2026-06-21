# E3 — VoidConfirmDialog

> Dialog konfirmasi sebelum melakukan aksi void dokumen.
> Aksi destruktif — desain harus jelas tapi tidak panik berlebihan.

---

## Anatomi

```
┌──────────────────────────────────────────┐
│                                          │
│  ⚠  Void Dokumen                         │
│                                          │
│  Anda akan membatalkan INV-2026-001.     │
│  Tindakan ini tidak dapat dibatalkan.    │
│                                          │
│  Alasan void *                           │
│  ┌──────────────────────────────────┐   │
│  │ Masukkan alasan void...          │   │
│  └──────────────────────────────────┘   │
│  Minimal 10 karakter                    │
│                                          │
│        [Batal]    [Void Dokumen]         │
│                                          │
└──────────────────────────────────────────┘
```

---

## Spesifikasi Dialog

```
Komponen      : Shadcn Dialog
max-width     : 400px
border-radius : 12px
padding       : 24px

Tidak bisa di-dismiss:
  - klik backdrop → tidak menutup
  - tekan Escape → tidak menutup
  (user harus pilih Batal atau Void)
```

---

## Header

```
display       : flex items-center gap-10px
margin-bottom : 8px

Icon TriangleAlert:
  size        : 20px
  color       : #f59e0b (amber)

Title "Void Dokumen":
  font        : 16px, font-weight 600, color #24323a
```

---

## Body Text

```
"Anda akan membatalkan {nomor dokumen}."
font          : 14px, color #64748b
margin-bottom : 4px

"Tindakan ini tidak dapat dibatalkan."
font          : 13px, color #94a3b8
margin-bottom : 20px
```

---

## Input Alasan

```
Label: "Alasan void *"
  font        : 11px, font-weight 600, color #64748b, uppercase

Textarea:
  min-height  : 80px
  border      : 1px solid #d9e2e5
  border-radius: 6px
  padding     : 8px 10px
  font        : 13px, color #24323a
  placeholder : "Masukkan alasan void..."
  resize      : vertical

  focus:
    border-color: #5c9ead
    box-shadow  : 0 0 0 3px rgba(92,158,173,0.12)

  error (kurang 10 karakter):
    border-color: #ef4444

Helper text:
  "Minimal 10 karakter ({n}/10)"
  font        : 11px, color #94a3b8
  margin-top  : 4px

  error:
    color     : #ef4444
```

---

## Footer Tombol

```
display       : flex justify-end gap-8px
margin-top    : 20px

[Batal]:
  variant     : outline
  color       : #64748b
  border      : 1px solid #d9e2e5
  hover bg    : #f8fbfc

[Void Dokumen]:
  bg          : #dc2626 (red-600)
  color       : #ffffff
  border      : 0
  hover bg    : #b91c1c
  disabled    : opacity 40% saat reason < 10 karakter

  Loading state:
    spinner + "Memvoid..."
    tombol Batal disabled
```
