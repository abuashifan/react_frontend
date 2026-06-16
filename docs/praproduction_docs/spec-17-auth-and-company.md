# 17 — Auth & Company

## Login Flow

```
POST /auth/login → { token, user, companies[] }

IF companies.length === 1:
  → simpan token + company_id → navigate ke /dashboard

IF companies.length > 1:
  → simpan token → navigate ke /select-company
```

---

## Login Page

### Layout: Split Screen

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│  KIRI — Branding    │  KANAN — Form       │
│  background #326273 │  background #ffffff  │
│                     │                     │
│  Logo + Nama        │  "Selamat datang    │
│                     │   kembali"          │
│  Feature highlights │                     │
│  · Kelola penjualan │  [Email          ]  │
│    dan pembelian    │  [Password      👁]  │
│  · Akuntansi        │                     │
│    terintegrasi     │  ☐ Ingat saya       │
│  · Laporan          │                     │
│    real-time        │  [     Masuk     ]  │
│  · Multi-perusahaan │                     │
│                     │                     │
│                     │         v1.0.0      │
└─────────────────────┴─────────────────────┘
```

### Spesifikasi

**Sisi kiri:**
- Background: `#326273`
- Logo mark + "Seaside Escape ERP" — text white
- 3-4 feature highlights dengan icon Lucide + deskripsi singkat
- Text color: `rgba(255,255,255,0.85)`

**Sisi kanan:**
- Background: `#ffffff`
- Form centered vertikal
- Field: Email + Password (dengan toggle show/hide)
- Checkbox: "Ingat saya"
- Tombol Masuk: background `#e39774`, full width
- Tidak ada link "Lupa Password" — reset via administrator
- Versi app: pojok kanan bawah, `text-[10px] text-[#d9e2e5]`

**Responsive:**
- Mobile: single column, branding di atas (collapsed), form di bawah
- Tablet+: split screen 50/50

### Validation

```typescript
const loginSchema = z.object({
  email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
  remember_me: z.boolean().default(false),
})
```

### Error States

```typescript
// 401 dari API
toast.error('Email atau password salah.')

// Network error
toast.error('Tidak dapat terhubung ke server.')

// 403 — akun dinonaktifkan
toast.error('Akun Anda telah dinonaktifkan. Hubungi administrator.')
```

## Login Error and Session Dialog Canonical Rules

- Wrong credentials MUST be represented as 401 Unauthorized.
- Validation failure MUST be represented as 422 Unprocessable Entity.
- Frontend MAY normalize legacy backend 422 credential errors into AUTH_INVALID_CREDENTIALS only for compatibility.
- Login schema MUST include `remember_me: z.boolean().default(false)`.
- `remember_me` MUST NOT store password or raw credential secrets in frontend storage.
- Session warning dialog MUST be non-dismissible by Escape/backdrop/close icon.
- Session warning dialog can only resolve through Tetap Masuk, Keluar, or countdown expiry.

---

## Company Picker Page

### Trigger
Muncul setelah login jika user punya 2+ perusahaan.

Route: `/select-company`

### Layout

```
┌─────────────────────────────────────────────┐
│  🌊 Seaside Escape ERP                      │
│                                             │
│  Pilih Perusahaan                           │
│  Masuk sebagai: user@email.com              │
│                                             │
│  ┌──────────────┐  ┌──────────────┐         │
│  │  🏢           │  │  🏢           │         │
│  │  PT Sumber   │  │  CV Maju     │         │
│  │  Makmur Gas  │  │  Bersama     │         │
│  │              │  │              │         │
│  │  2 jam lalu  │  │  Kemarin     │         │
│  └──────────────┘  └──────────────┘         │
│                                             │
│  ┌──────────────┐                           │
│  │  🏢           │                           │
│  │  UD Berkah   │                           │
│  │  Abadi       │                           │
│  │              │                           │
│  │  3 hari lalu │                           │
│  └──────────────┘                           │
│                                             │
│  [Logout]                                   │
└─────────────────────────────────────────────┘
```

### Company Card Specs

```tsx
interface CompanyCardProps {
  company: {
    id: number
    name: string
    last_accessed_at: string | null
  }
  onClick: () => void
}

// Card styling
<div className={cn(
  "bg-white border border-[#d9e2e5] rounded-lg p-5",
  "cursor-pointer transition-all duration-150",
  "hover:border-[#5c9ead] hover:shadow-md",
  "flex flex-col items-center text-center gap-3"
)}>
  <div className="w-12 h-12 rounded-lg bg-[#EFF9FB] flex items-center justify-content-center">
    <Building2 className="w-6 h-6 text-[#5c9ead]" />
  </div>
  <div>
    <p className="font-semibold text-[#24323a] text-sm">{company.name}</p>
    <p className="text-[11px] text-[#64748b] mt-1">
      {company.last_accessed_at
        ? `Terakhir diakses ${formatTimeAgo(company.last_accessed_at)}`
        : 'Belum pernah diakses'}
    </p>
  </div>
</div>
```

