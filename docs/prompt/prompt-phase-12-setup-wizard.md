# Prompt — Phase 12: Setup Wizard Refactor

**Phase**: 12  
**Estimasi**: 1 sesi  
**Dependencies**: Phase 11 harus selesai (karena Step5 bergantung pada opening-balance module)  
**Referensi**: `docs/praproduction_docs/spec-30-setup-wizard-refactor.md`

---

## Tugas

Refactor seluruh onboarding wizard agar endpoint sesuai backend aktual (`/setup/*`). Saat ini wizard menggunakan banyak endpoint yang tidak ada di backend.

**Baca dulu sebelum mulai:**
1. `docs/gap_docs/gap-04-setup-wizard-refactor.md` — endpoint mapping lama → baru
2. `docs/praproduction_docs/spec-30-setup-wizard-refactor.md` — per-file changes

---

## Context

Wizard onboarding saat ini menyimpan `currentStep` di local state dan menggunakan endpoint yang salah. Backend punya `/setup/*` sebagai source of truth untuk progress wizard. Mapping endpoint:

| Fungsi | Endpoint Lama (tidak ada) | Endpoint Baru |
|--------|--------------------------|---------------|
| Status wizard | tidak ada | `GET /setup/status` |
| Daftar steps | tidak ada | `GET /setup/steps` |
| Update step | tidak ada | `PATCH /setup/current-step` |
| Validasi step | tidak ada | `POST /setup/validate-step` |
| Validasi semua | tidak ada | `POST /setup/validate-all` |
| Preview OB | tidak ada | `GET /setup/opening-balance/preview` |
| Finalize | `POST /companies/{id}/complete-onboarding` | `POST /setup/finalize` |
| Reopen | tidak ada | `POST /setup/reopen` |
| Load company | `GET /companies/{id}` | `GET /settings/company` |

---

## File yang Diubah

```
src/modules/onboarding/services/onboardingApi.ts                ← rewrite penuh
src/modules/onboarding/pages/OnboardingPage.tsx                 ← ganti state management
src/modules/onboarding/components/steps/Step1CompanyInfo.tsx    ← ganti endpoint
src/modules/onboarding/components/steps/Step2TemplateCOA.tsx    ← cek/konfirmasi endpoint
src/modules/onboarding/components/steps/Step5OpeningBalance.tsx ← (sudah di-fix di Phase 11)
src/modules/onboarding/components/steps/Step6Complete.tsx       ← ganti endpoint finalize
```

---

## Urutan Pekerjaan

### Step 1 — Rewrite `onboardingApi.ts`

```ts
import { http } from '@/services/http'

export const setupApi = {
  getStatus:    () =>
    http.get('/setup/status'),

  getSteps:     () =>
    http.get('/setup/steps'),

  updateCurrentStep: (step: string) =>
    http.patch('/setup/current-step', { step }),

  validateStep: (step: string, data?: Record<string, unknown>) =>
    http.post('/setup/validate-step', { step, ...data }),

  validateAll:  () =>
    http.post('/setup/validate-all'),

  getOBPreview: () =>
    http.get('/setup/opening-balance/preview'),

  finalize:     () =>
    http.post('/setup/finalize'),

  reopen:       () =>
    http.post('/setup/reopen'),
}

// Tetap ada (endpoint sudah benar):
export const accountMappingSetupApi = {
  list:   () =>
    http.get('/master-data/account-mappings'),
  update: (key: string, payload: { account_id: number }) =>
    http.patch(`/master-data/account-mappings/${key}`, payload),
}
```

Hapus semua fungsi lama yang menggunakan `/companies/{id}/*`.

### Step 2 — Refactor `OnboardingPage.tsx`

**Sebelum**: `currentStep` dan `completedSteps` disimpan di `useState` lokal.

**Sesudah**: Semua dari `GET /setup/status` sebagai source of truth.

```ts
interface SetupStatus {
  current_step: string
  completed_steps: string[]
  is_finalized: boolean
  can_finalize: boolean
}

// Query:
const { data: statusData } = useQuery({
  queryKey: ['setup', 'status'],
  queryFn: setupApi.getStatus,
  staleTime: 0,  // selalu fresh
})

// Saat mount: jika statusData.is_finalized → navigate ke /
```

Saat user selesai satu step dan klik "Lanjut":
1. Call `POST /setup/validate-step { step: currentStep }` 
2. Jika sukses → call `PATCH /setup/current-step { step: nextStep }`
3. Invalidate query `['setup', 'status']` untuk refresh

### Step 3 — Refactor `Step1CompanyInfo.tsx`

```ts
// Load: GET /settings/company (gunakan companySettingsApi.get dari Phase 9)
// Update: PATCH /settings/company/accounting
//   → fiscal_year_start, currency saja
//   → nama perusahaan tampilkan read-only
// Validasi step: POST /setup/validate-step { step: 'company_info' }
```

### Step 4 — Cek `Step2TemplateCOA.tsx`

Konfirmasi endpoint yang tersedia di backend. Cek di `/workspace/laravel_backend/app/Modules/Setup/Routes/api.php` atau endpoint serupa.

Kemungkinan:
- `POST /setup/select-coa-template` ada → gunakan langsung
- Tidak ada endpoint khusus → kirim sebagai bagian dari `POST /setup/validate-step { step: 'coa_template', template: 'xxx' }`

### Step 5 — Refactor `Step6Complete.tsx`

```ts
// Ganti:
//   POST /companies/{id}/complete-onboarding
// Menjadi 2 langkah:
//   1. POST /setup/validate-all
//   2. Jika OK → POST /setup/finalize
//   3. Setelah finalize → navigate ke /

const handleFinalize = async () => {
  await setupApi.validateAll()
  await setupApi.finalize()
  navigate('/')
}
```

### Step 6 — Verify Build & Commit

```bash
cd /workspace/frontend
npm run build   # harus 0 error
rtk git add src/modules/onboarding/
rtk git commit -m "refactor(onboarding): phase 12 — align setup wizard to /setup/* endpoints"
rtk git push
```

---

## Hal yang Harus Diperhatikan

1. **Cek isi file-file saat ini sebelum edit** — onboarding module mungkin sudah ada partial implementation
2. **Jangan break Step 3 (AccountMapping)** — endpoint `/master-data/account-mappings` sudah benar, jangan diubah
3. **Baca dari backend source** — cek `/workspace/laravel_backend/app/Modules/Setup/Routes/api.php` untuk konfirmasi endpoint yang tersedia
4. **Jika endpoint tidak ada di backend** — jangan buat implementasi yang gagal; tulis TODO comment dan skip step tersebut
5. **`staleTime: 0`** di setup status query — penting agar wizard selalu sync dengan backend setelah setiap action
