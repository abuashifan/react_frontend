# Spec-30 — Phase 12: Setup Wizard Refactor

**Phase**: 12  
**Tipe**: Refactor  
**Estimasi**: 1 sesi  
**Referensi**: gap-04

---

## Scope

Ganti semua endpoint onboarding dari endpoint lama yang tidak ada ke `/setup/*` yang aktual di backend.

---

## Endpoint Mapping (Lama → Baru)

| Fungsi | Endpoint Lama (tidak ada) | Endpoint Baru |
|--------|--------------------------|---------------|
| Status wizard | tidak ada | `GET /setup/status` |
| Daftar steps | tidak ada | `GET /setup/steps` |
| Update step aktif | tidak ada | `PATCH /setup/current-step` |
| Validasi satu step | tidak ada | `POST /setup/validate-step` |
| Validasi semua | tidak ada | `POST /setup/validate-all` |
| Preview OB | tidak ada | `GET /setup/opening-balance/preview` |
| Finalize setup | `POST /companies/{id}/complete-onboarding` | `POST /setup/finalize` |
| Reopen setup | tidak ada | `POST /setup/reopen` |
| Load company info | `GET /companies/{id}` | `GET /settings/company` |
| Pilih COA template | `POST /companies/{id}/coa-template` | ❓ Konfirmasi ke backend |
| Simpan OB | `POST /accounting/opening-balances` | Redirect ke `/opening-balance` |

---

## File yang Diubah

### `src/modules/onboarding/services/onboardingApi.ts`

Rewrite penuh:

```ts
export const setupApi = {
  getStatus:         ()           → GET  /setup/status
  getSteps:          ()           → GET  /setup/steps
  updateCurrentStep: (step)       → PATCH /setup/current-step
  validateStep:      (step, data) → POST /setup/validate-step
  validateAll:       ()           → POST /setup/validate-all
  getOBPreview:      ()           → GET  /setup/opening-balance/preview
  finalize:          ()           → POST /setup/finalize
  reopen:            ()           → POST /setup/reopen
}

// Tetap ada untuk Step3 (sudah benar):
export const accountMappingSetupApi = {
  list:   () → GET /master-data/account-mappings
  update: (key, payload) → PATCH /master-data/account-mappings/{key}
}
```

### `src/modules/onboarding/pages/OnboardingPage.tsx`

```tsx
// Ganti: state wizard (currentStep, completedSteps) dari state lokal
// Menjadi: ambil dari GET /setup/status dan GET /setup/steps sebagai source of truth

// Saat mount: GET /setup/status → jika status === 'finalized' → redirect ke /
// Setiap step complete → POST /setup/validate-step, lalu GET /setup/status untuk refresh
```

### `src/modules/onboarding/components/steps/Step1CompanyInfo.tsx`

```tsx
// Load data: GET /settings/company
// Update: PATCH /settings/company/accounting (hanya fiscal_year_start dan currency)
// Nama perusahaan: tampilkan read-only (tidak ada endpoint update nama)
// Validasi step: POST /setup/validate-step { step: 'company_info' }
```

### `src/modules/onboarding/components/steps/Step2TemplateCOA.tsx`

```tsx
// ⚠️ PERLU KONFIRMASI ke backend
// Kemungkinan endpoint: POST /setup/select-coa-template atau bagian dari validate-step
// Sementara: tampilkan pilihan template, lalu POST /setup/validate-step { step: 'coa_template', template: 'xxx' }
```

### `src/modules/onboarding/components/steps/Step5OpeningBalance.tsx`

```tsx
// Ganti dari form input inline
// Menjadi: tampilkan status OB dari GET /setup/opening-balance/preview
// Jika belum ada OB → tampilkan [Buka Halaman Input Saldo Awal] (link ke /opening-balance)
// Jika sudah ada OB → tampilkan summary (debit, kredit, selisih)
// Validasi: POST /setup/validate-step { step: 'opening_balance' }
```

### `src/modules/onboarding/components/steps/Step6Complete.tsx`

```tsx
// Ganti: POST /companies/{id}/complete-onboarding
// Menjadi: POST /setup/validate-all → jika OK → POST /setup/finalize
// Setelah finalize: redirect ke /
```

---

## State Management

Saat ini `OnboardingPage` menyimpan `currentStep` di local state `useState`.  
Setelah refactor, source of truth adalah `GET /setup/status`:

```ts
interface SetupStatus {
  current_step: string
  completed_steps: string[]
  is_finalized: boolean
  can_finalize: boolean
}
```

Gunakan `useQuery` dengan `staleTime: 0` agar selalu fresh setelah setiap step action.

---

## Build & Commit

```bash
npm run build   # harus 0 error
git commit -m "refactor(onboarding): phase 12 — align setup wizard to /setup/* endpoints"
git push
```
