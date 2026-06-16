# GAP-02 — Settings & Access Management Endpoint Mismatch

**Severity**: 🔴 Critical  
**Tipe**: Semua endpoint Settings dan Access yang dibuat di Phase 7 salah  
**Dampak**: Seluruh halaman Settings dan Users/Roles page gagal 404/405

---

## Kondisi Saat Ini (Phase 7 — salah)

Phase 7 membuat settings module dengan asumsi endpoint:
- `GET/PATCH /settings/company` → company profile
- `GET/PATCH /settings/transactions` → transaction defaults
- `GET/PATCH /settings/users` → user management
- `GET/PATCH /settings/roles` → role management
- `GET/PATCH /settings/preferences` → user preferences

**Semua ini salah atau tidak ada di backend.**

---

## Endpoint Backend Aktual

### Settings Module (`/settings/company/*`)

| Method | Endpoint Backend | Fungsi |
|--------|-----------------|--------|
| `GET` | `/settings/company` | Get company profile (name, address, dll) |
| `GET` | `/settings/company/workflow` | Get workflow config (auto_post, approval rules) — **PUBLIC, tanpa permission middleware** |
| `PATCH` | `/settings/company/accounting` | Update accounting config (fiscal_year_start, currency) |
| `PATCH` | `/settings/company/modules` | Enable/disable modules (fixed_assets, multi_currency, dll) |
| `PATCH` | `/settings/company/transaction-defaults` | Update transaction defaults (number formats, approval required) |

**Yang tidak ada di backend:**
- `/settings/transactions` → gunakan `/settings/company/transaction-defaults`
- `/settings/users` → gunakan `/access/company-users`
- `/settings/roles` → gunakan `/access/roles`
- `/settings/preferences` → **Tidak ada endpoint ini di backend sama sekali**

### Access Module (`/access/*`)

| Method | Endpoint Backend | Fungsi | Permission |
|--------|-----------------|--------|-----------|
| `GET` | `/access/users` | Alias untuk company-users list | `access.users.view` |
| `GET` | `/access/company-users` | List users di company ini | `access.users.view` |
| `GET` | `/access/company-users/{id}` | Detail user | `access.users.view` |
| `PATCH` | `/access/company-users/{id}/role` | Update role user | `access.users.manage` |
| `PATCH` | `/access/company-users/{id}/deactivate` | Nonaktifkan user | `access.users.deactivate` |
| `PATCH` | `/access/company-users/{id}/reactivate` | Aktifkan user | `access.users.manage` |
| `PATCH` | `/access/company-users/{id}/remove` | Hapus user dari company | `access.users.remove` |
| `GET` | `/access/permission-catalog` | Semua permission yang tersedia | `access.permissions.view` |
| `GET` | `/access/users/{id}/permissions` | Permission override per user | `access.permissions.view` |
| `PUT` | `/access/users/{id}/permissions` | Update permission override | `access.permissions.manage` |
| `POST` | `/access/users/{id}/copy-access` | Copy akses dari user lain | `access.permissions.manage` |
| `POST` | `/access/users/{id}/reset-permissions` | Reset ke role default | `access.permissions.manage` |
| `GET` | `/access/roles` | List roles | `access.roles.view` |
| `POST` | `/access/roles` | Buat role baru | `access.roles.create` |
| `GET` | `/access/roles/{id}` | Detail role | `access.roles.view` |
| `PATCH` | `/access/roles/{id}` | Update role name/description | `access.roles.edit` |
| `POST` | `/access/roles/{id}/clone` | Clone role | `access.roles.clone` |
| `PUT` | `/access/roles/{id}/permissions` | Update permissions role | `access.permissions.manage` |
| `PATCH` | `/access/roles/{id}/deactivate` | Nonaktifkan role | `access.roles.deactivate` |
| `PATCH` | `/access/roles/{id}/reactivate` | Aktifkan role | `access.roles.edit` |
| `GET` | `/access/invitations` | List undangan | `access.invitations.view` |
| `POST` | `/access/invitations` | Kirim undangan | `access.invitations.create` |
| `POST` | `/access/invitations/{id}/resend` | Kirim ulang | `access.invitations.resend` |
| `POST` | `/access/invitations/{id}/revoke` | Batalkan undangan | `access.invitations.revoke` |
| `GET` | `/access/audit` | Access audit log | `access.audit.view` |

