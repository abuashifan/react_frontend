# B — Auth Pages

> Referensi desain untuk halaman autentikasi.
> Halaman ini di luar AppShell — tidak ada Topbar, Ribbon, atau Virtual Tabs.

---

## B1 — Login Page

### Layout: Split Screen

```
┌─────────────────────┬──────────────────────┐
│                     │                      │
│   KIRI (50%)        │   KANAN (50%)        │
│   bg #326273        │   bg #ffffff         │
│                     │                      │
│   [■ Seaside        │                      │
│      Escape ERP]    │   Selamat datang     │
│                     │   kembali            │
│   · Kelola          │                      │
│     penjualan &     │   [email@...      ]  │
│     pembelian       │   [password      👁]  │
│                     │                      │
│   · Akuntansi       │   ☐ Ingat saya       │
│     terintegrasi    │                      │
│                     │   [    Masuk     ]   │
│   · Laporan         │                      │
│     real-time       │                      │
│                     │              v1.0.0  │
│   · Multi           │                      │
│     perusahaan      │                      │
│                     │                      │
└─────────────────────┴──────────────────────┘
```

### Sisi Kiri — Branding Panel

```
bg              : #326273
padding         : 48px
display         : flex flex-col justify-between

Konten atas:
  Logo mark     : rounded square 32x32, bg #5c9ead, border-radius 8px
  Gap           : 12px
  Product name  : "Seaside Escape ERP" — 20px, font-weight 600, color #ffffff
  margin-bottom : 48px

Feature list (4 item):
  Layout        : flex flex-col gap-5
  Setiap item   : flex items-start gap-3
  Icon          : Lucide 18px, color rgba(255,255,255,0.7), flex-shrink-0, mt-0.5
  Text          : 14px, color rgba(255,255,255,0.85), line-height 1.5

  Item 1 : [ShoppingCart] "Kelola penjualan dan pembelian dalam satu platform"
  Item 2 : [BookOpen]     "Akuntansi terintegrasi otomatis"
  Item 3 : [BarChart2]    "Laporan keuangan real-time"
  Item 4 : [Building2]    "Mendukung multi-perusahaan"

Konten bawah:
  text          : "© 2026 Seaside Escape" — 11px, color rgba(255,255,255,0.4)
```

### Sisi Kanan — Form Panel

```
bg              : #ffffff
padding         : 48px
display         : flex flex-col justify-center
max-width form  : 360px, centered horizontal dalam panel

Heading:
  "Selamat datang kembali"
  font: 22px, font-weight 600, color #24323a
  margin-bottom: 6px

Sub-heading:
  "Masuk ke akun Anda untuk melanjutkan"
  font: 14px, color #64748b
  margin-bottom: 32px

Form fields:
  gap antar field: 16px

  Email field:
    label   : "Email" — 11px, font-weight 600, color #64748b, uppercase, letter-spacing .04em
    input   : h=36px, border 1px solid #d9e2e5, border-radius 6px, px-3, font 14px
    focus   : border-color #5c9ead, box-shadow 0 0 0 3px rgba(92,158,173,0.12)
    error   : border-color #ef4444, text error 12px color #ef4444 di bawah field

  Password field:
    label   : "Password"
    input   : sama dengan email + icon toggle show/hide di kanan (EyeOff/Eye 16px, color #64748b)
    toggle  : absolute right-3, cursor pointer, hover color #326273

  Ingat saya:
    layout  : flex items-center gap-2
    checkbox: Shadcn Checkbox, accent-color #5c9ead
    label   : "Ingat saya" — 13px, color #64748b
    margin-top: 4px

Tombol Masuk:
  width       : 100%
  height      : 40px
  bg          : #e39774
  hover bg    : #d4845e
  color       : #ffffff
  font        : 14px, font-weight 600
  border-radius: 6px
  margin-top  : 24px
  shadow      : 0 2px 6px rgba(227,151,116,0.3)
  loading     : spinner kiri + text "Memproses..."

Versi app:
  position    : absolute bottom-6 right-6
  text        : "v1.0.0" — 10px, color #d9e2e5
```

### Error States

```
401 (email/password salah):
  → field/form-level auth error
  → toast: "Login gagal. Periksa kembali email dan password Anda."
  → fokus kembali ke password field

422 (validation error):
  → field terkait highlight merah
  → error text dari response validation di bawah field

403 (akun nonaktif):
  → toast error: "Akun Anda telah dinonaktifkan. Hubungi administrator."

Network error:
  → toast error: "Tidak dapat terhubung ke server. Periksa koneksi Anda."

Session expired (redirect dari auto-logout):
  → banner kuning di atas form:
    bg #fffbeb | border 1px solid #fde68a | border-radius 6px | padding 10px 12px
    text: "Sesi Anda telah berakhir karena tidak aktif. Silakan login kembali."
    font: 12px | color #92400e
```

