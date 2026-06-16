# Issue-05 — Settings Pages Pakai Endpoint Salah

**Tipe**: Bug  
**Severity**: Critical  
**Estimasi fix**: 1 sesi (refactor settings module)  
**Referensi**: [gap-02-settings-access-mismatch.md](../gap_docs/gap-02-settings-access-mismatch.md)

---

## Deskripsi

Semua settings pages yang dibuat di Phase 7 memanggil endpoint yang tidak ada di backend. Setiap save/load akan gagal 404.

---

## Mapping Endpoint (Salah → Benar)

### Company Settings

| Page | Endpoint Lama (salah) | Endpoint Baru (benar) |
|------|-----------------------|----------------------|
| Company profile GET | `GET /settings/company` | `GET /settings/company` ✅ (sama) |
| Company profile workflow | tidak ada | `GET /settings/company/workflow` |
| Update accounting | `PATCH /settings/company` | `PATCH /settings/company/accounting` |
| Update modules | tidak ada | `PATCH /settings/company/modules` |
| Update transaction defaults | `PATCH /settings/transactions` | `PATCH /settings/company/transaction-defaults` |

### Access / Users & Roles

| Page | Endpoint Lama (salah) | Endpoint Baru (benar) |
|------|-----------------------|----------------------|
| Users list | `GET /settings/users` | `GET /access/company-users` |
| User detail | `GET /settings/users/{id}` | `GET /access/company-users/{id}` |
| Update user role | `PATCH /settings/users/{id}` | `PATCH /access/company-users/{id}/role` |
| Deactivate user | `PATCH /settings/users/{id}/deactivate` | `PATCH /access/company-users/{id}/deactivate` |
| Activate user | `PATCH /settings/users/{id}/activate` | `PATCH /access/company-users/{id}/reactivate` |
| Create user | `POST /settings/users` | ❌ Tidak ada endpoint create user (hanya invite via `/access/invitations`) |
| Roles list | `GET /settings/roles` | `GET /access/roles` |
| Role detail | `GET /settings/roles/{id}` | `GET /access/roles/{id}` |
| Update role permissions | `PATCH /settings/roles/{id}/permissions` | `PUT /access/roles/{id}/permissions` |

### User Preferences

| Page | Endpoint Lama (salah) | Status |
|------|-----------------------|--------|
| Preferences GET | `GET /settings/preferences` | ❌ Tidak ada di backend |
| Preferences PATCH | `PATCH /settings/preferences` | ❌ Tidak ada di backend |

---

## Rencana Perubahan File

### Hapus / Rewrite

```
src/modules/settings/services/settingsApi.ts
  → Pisah jadi 2: companySettingsApi.ts + pindahkan access ke accessApi.ts

src/modules/settings/hooks/useSettings.ts
  → Pisah sesuai api baru
```

### Ubah Pages

```
CompanySettingsPage.tsx    → Split: profile section + accounting section + module toggles
TransactionSettingsPage.tsx → Endpoint ke /settings/company/transaction-defaults
UsersPage.tsx              → Endpoint ke /access/company-users; hapus "Tambah" (ganti ke Invite)
RolesPage.tsx              → Endpoint ke /access/roles; tambah create/clone role
MyPreferencesPage.tsx      → Hapus preferences form (tidak ada endpoint); sisakan change password saja
```

### Tambah Pages Baru

```
InvitationsPage.tsx    → /access/invitations (list, invite, resend, revoke)
AccessAuditPage.tsx    → /access/audit (tabel log akses)
```

### Tambah Ribbon Items

```ts
{ id: 'invitations',  label: 'Undangan',    icon: Mail,      path: '/settings/invitations',  permission: 'access.invitations.view' }
{ id: 'access-audit', label: 'Audit Akses', icon: ClipboardList, path: '/settings/audit',    permission: 'access.audit.view' }
```