---

## Yang Perlu Direfactor

### 1. `settingsApi.ts` — Pisah jadi 2 file

**`companySettingsApi.ts`** (tetap di settings module):
```ts
companySettingsApi.get()           → GET /settings/company
companySettingsApi.getWorkflow()   → GET /settings/company/workflow (public)
companySettingsApi.updateAccounting()    → PATCH /settings/company/accounting
companySettingsApi.updateModules()       → PATCH /settings/company/modules
companySettingsApi.updateTransactionDefaults() → PATCH /settings/company/transaction-defaults
```

**`accessApi.ts`** (file baru di settings module atau modul tersendiri):
```ts
accessUsersApi.list()              → GET /access/company-users
accessUsersApi.get(id)             → GET /access/company-users/{id}
accessUsersApi.updateRole(id, role_id) → PATCH /access/company-users/{id}/role
accessUsersApi.deactivate(id)      → PATCH /access/company-users/{id}/deactivate
accessUsersApi.reactivate(id)      → PATCH /access/company-users/{id}/reactivate
accessUsersApi.remove(id)          → PATCH /access/company-users/{id}/remove
accessUsersApi.getPermissions(id)  → GET /access/users/{id}/permissions
accessUsersApi.updatePermissions(id, perms) → PUT /access/users/{id}/permissions
accessUsersApi.copyAccess(id, from_id)      → POST /access/users/{id}/copy-access
accessUsersApi.resetPermissions(id)         → POST /access/users/{id}/reset-permissions

accessRolesApi.list()              → GET /access/roles
accessRolesApi.store(payload)      → POST /access/roles
accessRolesApi.get(id)             → GET /access/roles/{id}
accessRolesApi.update(id, payload) → PATCH /access/roles/{id}
accessRolesApi.clone(id)           → POST /access/roles/{id}/clone
accessRolesApi.getPermissions(id)  → GET /access/roles/{id}/permissions
accessRolesApi.updatePermissions(id, perms) → PUT /access/roles/{id}/permissions
accessRolesApi.deactivate(id)      → PATCH /access/roles/{id}/deactivate
accessRolesApi.reactivate(id)      → PATCH /access/roles/{id}/reactivate

accessInvitationsApi.list()        → GET /access/invitations
accessInvitationsApi.store(email)  → POST /access/invitations
accessInvitationsApi.resend(id)    → POST /access/invitations/{id}/resend
accessInvitationsApi.revoke(id)    → POST /access/invitations/{id}/revoke

accessPermissionCatalogApi.get()   → GET /access/permission-catalog

accessAuditApi.get(params)         → GET /access/audit
```

### 2. Pages yang perlu direfactor

| Page | Perubahan |
|------|-----------|
| `CompanySettingsPage.tsx` | Split form: profile + accounting (2 endpoint) |
| `TransactionSettingsPage.tsx` | Endpoint: `/settings/company/transaction-defaults` |
| `UsersPage.tsx` | Endpoint: `/access/company-users/*`; tambah: invite user, remove user, copy access |
| `RolesPage.tsx` | Endpoint: `/access/roles/*`; tambah: buat role, clone role, deactivate/reactivate |
| `MyPreferencesPage.tsx` | **Hapus** preferences form (endpoint tidak ada di backend), sisakan hanya change password |
| Settings ribbon | Tambah: Undangan, Audit Akses |

### 3. Halaman baru yang perlu dibuat

| Halaman | Endpoint |
|---------|---------|
| `InvitationsPage.tsx` | `/access/invitations/*` |
| `AccessAuditPage.tsx` | `/access/audit` |
| `UserPermissionsPage.tsx` atau dialog | `/access/users/{id}/permissions` + PUT |

### 4. Permission keys yang perlu dipakai

Ganti dari `settings.users.manage` dan `settings.roles.manage` menjadi:
- `access.users.view`, `access.users.manage`, `access.users.deactivate`, `access.users.remove`
- `access.roles.view`, `access.roles.create`, `access.roles.edit`, `access.roles.clone`, `access.roles.deactivate`
- `access.permissions.view`, `access.permissions.manage`
- `access.invitations.view`, `access.invitations.create`, `access.invitations.resend`, `access.invitations.revoke`
- `access.audit.view`
- `settings.company.view`, `settings.company.edit`