**Urutan card:** dari yang paling baru diakses ke yang paling lama.

**Grid:**
```tsx
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
```

---

## Ganti Perusahaan

User harus **logout dulu** untuk ganti perusahaan.

Flow:
```
Topbar kanan → klik avatar → dropdown:
  · [👤 Profil Saya]
  · [─────────────]
  · [🚪 Logout]

Klik Logout:
  → clear token + active_company_id dari store
  → navigate ke /login
  → login ulang → company picker muncul (jika 2+ perusahaan)
```

---

## Session Management

### Auto Logout

Timeout dikonfigurasi per company di Settings → Transaksi.
Pilihan: **15 / 30 / 60 / 120 menit**. Default: **30 menit**.

**Implementation:**

```typescript
// hooks/useSessionTimeout.ts
export function useSessionTimeout() {
  const { logout } = useAuthStore()
  const { settings } = useCompanyStore()
  const timeoutMinutes = settings.session_timeout_minutes ?? 30
  const warningMinutes = 5  // Warning 5 menit sebelum timeout

  useEffect(() => {
    let idleTimer: NodeJS.Timeout
    let warningTimer: NodeJS.Timeout
    let isWarningShown = false

    const resetTimer = () => {
      clearTimeout(idleTimer)
      clearTimeout(warningTimer)
      isWarningShown = false

      // Warning timer
      warningTimer = setTimeout(() => {
        isWarningShown = true
        showSessionWarning()
      }, (timeoutMinutes - warningMinutes) * 60 * 1000)

      // Logout timer
      idleTimer = setTimeout(() => {
        logout()
        navigate('/login', { state: { reason: 'session_expired' } })
      }, timeoutMinutes * 60 * 1000)
    }

    // Reset on user activity
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer()

    return () => {
      clearTimeout(idleTimer)
      clearTimeout(warningTimer)
      events.forEach(e => window.removeEventListener(e, resetTimer))
    }
  }, [timeoutMinutes])
}
```

### Session Warning Dialog

Muncul 5 menit sebelum timeout:

```tsx
<Dialog open={isWarningOpen}>
  <DialogContent className="max-w-sm text-center">
    <DialogHeader>
      <DialogTitle className="flex items-center justify-center gap-2">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        Sesi Akan Berakhir
      </DialogTitle>
    </DialogHeader>

    <div className="py-4">
      <p className="text-sm text-[#64748b] mb-3">
        Anda tidak aktif selama beberapa saat.
        Sesi akan otomatis berakhir dalam:
      </p>
      {/* Countdown real-time */}
      <div className="text-3xl font-bold tabular-nums text-[#24323a]">
        {formatCountdown(secondsRemaining)}
      </div>
      <p className="text-xs text-amber-600 mt-3 font-medium">
        ⚠️ Data yang belum disimpan akan hilang.
      </p>
    </div>

    <DialogFooter className="flex gap-2">
      <Button variant="outline" onClick={handleLogoutNow} className="flex-1">
        Logout Sekarang
      </Button>
      <Button onClick={handleContinue} className="flex-1 bg-[#5c9ead]">
        Lanjutkan Sesi
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Login Page — Session Expired Message

```tsx
// Ketika redirect dari auto logout
const location = useLocation()
const isSessionExpired = location.state?.reason === 'session_expired'

{isSessionExpired && (
  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
    Sesi Anda telah berakhir karena tidak aktif. Silakan login kembali.
  </div>
)}
```

---

## Zustand Auth Store

```typescript
// stores/useAuthStore.ts
interface AuthState {
  token: string | null
  user: User | null
  permissions: string[]
  companies: Company[]
  activeCompanyId: number | null

  // Actions
  setAuth: (token: string, user: User, companies: Company[]) => void
  setActiveCompany: (companyId: number) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      permissions: [],
      companies: [],
      activeCompanyId: null,

      setAuth: (token, user, companies) =>
        set({ token, user, permissions: user.permissions, companies }),

      setActiveCompany: (companyId) =>
        set({ activeCompanyId: companyId }),

      logout: () =>
        set({ token: null, user: null, permissions: [], activeCompanyId: null }),
    }),
    {
      name: 'seaside-auth',
      // Remember me: jika tidak dicentang, pakai sessionStorage
      storage: createJSONStorage(() =>
        rememberMe ? localStorage : sessionStorage
      ),
    }
  )
)
```
