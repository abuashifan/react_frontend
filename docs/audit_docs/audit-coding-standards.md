# Coding Standards — ERP Backend & Frontend

> Standar ini berlaku untuk semua kontribusi ke project ERP.
> Setiap AI agent dan developer wajib mengikuti panduan ini sebelum generate/menulis kode.

---

## Backend — Laravel / PHP

### Prinsip Utama

1. **Thin Controller** — Controller hanya menerima request, memanggil service, mengembalikan response. Tidak ada business logic di controller.
2. **Service Layer** — Semua business logic ada di `app/Services/`. Satu service per domain (bukan per model).
3. **FormRequest** — Semua validasi payload API ada di FormRequest, bukan di controller.
4. **Repository tidak dipakai** — Codebase memakai Service + Eloquent langsung (bukan Repository Pattern). Jangan tambahkan repository layer.
5. **Strict Types** — Semua file PHP baru wajib `declare(strict_types=1);`.

### Standar PHP

```php
<?php

declare(strict_types=1);

namespace App\Services\Sales;

use App\Models\Tenant\SalesInvoice;
use App\Support\Api\ApiResponseBuilder;

final class SalesInvoiceService
{
    public function __construct(
        private readonly SalesCalculationService $calculator,
        private readonly TransactionDateGuardService $dateGuard,
    ) {}

    /**
     * Post a sales invoice and generate journal entries.
     *
     * @throws ApiException
     */
    public function post(SalesInvoice $invoice): SalesInvoice
    {
        // business logic di sini
    }
}
```

**Rules:**
- PSR-12 wajib — jalankan PHP CS Fixer sebelum commit
- Type hint semua parameter dan return type
- `final class` untuk service (kecuali ada alasan inheritance)
- Constructor property promotion untuk dependency injection
- `readonly` untuk injected dependencies
- PHPDoc `@throws` wajib di method yang bisa throw ApiException

### Struktur Output per Fitur Baru

Setiap fitur baru (CRUD atau workflow action) harus menghasilkan file berikut:

```
1. Migration         database/migrations/tenant/YYYY_MM_DD_HHMMSS_{name}.php
2. Model             app/Models/Tenant/{ModelName}.php
3. FormRequest       app/Http/Requests/{Module}/{ActionName}Request.php
4. Service           app/Services/{Module}/{ModelName}Service.php
5. Controller        app/Http/Controllers/Api/{Module}/{ModelName}Controller.php
6. API Resource      app/Http/Resources/{Module}/{ModelName}Resource.php
7. Route             app/Modules/{Module}/Routes/api.php
8. Test              tests/Feature/{Module}/{ModelName}Test.php
```

### Model Tenant

```php
<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Model;

class SalesInvoice extends Model
{
    // WAJIB: semua model tenant pakai koneksi ini
    protected $connection = 'tenant';

    protected $fillable = [
        'invoice_number', 'customer_id', 'invoice_date',
        'status', 'grand_total', 'paid_amount', 'balance_due',
    ];

    protected $casts = [
        'invoice_date'  => 'date',
        'grand_total'   => 'decimal:2',
        'paid_amount'   => 'decimal:2',
        'balance_due'   => 'decimal:2',
    ];

    // Status constants — jangan hardcode string status di luar model
    const STATUS_DRAFT    = 'draft';
    const STATUS_APPROVED = 'approved';
    const STATUS_POSTED   = 'posted';
    const STATUS_VOID     = 'void';
}
```

### Controller Pattern

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Sales;

use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\PostSalesInvoiceRequest;
use App\Http\Resources\Sales\SalesInvoiceResource;
use App\Models\Tenant\SalesInvoice;
use App\Services\Sales\SalesInvoiceService;
use App\Support\Api\ApiResponseBuilder;

class SalesInvoiceController extends Controller
{
    public function __construct(
        private readonly SalesInvoiceService $service,
    ) {}

