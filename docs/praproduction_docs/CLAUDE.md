# CLAUDE.md — Seaside Escape ERP Frontend Agent Entry Point

> Baca file ini PERTAMA sebelum melakukan task apapun.
> Ini adalah kontrak kerja antara AI Agent dan project Seaside Escape ERP.

---

## Identitas Project

**Nama Produk**: Seaside Escape ERP  
**Type**: SPA (Single Page Application) — standalone frontend  
**Backend**: Laravel API only — tidak ada Blade, tidak ada session Laravel  
**Target User**: Accountant, staff keuangan, operator bisnis UKM hingga mid-market  
**Target Screen**: iPad mini 6 (768px) ke atas — small-screen first, desktop-capable  

---

## Cara Kerja Agent di Project Ini

### Sebelum menulis kode apapun, agent WAJIB:

1. **Baca dokumen relevan** dari `/docs/` sesuai task yang dikerjakan
2. **Cek komponen yang sudah ada** di `src/components/ui/` dan `src/components/shared/`
3. **Cek API endpoint** di `docs/backend/frontend-api-contract.md`
4. **Cek business rules** di `docs/backend/08-business-rules-and-validation-map.md`

### Peta dokumen per task:

| Task | Dokumen yang wajib dibaca |
|---|---|
| Buat komponen UI baru | `04-design-tokens.md` + `07-component-library.md` |
| Buat halaman list/workspace | `09-table-and-list.md` + `13-filter-and-search.md` |
| Buat form transaksi | `08-form-architecture.md` + `10-document-workflow.md` |
| Buat API call | `12-api-integration.md` + `backend/frontend-api-contract.md` |
| Buat permission guard | `11-permission-rules.md` |
| Buat modul baru | `03-folder-structure.md` + `15-module-patterns.md` |
| Layout/navigasi | `05-layout-and-navigation.md` + `06-responsive-rules.md` |

---

## Hard Rules — Tidak Boleh Dilanggar

### 1. Komponen
- **DILARANG** membuat komponen baru jika sudah ada yang bisa dipakai
- **DILARANG** copy-paste komponen antar modul — ekstrak ke shared
- **DILARANG** styling inline atau Tailwind class ad-hoc di luar design token
- **WAJIB** semua UI pakai komponen dari `src/components/ui/` atau Shadcn/ui

### 2. State Management
- **TanStack Query** → semua server state (fetch, cache, mutate API)
- **Zustand** → hanya UI state (auth, active company, sidebar, ribbon state)
- **React Hook Form** → semua form state
- **useState lokal** → hanya state yang tidak keluar dari satu komponen
- **DILARANG** fetch data langsung di komponen — selalu via TanStack Query

### 3. TypeScript
- **DILARANG** menggunakan `any` tanpa komentar justifikasi
- **WAJIB** semua API response typed via interface
- **WAJIB** semua props komponen typed

### 4. API Calls
- **WAJIB** semua Axios call ada di `src/modules/{module}/services/`
- **DILARANG** fetch langsung di komponen atau store
- **WAJIB** cek `frontend-api-contract.md` sebelum buat API call baru

### 5. Permission
- **WAJIB** semua action button dicek permission sebelum dirender
- **WAJIB** semua route dicek permission sebelum diakses
- **DILARANG** menampilkan tombol aksi tanpa cek permission

### 6. Document Workflow
- **WAJIB** baca `10-document-workflow.md` sebelum buat form transaksi apapun
- Edit mode, button visibility, void chain — semua ada di sana
- **DILARANG** hardcode status document di komponen

---

## Stack Teknologi

```
React 18          — UI framework
Vite              — Build tool
TypeScript        — Type safety
TanStack Query    — Server state & caching
Zustand           — UI/auth state
Shadcn/ui         — Component library base
Tailwind CSS      — Styling
React Hook Form   — Form state
Zod               — Schema validation
React Router v6   — Routing
Axios             — HTTP client
Inter font        — Typography (dengan tabular numbers untuk angka)
```

---

## Struktur Folder Ringkas

```
src/
├── modules/          ← Semua fitur bisnis per modul
├── components/
│   ├── ui/           ← Base UI components (Button, Input, dll)
│   └── shared/       ← Shared business components
├── stores/           ← Zustand stores
├── services/         ← Axios instance & interceptors
├── types/            ← Global TypeScript types
├── hooks/            ← Global custom hooks
└── router/           ← Route definitions & guards
```

Detail lengkap → `03-folder-structure.md`

---

## Konvensi Penamaan

| Komponen | Konvensi | Contoh |
|---|---|---|
| Page component | PascalCase + Page | `SalesInvoiceListPage.tsx` |
| Feature component | PascalCase | `SalesInvoiceForm.tsx` |
| UI component | PascalCase | `DataTable.tsx` |
| Custom hook | camelCase + use | `usePermission.ts` |
| API service | camelCase + Api | `salesInvoiceApi.ts` |
| Store | camelCase + Store | `useAuthStore.ts` |
| Type/Interface | PascalCase | `SalesInvoice`, `ApiResponse<T>` |
| Zod schema | camelCase + Schema | `salesInvoiceSchema` |

---

## Cara Commit

```
feat(sales): add sales invoice list page with filter
fix(form): resolve line item calculation on discount change
refactor(shared): extract DocumentStatusBadge to shared components
feat(auth): add permission guard for post invoice button
```

Format: `type(scope): description`  
Types: `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`
