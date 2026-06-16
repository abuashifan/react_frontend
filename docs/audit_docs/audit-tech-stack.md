# Tech Stack — ERP Backend & Frontend

> Dokumen ini adalah referensi stack teknologi yang digunakan dalam project ERP.
> Dibuat berdasarkan audit backend (`01-architecture-overview.md`) dan struktur project aktual.
> Update dokumen ini setiap kali ada perubahan dependency mayor.

---

## Backend

### Runtime & Framework

| Komponen | Versi | Keterangan |
|---|---|---|
| PHP | 8.3 | Strict types dipakai di seluruh service |
| Laravel | 11.x | Framework utama |
| Laravel Sanctum | bundled | API token auth |

### Database & Cache

| Komponen | Versi | Keterangan |
|---|---|---|
| MySQL | 8.0+ | Central DB (users, companies, fiscal years) + Tenant DB per company |
| Redis | 7.x | Cache, session, queue |

### Arsitektur Multi-Tenancy

```
Central DB   : users, companies, company_users, fiscal_years, accounting_periods
Tenant DB    : semua transaksi bisnis + master data per company
Koneksi      : TenantConnectionManager — set runtime via EnsureCompanyAccess middleware
Header wajib : X-Company-ID (setiap request bisnis)
```

### Key Package Backend

| Package | Fungsi |
|---|---|
| `laravel/sanctum` | API token authentication |
| `spatie/laravel-permission` | RBAC — route middleware `permission:*` |
| `spatie/laravel-query-builder` | Filter/sort/include untuk index endpoint |

> **Catatan:** Selalu cek `composer.json` di repo untuk versi eksak setiap package.

### Struktur Direktori Backend

```
app/
├── Http/
│   ├── Controllers/Api/       # Thin controllers — delegate ke Service
│   ├── Middleware/
│   │   ├── EnsureCompanyAccess.php   # Set TenantContext + koneksi tenant
│   │   └── ...
│   └── Requests/              # FormRequest per modul
├── Models/
│   ├── Central/               # User, Company, FiscalYear, AccountingPeriod
│   └── Tenant/                # Semua model bisnis (koneksi 'tenant')
├── Modules/                   # Route modular
│   ├── Sales/Routes/api.php
│   ├── Purchase/Routes/api.php
│   ├── Inventory/Routes/api.php
│   └── ...
├── Services/
│   ├── Sales/
│   ├── Purchase/
│   ├── Inventory/
│   ├── Journal/
│   ├── Reports/
│   ├── Tenant/
│   │   ├── TenantContext.php
│   │   └── TenantConnectionManager.php
│   ├── Transactions/
│   │   ├── TransactionDateGuardService.php
│   │   └── TransactionVoidEffectService.php
│   └── Validation/
│       └── BusinessReferenceValidator.php
├── Support/
│   └── Api/
│       └── ApiResponseBuilder.php
└── Exceptions/
    └── ApiException.php

config/
├── account_mappings.php       # Mapping akun kritis — jangan hardcode account_id
├── inventory.php              # allow_negative_stock, movement types, avg cost
├── sales_workflow.php         # Status/reportable sales
├── purchase_workflow.php      # Status/reportable purchase
├── transaction_lifecycle.php  # Status journal/transaksi
├── source_links.php           # Source type/module registry
├── report_visibility.php      # Filter journal posted untuk laporan
└── document_numbers.php       # Prefix nomor dokumen per modul

database/
└── migrations/
    ├── central/               # Migrasi untuk central DB
    └── tenant/                # Migrasi untuk tenant DB
```

### Response Format API

```json
// Success
{
  "success": true,
  "message": "...",
  "data": { ... },
  "meta": { ... }
}

// Error
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "...",
  "errors": { ... },
  "meta": { ... }
}
```

### Config Penting — Inventory

```php
// config/inventory.php
'allow_negative_stock'   => false,   // JANGAN diubah tanpa pertimbangan
'costing_method'         => 'average',
// movement types yang diizinkan ada di StockMovementValidationService::ALLOWED_MOVEMENT_TYPES
// transfer_in/transfer_out ada di config TAPI belum diizinkan di service (gap M1)
```

---

## Frontend

> Stack frontend belum final — pilih salah satu opsi di bawah dan update dokumen ini.

### Opsi A: Vue 3 + Inertia (Full-stack monorepo)

| Komponen | Versi | Keterangan |
|---|---|---|
| Vue | 3.x | Composition API — Wajib, bukan Options API |
| Inertia.js | 1.x | SSR-like navigation tanpa REST fetch manual |
| Pinia | 2.x | State management |
| Vite | 5.x | Build tool |
| TypeScript | 5.x | Wajib dipakai |

### Opsi B: React 18 + Vite (SPA terpisah)

| Komponen | Versi | Keterangan |
|---|---|---|
| React | 18.x | Hooks — bukan class component |
| React Router | 6.x | Routing |
| Zustand | 4.x | State management |
| Vite | 5.x | Build tool |
| TypeScript | 5.x | Wajib dipakai |

### Shared Frontend Stack (berlaku untuk kedua opsi)

| Komponen | Keterangan |
|---|---|
| Axios | HTTP client — dengan interceptor global untuk token + X-Company-ID |
| TanStack Query / SWR | Server state / cache (opsional tapi disarankan) |
| Zod / VeeValidate | Form validation |
| TailwindCSS | Utility CSS |
| UI Library | Pilih: Shadcn/ui, Ant Design, PrimeVue, atau Vuetify |

### Auth Flow Frontend

```
1. Login → POST /auth/login → dapat Bearer token
2. Simpan token di memory / httpOnly cookie (JANGAN localStorage)
3. Setiap request wajib kirim:
   - Header: Authorization: Bearer {token}
   - Header: X-Company-ID: {company_id}
4. Route guard: cek token valid + permission sebelum render halaman
5. Logout → DELETE /auth/logout → hapus token
```

---

## Lingkungan Development

| Lingkungan | Tools |
|---|---|
| Local | Laravel Sail (Docker) atau Herd |
| Version Control | Git + Gitflow (main, develop, feature/*, hotfix/*) |
| API Testing | Postman / Insomnia — import dari route map |
| Code Quality | PHP: PHP CS Fixer (PSR-12), PHPStan level 6+ |
| Frontend Quality | ESLint + Prettier |
| Testing Backend | Pest PHP (preferred) atau PHPUnit |
| Testing Frontend | Vitest + Vue Test Utils / React Testing Library |
