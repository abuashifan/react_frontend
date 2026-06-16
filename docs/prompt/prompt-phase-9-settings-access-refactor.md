# Prompt — Phase 9: Settings & Access Management Refactor

**Phase**: 9  
**Estimasi**: 1-2 sesi  
**Dependencies**: Phase 8 (P0 Contract Fixes) harus selesai dulu  
**Referensi**: `docs/praproduction_docs/spec-27-settings-access-refactor.md`

---

## Tugas

Refactor seluruh settings module agar endpoint sesuai backend aktual. Tambah halaman Invitations dan Access Audit.

**Baca dulu sebelum mulai:**
1. `docs/gap_docs/gap-02-settings-access-mismatch.md` — full endpoint mapping
2. `docs/issue_docs/issue-05-settings-endpoints.md` — per-file changes
3. `docs/design_docs/design-N3-access-management.md` — desain halaman baru
4. `docs/praproduction_docs/spec-27-settings-access-refactor.md` — full spec dengan types & code

---

## Background

Settings module (Phase 7) dibuat dengan endpoint yang salah karena menggunakan asumsi. Backend aktual berbeda:
- **Company settings**: 3 endpoint PATCH terpisah (`/accounting`, `/modules`, `/transaction-defaults`), bukan 1 endpoint
- **Users**: endpoint di `/access/company-users/*`, bukan `/settings/users`
- **Roles**: endpoint di `/access/roles/*`, bukan `/settings/roles`
- Belum ada halaman Invitations dan Access Audit

---

## File yang Dibuat Baru

```
src/modules/settings/services/accessApi.ts
src/modules/settings/hooks/useAccessManagement.ts
src/modules/settings/types/access.types.ts
src/modules/settings/pages/InvitationsPage.tsx
src/modules/settings/pages/AccessAuditPage.tsx
```

---

## File yang Direfactor

```
src/modules/settings/services/settingsApi.ts           → kompanySettingsApi.ts
src/modules/settings/hooks/useSettings.ts              → useCompanySettings.ts
src/modules/settings/pages/CompanySettingsPage.tsx     → split 4 tabs
src/modules/settings/pages/TransactionSettingsPage.tsx → ganti endpoint
src/modules/settings/pages/UsersPage.tsx               → ganti ke /access/company-users
src/modules/settings/pages/RolesPage.tsx               → ganti ke /access/roles
src/modules/settings/pages/MyPreferencesPage.tsx       → hapus preferences form
src/modules/settings/routes.tsx                        → tambah 2 route baru
src/router/moduleConfig.ts                             → tambah invitations + audit ribbon items
```

---

## Urutan Pekerjaan

### Step 1 — Buat `access.types.ts`

Types untuk: `CompanyUser`, `AccessRole`, `Invitation`, `AuditEntry`.  
Lihat spec-27 §access.types.ts untuk definisi lengkap.

### Step 2 — Buat `accessApi.ts`

4 API group: `accessUsersApi`, `accessRolesApi`, `accessInvitationsApi`, `accessPermissionCatalogApi`, `accessAuditApi`.  
Lihat spec-27 §accessApi.ts untuk semua endpoint.

### Step 3 — Buat `useAccessManagement.ts`

Hooks untuk semua aksi: users list/mutations, roles list/mutations/permissions, invitations, audit.

### Step 4 — Refactor `companySettingsApi.ts`

```ts
export const companySettingsApi = {
  get: () → GET /settings/company
  getWorkflow: () → GET /settings/company/workflow
  updateAccounting: (payload) → PATCH /settings/company/accounting
  updateModules: (payload) → PATCH /settings/company/modules
  updateTransactionDefaults: (payload) → PATCH /settings/company/transaction-defaults
}
```

### Step 5 — Refactor `CompanySettingsPage.tsx`

Ganti dari form tunggal ke 4 tabs:
- **Profil** — company name, address, phone, email, npwp (read-only, konfirmasi ke backend jika bisa update)
- **Akuntansi** — currency, fiscal_year_start → PATCH `/settings/company/accounting`
- **Transaksi** — auto_post_enabled, approval_required, number_formats → PATCH `/settings/company/transaction-defaults`
- **Modul** — toggle switches per module → PATCH `/settings/company/modules`

### Step 6 — Refactor `UsersPage.tsx`

Ganti endpoint dari `/settings/users` ke `/access/company-users`.  
Hapus dialog "Buat Pengguna Baru" — ganti dengan tombol "Undang Pengguna" yang link ke `/settings/invitations`.  
Tambah actions per row: Ubah Peran, Nonaktifkan/Aktifkan, Hapus dari Company.

### Step 7 — Refactor `RolesPage.tsx`

Ganti endpoint dari `/settings/roles` ke `/access/roles`.  
Tambah: tombol Create Role baru, Clone Role per row, Deactivate/Reactivate Role.  
Permission tree: PUT `/access/roles/{id}/permissions` (bukan PATCH).

### Step 8 — Simplify `MyPreferencesPage.tsx`

Hapus form preferences (language, date_format, number_format) — tidak ada backend endpoint.  
Sisakan hanya form change password (`POST /auth/change-password`).

### Step 9 — Buat `InvitationsPage.tsx`

DataTable dengan columns: email, role, status badge, sent_at, expires_at, actions.  
Actions: Kirim Ulang, Batalkan.  
Dialog: kirim undangan baru (email + role_id).

### Step 10 — Buat `AccessAuditPage.tsx`

DataTable dengan columns: created_at, user, event, description, ip_address.  
Filter inline (bukan sidebar): user, event type, date range.  
Tidak ada form/actions — read-only.

### Step 11 — Update Routes & ModuleConfig

Di `routes.tsx`: tambah route `/settings/invitations` dan `/settings/audit`.  
Di `moduleConfig.ts`: tambah ribbon items Undangan dan Audit Akses, perbaiki permission keys yang salah.

### Step 12 — Verify Build & Commit

```bash
cd /workspace/frontend
npm run build   # harus 0 error
rtk git add [files]
rtk git commit -m "refactor(settings): phase 9 — align settings & access to backend endpoints"
rtk git push
```

---

## Hal yang Harus Diperhatikan

1. **Jangan break existing data flow** — komponen lain mungkin import dari `settingsApi.ts`, cek dengan `grep -r "settingsApi" src/`
2. **Permission keys** — users: `access.users.view`, roles: `access.roles.view`, company: `settings.company.view`
3. **`coaApi.search` sudah return `SelectOption[]` langsung** — jangan wrap dengan `.then(r => r.data.map(...))`
4. **DataTable ColumnDef** — import dari `@/components/shared/table/DataTable`, bukan dari `@tanstack/react-table`
5. **cell pattern** — `cell: ({ original }) =>` bukan `cell: ({ row }) =>`

---

## Update Docs

```bash
# Update struktur_frontend.md dengan file baru yang dibuat
```