    public function post(PostSalesInvoiceRequest $request, SalesInvoice $invoice): JsonResponse
    {
        $result = $this->service->post($invoice);

        return ApiResponseBuilder::success(
            data: new SalesInvoiceResource($result),
            message: 'Invoice posted successfully.',
        );
    }
}
```

### Service Pattern

```php
public function post(SalesInvoice $invoice): SalesInvoice
{
    // 1. Guard: validasi status boleh di-post
    if (!in_array($invoice->status, [SalesInvoice::STATUS_DRAFT, SalesInvoice::STATUS_APPROVED])) {
        throw new ApiException('Invoice cannot be posted from current status.');
    }

    // 2. Guard: validasi tanggal/period
    $this->dateGuard->assertDateIsWritable($invoice->invoice_date);

    // 3. Business logic dalam DB transaction
    return DB::transaction(function () use ($invoice) {
        // update status, buat journal, dll.
        $invoice->update(['status' => SalesInvoice::STATUS_POSTED]);
        $this->journalService->createSalesInvoiceJournal($invoice);
        return $invoice->fresh();
    });
}
```

**Rules service:**
- Semua operasi yang mengubah data wajib dalam `DB::transaction()`
- Guard status selalu di awal method
- Date guard selalu sebelum operasi post/void
- Jangan buat JournalEntry langsung — pakai helper journal service
- Jangan hardcode account_id — pakai account mapping resolver

### Account Mapping — Wajib

```php
// ❌ SALAH — hardcode account_id
$journalLine = ['account_id' => 5, 'debit' => 1000];

// ✅ BENAR — pakai mapping resolver
$arAccountId = $this->accountMappingResolver->resolve('sales.accounts_receivable');
$journalLine = ['account_id' => $arAccountId, 'debit' => 1000];
```

### Journal System — Aturan Kritis

- System-generated journal **tidak boleh** memakai control accounts dari manual journal
- Control accounts yang diprotect: `sales.accounts_receivable`, `purchase.accounts_payable`, `inventory.asset`, `sales.customer_deposit`, `purchase.vendor_deposit`, `purchase.inventory_interim`, `sales.tax_output`, `purchase.tax_input`
- Void system journal dilakukan cascade dari source transaction — **bukan** lewat endpoint manual journal
- Setiap system journal yang dibuat wajib `is_system_generated = true`
- Setiap pembuatan journal wajib assert balanced: `sum(debit) === sum(credit)`

### Naming Convention

| Komponen | Convention | Contoh |
|---|---|---|
| Class | PascalCase | `SalesInvoiceService` |
| Method | camelCase | `createFromDeliveryOrder` |
| Variable | camelCase | `$invoiceLines` |
| Tabel DB | snake_case, plural | `sales_invoices` |
| Kolom DB | snake_case | `invoice_date`, `grand_total` |
| Tabel prefix | modul_ | `acc_`, `inv_`, `hr_` (opsional, lihat ERD aktual) |
| Config key | dot.notation | `sales.accounts_receivable` |
| Route permission | dot.notation | `sales.invoices.post` |

### Migrasi

- Semua migrasi tenant di `database/migrations/tenant/`
- Timestamp format: `YYYY_MM_DD_HHMMSS`
- **Jangan tambah FK massal** — audit data existing dulu (lihat `09-risk-gap-and-improvement-backlog.md` H2)
- Setiap migrasi wajib ada `up()` dan `down()`
- Gunakan `unsignedBigInteger()` untuk semua foreign-like column

---

## Frontend — Vue 3 / React 18

### Prinsip Utama

1. **Composition API (Vue) / Hooks (React)** — Wajib. Bukan Options API atau Class Component.
2. **TypeScript** — Semua file `.ts` / `.tsx` / `.vue` wajib typed. Tidak boleh `any` kecuali terpaksa dengan komentar justifikasi.
3. **One concern per file** — Satu component, satu page, satu store per file.
4. **API service terpisah** — Semua Axios call ada di `src/services/api/`, bukan di component.

### Struktur Direktori Frontend

```
src/
├── modules/
│   ├── sales/
│   │   ├── pages/           # SalesInvoiceListPage.vue / tsx
│   │   ├── components/      # SalesInvoiceForm.vue
│   │   ├── services/        # salesInvoiceApi.ts
│   │   ├── stores/          # useSalesInvoiceStore.ts (Pinia) / salesInvoiceStore.ts (Zustand)
│   │   ├── types/           # salesInvoice.types.ts
│   │   └── routes.ts        # Route definition untuk modul ini
│   ├── purchase/
│   ├── inventory/
│   ├── accounting/
│   └── master-data/
├── components/              # Shared/global components
│   ├── ui/                  # Button, Table, Modal, Form fields
│   └── layout/              # AppLayout, Sidebar, Header
├── composables/             # Vue composables / React custom hooks
├── services/
│   └── http.ts              # Axios instance + interceptors
├── stores/
│   └── auth.ts              # Auth state (token, user, company)
├── types/
│   └── api.types.ts         # ApiResponse<T>, PaginatedResponse<T>
└── router/
    └── index.ts             # Root router + guards
```

### API Service Pattern

```typescript
// src/modules/sales/services/salesInvoiceApi.ts

import { http } from '@/services/http'
import type { SalesInvoice, CreateSalesInvoicePayload } from '../types/salesInvoice.types'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'

