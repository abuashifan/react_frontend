# Spec-27 — Phase 9: Settings & Access Management Refactor

**Phase**: 9  
**Tipe**: Refactor + fitur baru  
**Estimasi**: 1-2 sesi  
**Referensi**: gap-02, issue-05, design-N3

---

## Scope

Refactor seluruh settings module agar endpoint cocok dengan backend aktual.  
Tambah halaman yang belum ada: Invitations, Access Audit.

---

## File Structure Baru

```
src/modules/settings/
  services/
    companySettingsApi.ts     ← refactor dari settingsApi.ts
    accessApi.ts              ← baru: semua /access/* endpoints
  hooks/
    useCompanySettings.ts     ← refactor dari useSettings.ts
    useAccessManagement.ts    ← baru
  types/
    settings.types.ts         ← refactor: hapus user/role types (pindah ke access.types.ts)
    access.types.ts           ← baru
  pages/
    CompanySettingsPage.tsx   ← refactor: split tabs
    TransactionSettingsPage.tsx ← refactor: ganti endpoint
    AccountMappingSettingsPage.tsx ← tidak berubah (endpoint sudah benar)
    AccountingPeriodPage.tsx  ← tidak berubah
    UsersPage.tsx             ← refactor: endpoint + hapus create, tambah link invite
    RolesPage.tsx             ← refactor: endpoint + tambah create/clone/deactivate
    MyPreferencesPage.tsx     ← refactor: hapus preferences form, sisakan change password
    InvitationsPage.tsx       ← BARU
    AccessAuditPage.tsx       ← BARU
  routes.tsx                  ← tambah 2 route baru
```

---

## Spec per File

### `companySettingsApi.ts`

```ts
export const companySettingsApi = {
  get: ()         → GET /settings/company
  getWorkflow: () → GET /settings/company/workflow
  updateAccounting: (payload)         → PATCH /settings/company/accounting
  updateModules: (payload)            → PATCH /settings/company/modules
  updateTransactionDefaults: (payload) → PATCH /settings/company/transaction-defaults
}
```

### `accessApi.ts`

```ts
export const accessUsersApi = {
  list: (params)            → GET /access/company-users
  get: (id)                 → GET /access/company-users/{id}
  updateRole: (id, role_id) → PATCH /access/company-users/{id}/role
  deactivate: (id)          → PATCH /access/company-users/{id}/deactivate
  reactivate: (id)          → PATCH /access/company-users/{id}/reactivate
  remove: (id)              → PATCH /access/company-users/{id}/remove
  getPermissions: (id)      → GET /access/users/{id}/permissions
  updatePermissions: (id, perms) → PUT /access/users/{id}/permissions
  copyAccess: (id, fromId)  → POST /access/users/{id}/copy-access
  resetPermissions: (id)    → POST /access/users/{id}/reset-permissions
}

export const accessRolesApi = {
  list: ()                  → GET /access/roles
  store: (payload)          → POST /access/roles
  get: (id)                 → GET /access/roles/{id}
  update: (id, payload)     → PATCH /access/roles/{id}
  clone: (id)               → POST /access/roles/{id}/clone
  updatePermissions: (id, perms) → PUT /access/roles/{id}/permissions
  deactivate: (id)          → PATCH /access/roles/{id}/deactivate
  reactivate: (id)          → PATCH /access/roles/{id}/reactivate
}

export const accessInvitationsApi = {
  list: (params)            → GET /access/invitations
  store: (payload)          → POST /access/invitations
  resend: (id)              → POST /access/invitations/{id}/resend
  revoke: (id)              → POST /access/invitations/{id}/revoke
}

export const accessPermissionCatalogApi = {
  get: ()                   → GET /access/permission-catalog
}

export const accessAuditApi = {
  list: (params)            → GET /access/audit
}
```

### `access.types.ts`

```ts
export interface CompanyUser {
  id: number
  name: string
  email: string
  role_id?: number | null
  role?: string | null
  is_active: boolean
  last_login_at?: string | null
}

export interface AccessRole {
  id: number
  name: string
  description?: string | null
  is_active: boolean
  users_count?: number
  permissions?: string[]
}

export interface Invitation {
  id: number
  email: string
  role?: string | null
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  invited_by?: string
  sent_at: string
  expires_at?: string | null
}

export interface AuditEntry {
  id: number
  user: string
  event: string
  description: string
  ip_address?: string | null
  created_at: string
}
```

### `CompanySettingsPage.tsx` — Refactor dengan tabs

```tsx
// Tabs: Profil | Akuntansi | Transaksi | Modul
// Tab Profil → GET /settings/company (read-only untuk nama, perlu konfirmasi backend)
// Tab Akuntansi → PATCH /settings/company/accounting
// Tab Transaksi → PATCH /settings/company/transaction-defaults
// Tab Modul → PATCH /settings/company/modules (toggle switches per module)
```

### `UsersPage.tsx` — Refactor

```tsx
// Load: GET /access/company-users
// Hapus: dialog create user
// Tambah: link/button "Undang Pengguna" → navigate ke /settings/invitations
// Actions per row: Ubah Peran, Nonaktifkan/Aktifkan, Hapus dari Company
// Dialog detail: lihat permission override, edit role
```

### `RolesPage.tsx` — Refactor

```tsx
// Load: GET /access/roles
// Tambah: dialog create role (POST /access/roles)
// Tambah: tombol clone per role
// Tambah: tombol deactivate/reactivate per role
// Permission tree: PUT /access/roles/{id}/permissions
```

### `MyPreferencesPage.tsx` — Simplified

```tsx
// Hapus: preferences form (language, date_format, number_format) — tidak ada backend
// Sisakan: change password form saja
// Endpoint change password: POST /auth/change-password (perlu konfirmasi endpoint ini ada)
```

### `InvitationsPage.tsx` — Baru

```tsx
// Load: GET /access/invitations
// Tambah: dialog kirim undangan (POST /access/invitations)
// Actions: Kirim Ulang, Batalkan
// Status badge: pending/accepted/expired/revoked
```

### `AccessAuditPage.tsx` — Baru

```tsx
// Load: GET /access/audit
// Filter: user, event type, date range (inline filter, bukan sidebar)
// DataTable: waktu, user, event, detail, IP
```

---

## Routes Update

```tsx
// src/modules/settings/routes.tsx — tambahkan:
{ path: '/settings/invitations', element: <ProtectedRoute permission="access.invitations.view"><InvitationsPage /></ProtectedRoute> }
{ path: '/settings/audit',       element: <ProtectedRoute permission="access.audit.view"><AccessAuditPage /></ProtectedRoute> }
```

## moduleConfig.ts Update

```ts
// Settings ribbonItems — tambahkan:
{ id: 'invitations',  label: 'Undangan',    icon: Mail,          path: '/settings/invitations',  permission: 'access.invitations.view' }
{ id: 'access-audit', label: 'Audit Akses', icon: Shield,        path: '/settings/audit',         permission: 'access.audit.view' }

// Perbaiki permission existing:
{ id: 'company',      permission: 'settings.company.view' }
{ id: 'transactions', permission: 'settings.company.view' }
{ id: 'users',        permission: 'access.users.view' }
{ id: 'roles',        permission: 'access.roles.view' }
{ id: 'preferences',  permission: undefined }  // no permission needed
```

---

## Build & Commit

```bash
npm run build   # harus 0 error
git commit -m "refactor(settings): phase 9 — align settings & access to backend endpoints"
git push
```