### Responsive

```
Tablet+ (768px+) : split screen 50/50
Mobile (<768px)  : single column
  - Panel kiri collapsed: hanya logo + nama, height auto, padding 24px
  - Panel kanan: full width, padding 24px
```

### Validation (Zod)

```typescript
const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
  remember_me: z.boolean().default(false),
})
```

---

## B2 — Company Picker Page

### Layout

```
bg halaman: #EFEFED (page-bg)

┌─────────────────────────────────────────────┐
│           (centered, max-width 720px)        │
│                                              │
│  [■ Seaside Escape ERP]    ← logo + nama    │
│                                              │
│  Pilih Perusahaan                            │
│  Masuk sebagai: andi@example.com             │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  [icon]  │  │  [icon]  │  │  [icon]  │   │
│  │ PT Maju  │  │ CV Surya │  │ UD Berkah│   │
│  │ Jaya Gas │  │ Abadi    │  │ Makmur   │   │
│  │ 2 jam lalu│  │ Kemarin  │  │ 3 hr lalu│  │
│  └──────────┘  └──────────┘  └──────────┘   │
│                                              │
│  ┌──────────┐                                │
│  │  [icon]  │                                │
│  │ PT Sumber│                                │
│  │ Makmur   │                                │
│  │ Bln lalu │                                │
│  └──────────┘                                │
│                                              │
│  [Logout]                                    │
└─────────────────────────────────────────────┘
```

### Header

```
Logo mark + nama: sama dengan login page (kiri)
margin-bottom   : 40px

Heading:
  "Pilih Perusahaan" — 20px, font-weight 600, color #24323a
  margin-bottom: 4px

Sub-heading:
  "Masuk sebagai: {email}" — 13px, color #64748b
  margin-bottom: 24px
```

### Company Card

```
bg            : #ffffff
border        : 1px solid #d9e2e5
border-radius : 10px
padding       : 20px
cursor        : pointer
transition    : border-color .15s, box-shadow .15s

hover:
  border-color  : #5c9ead
  box-shadow    : 0 4px 12px rgba(92,158,173,0.15)

active/click:
  border-color  : #326273
  box-shadow    : 0 0 0 3px rgba(92,158,173,0.2)

loading (setelah klik):
  opacity: 0.7
  cursor: not-allowed
  spinner overlay di tengah card

Layout dalam card:
  display       : flex flex-col items-center text-center gap-12px

  Icon wrapper:
    w=48px h=48px | border-radius 10px | bg #EFF9FB
    icon: Building2, 24px, color #5c9ead

  Nama company:
    font: 14px, font-weight 600, color #24323a
    margin-top: 4px
    max 2 baris, overflow ellipsis

  Last accessed:
    font: 11px, color #64748b
    "Terakhir: {formatTimeAgo}" atau "Belum pernah diakses"
```

### Grid Layout

```
grid-cols: 2 (mobile) | 3 (md 768px+) | 4 (lg 1024px+)
gap: 12px
```

### Urutan Card

```
Urutkan dari yang paling baru diakses ke yang paling lama.
Belum pernah diakses → taruh di akhir.
```

### Tombol Logout

```
position      : di bawah grid, margin-top 32px
style         : text button (tidak ada border/bg)
label         : "Logout"
font          : 13px, color #64748b
hover         : color #991B1B
icon          : LogOut 14px di kiri label
```

---

## B3 — Session Timeout Warning Dialog

### Trigger

Muncul 5 menit sebelum sesi berakhir karena idle.

### Layout (Shadcn Dialog)

```
max-width   : 360px
text-align  : center
border-radius: 12px

Header:
  icon  : AlertTriangle 20px, color #f59e0b (amber)
  title : "Sesi Akan Berakhir" — 16px, font-weight 600

Body:
  text  : "Anda tidak aktif. Sesi akan berakhir dalam:"
          13px, color #64748b, margin-bottom 12px

  Countdown:
    font  : 36px, font-weight 700, tabular-nums, color #24323a
    format: MM:SS (misal "04:32")

  Warning:
    "⚠️ Data yang belum disimpan akan hilang."
    font: 12px, color #92400e, margin-top 8px

Footer (2 tombol):
  [Logout Sekarang]   ← variant outline, flex-1
  [Lanjutkan Sesi]    ← bg #5c9ead, color white, flex-1

  gap: 8px
```

### Behavior

```
- Dialog tidak bisa di-dismiss dengan klik backdrop atau Esc
- Tidak ada tombol X / close icon
- Klik "Lanjutkan Sesi" → reset idle timer, tutup dialog
- Klik "Logout Sekarang" → logout + redirect /login
- Countdown habis (00:00) → auto logout + redirect /login
  dengan state: { reason: 'session_expired' }
```