export const salesInvoiceApi = {
  list(params?: Record<string, unknown>): Promise<PaginatedResponse<SalesInvoice>> {
    return http.get('/sales/invoices', { params })
  },

  get(id: number): Promise<ApiResponse<SalesInvoice>> {
    return http.get(`/sales/invoices/${id}`)
  },

  create(payload: CreateSalesInvoicePayload): Promise<ApiResponse<SalesInvoice>> {
    return http.post('/sales/invoices', payload)
  },

  post(id: number): Promise<ApiResponse<SalesInvoice>> {
    return http.patch(`/sales/invoices/${id}/post`)
  },

  void(id: number, reason: string): Promise<ApiResponse<SalesInvoice>> {
    return http.patch(`/sales/invoices/${id}/void`, { reason })
  },
}
```

### Axios Instance (http.ts)

```typescript
// src/services/http.ts
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
})

// Request interceptor — inject token + company ID
http.interceptors.request.use((config) => {
  const auth = useAuthStore()
  if (auth.token) {
    config.headers['Authorization'] = `Bearer ${auth.token}`
  }
  if (auth.activeCompanyId) {
    config.headers['X-Company-ID'] = auth.activeCompanyId
  }
  return config
})

// Response interceptor — handle 401/403
http.interceptors.response.use(
  (res) => res.data,  // unwrap envelope — return langsung .data dari response
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore().logout()
    }
    return Promise.reject(error.response?.data)
  }
)
```

### TypeScript Types

```typescript
// src/types/api.types.ts
export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
  meta?: Record<string, unknown>
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

// Selalu buat type untuk setiap dokumen bisnis
// src/modules/sales/types/salesInvoice.types.ts
export interface SalesInvoice {
  id: number
  invoice_number: string
  customer_id: number
  invoice_date: string       // ISO 8601
  status: SalesInvoiceStatus
  grand_total: string        // decimal as string dari API
  paid_amount: string
  balance_due: string
}

export type SalesInvoiceStatus = 'draft' | 'approved' | 'posted' | 'partially_paid' | 'paid' | 'void'
```

### Naming Convention Frontend

| Komponen | Convention | Contoh |
|---|---|---|
| Component file | PascalCase | `SalesInvoiceForm.vue` |
| Page file | PascalCase + Page | `SalesInvoiceListPage.vue` |
| Composable / Hook | camelCase + use | `usePermission.ts` |
| Store | camelCase + Store | `useSalesInvoiceStore.ts` |
| API service | camelCase + Api | `salesInvoiceApi.ts` |
| Type/Interface | PascalCase | `SalesInvoice`, `CreateSalesInvoicePayload` |
| CSS class | kebab-case (Tailwind) | `text-sm`, `font-medium` |

### Permission Guard

```typescript
// Cek permission sebelum render action button atau route
// Permission string mengikuti backend: 'sales.invoices.post'

// Vue composable
export function usePermission() {
  const auth = useAuthStore()
  return {
    can: (permission: string) => auth.permissions.includes(permission),
    canAny: (permissions: string[]) => permissions.some(p => auth.permissions.includes(p)),
  }
}

// Pemakaian di component
const { can } = usePermission()
// <button v-if="can('sales.invoices.post')">Post Invoice</button>
```

---

## Git Workflow

### Branch Strategy (Gitflow)

```
main          ← production, hanya dari release/ atau hotfix/
develop       ← integration, semua feature merge ke sini
feature/*     ← satu branch per fitur/gap
hotfix/*      ← perbaikan critical dari main
release/*     ← release candidate dari develop
```

### Commit Convention (Conventional Commits)

```
feat(sales): add sales return from delivery order
fix(inventory): resolve duplicate source guard for mixed adjustment
fix(accounting): align account mapping optional vs required runtime
test(purchase): add direct vendor bill stock reconciliation test
refactor(journal): extract SystemJournalBuilder helper
docs(api): update route map for purchase returns
chore(deps): update laravel to 11.x
```

Format: `type(scope): description`

Types: `feat`, `fix`, `test`, `refactor`, `docs`, `chore`, `perf`

### Code Review Checklist

- [ ] Tidak ada business logic di controller
- [ ] Service menggunakan DB::transaction() untuk operasi write
- [ ] Account mapping pakai resolver, bukan hardcode account_id
- [ ] Status guard ada di awal method service
- [ ] Date guard dipanggil sebelum post/void
- [ ] System journal assert balanced (sum debit == sum credit)
- [ ] Migration ada `up()` dan `down()`
- [ ] Test feature tersedia untuk happy path + error path utama
- [ ] Tidak ada `any` di TypeScript tanpa justifikasi
