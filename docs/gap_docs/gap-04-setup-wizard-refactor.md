# GAP-04 — Setup Wizard Refactor

**Severity**: 🟠 High  
**Tipe**: Onboarding frontend memakai endpoint lama yang tidak ada di backend

---

## Kondisi Saat Ini

`src/modules/onboarding/services/onboardingApi.ts` memanggil:
- `GET /companies/{companyId}` — untuk ambil data company
- `PATCH /companies/{companyId}` — untuk simpan company info
- `POST /companies/{companyId}/coa-template` — untuk pilih template COA
- `POST /companies/{companyId}/complete-onboarding` — untuk finalisasi
- `POST /accounting/opening-balances` — untuk simpan opening balance

**Semua endpoint ini tidak ada di backend aktual.**

---

## Backend Endpoint Aktual (Setup Module)

```
GET    /setup/status           permission: setup.view    — status wizard (step berapa, apa saja sudah selesai)
GET    /setup/steps            permission: setup.view    — list semua step dengan status
PATCH  /setup/current-step     permission: setup.edit    — update step aktif
POST   /setup/validate-step    permission: setup.validate — validasi satu step
POST   /setup/validate-all     permission: setup.validate — validasi semua step
GET    /setup/opening-balance/preview  permission: setup.view — preview OB
POST   /setup/finalize         permission: setup.finalize — finalisasi setup
POST   /setup/reopen           permission: setup.reopen  — buka kembali setup
```

Plus backend lain yang dibutuhkan setup:
- `GET /settings/company` — untuk ambil/tampil company info
- `PATCH /settings/company` — tidak ada! (update company profile tidak ada endpoint tersendiri selain accounting/modules/transaction-defaults)
- `GET /master-data/chart-of-accounts` — untuk lihat COA setelah template dipilih
- `GET /opening-balance/batches` + `PUT /batches/{batch}/lines` — untuk input opening balance

**Note penting**: Tidak ada endpoint untuk update nama perusahaan/alamat via setup. Kemungkinan data ini sudah ada dari registrasi. Perlu klarifikasi ke backend developer.

---

## Yang Perlu Direfactor

### 1. `onboardingApi.ts` — Ganti semua endpoint

```ts
// Baru
setupApi.getStatus()         → GET /setup/status
setupApi.getSteps()          → GET /setup/steps
setupApi.updateCurrentStep() → PATCH /setup/current-step
setupApi.validateStep(step)  → POST /setup/validate-step
setupApi.validateAll()       → POST /setup/validate-all
setupApi.getOBPreview()      → GET /setup/opening-balance/preview
setupApi.finalize()          → POST /setup/finalize
setupApi.reopen()            → POST /setup/reopen
```

### 2. Step Components yang perlu disesuaikan

| Step | Perubahan |
|------|-----------|
| `Step1CompanyInfo` | Gunakan `GET /settings/company` untuk load data. Update via `PATCH /settings/company/accounting` (hanya field accounting). Company name mungkin read-only di sini. |
| `Step2TemplateCOA` | Endpoint belum jelas — perlu konfirmasi ke backend: apakah ada `POST /setup/select-coa-template`? |
| `Step3AccountMapping` | Sudah pakai `/master-data/account-mappings` — ✅ benar |
| `Step4MasterData` | Sudah pakai master-data endpoints — ✅ benar |
| `Step5OpeningBalance` | Ganti dari `POST /accounting/opening-balances` ke `POST /opening-balance/batches` + `PUT /batches/{batch}/lines` + `POST /batches/{batch}/validate` |
| `Step6Complete` | Ganti `POST /companies/{id}/complete-onboarding` ke `POST /setup/finalize` |

### 3. State management wizard

Saat ini wizard state (step aktif, completed steps) disimpan di frontend state lokal.  
Harus migrasi ke: ambil dari `GET /setup/status` dan `GET /setup/steps` sebagai source of truth.

### 4. File yang perlu diubah

```
src/modules/onboarding/services/onboardingApi.ts   — rewrite seluruh file
src/modules/onboarding/pages/OnboardingPage.tsx    — state dari /setup/status
src/modules/onboarding/components/steps/Step1CompanyInfo.tsx
src/modules/onboarding/components/steps/Step5OpeningBalance.tsx
src/modules/onboarding/components/steps/Step6Complete.tsx
```

---

## Catatan Risiko

- Step 2 (Template COA) paling tidak jelas endpoint-nya. Mungkin sudah include di `POST /setup/validate-step` atau ada endpoint tersendiri yang belum terlihat.
- Sebelum implement, **wajib konfirmasi ke backend** endpoint untuk COA template selection dan company profile update.
