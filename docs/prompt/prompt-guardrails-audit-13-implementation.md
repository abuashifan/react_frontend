# Prompt Guardrails — Audit-13 Implementation

Tanggal dibuat: 2026-06-21  
Status: Aktif — wajib untuk Phase 24–39  
Scope: Remediation Audit-13 lintas frontend dan backend  
Spec canonical: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap canonical: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`

---

## 1. Fungsi Prompt Ini

Gunakan prompt guardrails ini pada awal setiap sesi implementasi Phase 24–39.

Dokumen ini memastikan agent:

- memilih phase berdasarkan dependency GAP-10;
- tidak mengulang atau merusak behavior yang sudah benar;
- menetapkan kontrak end-to-end sebelum coding;
- memperbaiki frontend dan/atau backend pada layer yang benar;
- menjaga tenancy, permission, accounting, inventory, lifecycle, dan audit trail;
- menambahkan regression test;
- memvalidasi setiap finding phase satu per satu setelah implementation;
- tidak menutup phase sebelum seluruh finding scope berstatus `verified`.

Dokumen ini bukan pengganti prompt phase. Setiap phase tetap harus memiliki `prompt-phase-{n}-*.md` yang berisi scope dan execution checklist spesifik.

---

## 2. Prompt Pembuka Wajib

Agent yang menjalankan phase harus menggunakan instruksi berikut:

```text
Kerjakan hanya Phase <N> Audit-13 sesuai GAP-10.

Baca dan patuhi:
1. /workspace/frontend/AGENTS.md
2. /workspace/frontend/docs/AGENT_ENTRY_POINT.md
3. /workspace/frontend/docs/praproduction_docs/spec-37-audit-13-remediation.md
4. /workspace/frontend/docs/audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md
5. /workspace/frontend/docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
6. /workspace/frontend/docs/prompt/prompt-guardrails-audit-13-implementation.md
7. Issue/spec/prompt khusus Phase <N>

Jangan coding sebelum:
- dependency phase dikonfirmasi;
- seluruh finding scope diinventarisasi;
- source frontend dan backend aktual dibaca;
- contract matrix dibuat;
- acceptance criteria per finding ditetapkan;
- baseline regression test ditentukan.

Setelah implementation:
- jalankan mandatory phase validation gate Spec-37 §17.1;
- validasi setiap finding satu per satu;
- pastikan total finding phase = total checklist = total verified;
- jika ada finding gagal atau regression baru, phase tetap in-progress;
- update seluruh dokumen tracking dan evidence.
```

---

## 3. Dokumen Wajib Dibaca

### 3.1 Selalu

```text
/workspace/frontend/AGENTS.md
/workspace/frontend/docs/AGENT_ENTRY_POINT.md
/workspace/frontend/docs/praproduction_docs/spec-37-audit-13-remediation.md
/workspace/frontend/docs/audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md
/workspace/frontend/docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
/workspace/frontend/docs/prompt/prompt-guardrails-audit-13-implementation.md
```

### 3.2 Berdasarkan phase

```text
issue detail phase
spec tambahan phase jika diperlukan
prompt-phase-{n}-*.md
finding Audit-13 yang masuk phase
source dan test frontend terkait
```

### 3.3 Jika backend berubah

```text
/workspace/laravel_backend/AGENTS.md
/workspace/laravel_backend/docs/backend-directory-tree.md
/workspace/laravel_backend/docs/backend-modular-monolith-plan.md
backend implementation plan terkait
route
middleware/policy
FormRequest
controller/action
service
model
migration
Resource/serializer
feature test
```

### 3.4 Jika UI/layout berubah

```text
spec-23-tablet-first-layout-rules.md
design doc komponen terkait
spec-25-viewport-list.md jika membutuhkan data viewport
```

### 3.5 Jika transaksi/accounting berubah

```text
spec-08-form-architecture.md
spec-10-document-workflow.md
audit-08-business-rules-and-validation-map.md
audit workflow domain terkait
```

---

## 4. Aturan Supersession

Dokumen Audit-13 aktif mengalahkan guardrail historis yang bertentangan.

### 4.1 Router dan hidden URL

Aturan Audit-11 yang mewajibkan:

```text
createMemoryRouter
address bar selalu root
internal route disembunyikan
deep-link bukan target
```

telah **superseded** oleh Audit-13 A13-059/A13-271 dan Phase 24.

Target baru:

- browser URL merepresentasikan route yang dapat dibuka langsung;
- refresh mempertahankan halaman;
- deep-link bekerja;
- back/forward bekerja;
- auth redirect mempertahankan destination;
- virtual tabs tetap berfungsi tanpa menjadi alasan menyembunyikan URL;
- deployment fallback dikonfigurasi untuk SPA route.

Jangan mengikuti prompt guardrails Audit-11 §6 untuk Phase 24–39.

### 4.2 Backend read-only

Semua aturan lama yang menyatakan backend read-only telah superseded.

Backend boleh diperbaiki jika:

- source of truth atau business rule berada di backend;
- validation/permission/tenancy salah;
- endpoint atau response contract salah;
- accounting/inventory side effect salah;
- fix frontend saja akan menyembunyikan root cause.

Perubahan backend tetap wajib scoped, tested, tenant-safe, transaction-safe, dan mengikuti backend `AGENTS.md`.

### 4.3 Phase lama

Phase 1–23 tidak dijalankan ulang sebagai phase aktif. Primitive lama boleh dipakai atau diperbaiki jika diperlukan oleh Phase 24–39.

---

## 5. Scope Discipline

Sebelum coding, tulis:

```text
Phase:
Finding scope:
Dependency selesai:
Frontend module/files:
Backend module/files:
Invariant terdampak:
Contract decisions:
Out of scope:
Verification environment:
```

Aturan:

- Jangan mengambil finding dari phase lain tanpa dependency yang jelas.
- Jangan melakukan redesign global.
- Jangan melakukan cleanup luas yang tidak mendukung acceptance phase.
- Jangan mengubah shared primitive tanpa menginventarisasi consumer.
- Jangan menyelesaikan gejala di banyak page jika root cause berada pada satu adapter/service.
- Jika perubahan phase menimbulkan regression di luar phase, regression tersebut masuk scope wajib sampai pulih.
- Jika user mengubah prioritas, update GAP-10 dan dokumentasikan dependency yang dilompati.

---

## 6. Preflight Wajib

### 6.1 Worktree safety

```text
1. Periksa status frontend.
2. Periksa status backend jika disentuh.
3. Identifikasi perubahan existing milik user.
4. Jangan overwrite atau revert perubahan unrelated.
5. Catat file overlap sebelum edit.
```

### 6.2 Baseline

- Jalankan test tersempit yang relevan.
- Reproduksi finding bila aman.
- Catat apakah evidence berasal dari source-only, local, route-mock, atau live-read-only.
- Catat baseline console/network.
- Ambil screenshot hanya jika membantu visual/responsive evidence.

### 6.3 Coverage

Ambil daftar finding phase dari GAP-10 coverage matrix.

Buat tabel awal:

| Finding | Severity | Reproduced | Root cause | Layer fix | Acceptance | Test plan |
|---|---|---|---|---|---|---|
| A13-XXX | | | | frontend/backend/both | | |

Tidak boleh mulai implementation jika ada finding phase yang belum masuk tabel.

---

## 7. Contract Freeze Sebelum Coding

Untuk setiap resource/workflow, isi:

| Concern | Canonical decision | Evidence |
|---|---|---|
| Route | | backend route |
| Method | | backend route |
| Permission | | middleware/policy |
| Tenant scope | | query/service |
| Request DTO | | FormRequest |
| Response DTO | | Resource/test/runtime |
| Error shape | | exception handler/test |
| Lifecycle | | service/model/test |
| Side effects | | service/test |
| Idempotency | | service/schema/test |
| Compatibility | | consumer inventory |
| Frontend adapter | | service/type |
| Runtime verification | | Playwright/local |

Larangan:

- Jangan menebak field atau route.
- Jangan hanya membaca TypeScript interface.
- Jangan hanya membaca controller tanpa service/test.
- Jangan mempertahankan broken contract karena frontend saat ini memakainya.
- Jangan membuat endpoint baru sebelum memeriksa endpoint canonical yang sudah ada.
- Jangan melakukan global response normalization untuk perbedaan domain.

---

## 8. Guardrail Frontend

### 8.1 Data flow

- API call hanya melalui module service.
- TanStack Query untuk server state.
- Zustand hanya untuk UI/auth state.
- Request dan response adapter typed.
- Runtime guard untuk external/unknown response.
- Query key company-aware jika data tenant-specific.
- Invalidation spesifik.

### 8.2 Form

- React Hook Form + Zod.
- Backend field error dipetakan ke control.
- Date, decimal, enum, nullability mengikuti contract.
- Draft scoped per user/company/form/document.
- Posted/locked document tidak editable.
- Double submit dicegah.
- Source document diwajibkan bila workflow membutuhkannya.

### 8.3 Error

Jangan mengubah:

```text
500/422/403/404/network error
```

menjadi:

```text
[]
null
0
"belum ada data"
```

tanpa evidence bahwa response tersebut memang success-empty.

Setiap surface membedakan loading, empty, validation, forbidden, not-found, conflict, server error, dan unexpected response.

### 8.4 Permission/lifecycle

- UI action mengikuti permission dan status.
- Backend tetap enforcement final.
- Jangan hardcode role name.
- Jangan hanya menyembunyikan action berbahaya; backend wajib menolak.

### 8.5 Layout/accessibility

- Gunakan `dvh`, bukan `vh`.
- Compact mode sesuai Spec-23.
- Tidak ada root/body double scroll.
- Dialog/dropdown aman pada viewport pendek.
- Label, accessible name, error association, keyboard, focus, dan semantics benar.
- Angka memakai `tabular-nums`.
- Jangan edit `src/components/ui/`.

### 8.6 Type safety

- Jangan memakai `any` tanpa justifikasi.
- Jangan cast malformed response agar TypeScript diam.
- Jangan memakai optional chaining untuk menyamarkan contract yang seharusnya required.
- Formatter harus tahan null/invalid, tetapi error contract tetap terlihat.

---

## 9. Guardrail Backend

### 9.1 Tenant dan permission

- Semua query/write tenant-scoped.
- Cross-tenant ID ditolak.
- Middleware/policy permission tepat.
- Jangan mempercayai company ID payload.
- Self/last-owner guard server-side.

### 9.2 Validation

- FormRequest untuk input.
- Reference aktif dan tenant-scoped.
- Status transition, amount, quantity, outstanding, date, fiscal year, dan period lock dienforce server-side.
- Error shape stabil.

### 9.3 Business service

- Business logic di service.
- Multi-write dalam database transaction.
- Concurrency/double-submit dipertimbangkan.
- Posting/void/reversal/allocation/movement/capitalization/period-end idempotent sesuai kebutuhan.
- Failure rollback seluruh side effect yang tidak boleh parsial.

### 9.4 Accounting/inventory

- Debit = credit.
- Posted journal immutable.
- Control account terlindungi.
- Source-journal linkage tersedia.
- Negative stock mengikuti policy.
- Return/allocation tidak melebihi source.
- Void/reversal traceable.
- Cutoff/as-of benar.

### 9.5 Schema dan data

- Schema change melalui migration.
- Analisis existing data sebelum constraint.
- Repair melalui command/migration testable.
- Jangan edit database file.
- Jangan menjalankan repair/migration pada production.

### 9.6 Test

Mutating endpoint minimal menguji:

- happy path;
- unauthorized;
- cross-tenant;
- invalid reference;
- invalid lifecycle;
- period/date lock;
- duplicate/retry;
- rollback;
- side effect;
- void/reversal bila ada.

---

## 10. Runtime Safety

Deployment audit:

```text
URL      : https://app.finlite.my.id/
Email    : admin@example.com
Password : password
```

Live environment default adalah read-only.

Aturan:

- Jangan meneruskan mutation live tanpa izin eksplisit.
- Intercept mutation bila hanya perlu memvalidasi request UI.
- Gunakan local disposable database untuk side effect.
- Data test memakai prefix `AUDIT-`.
- Jangan menyentuh data bisnis existing.
- Jangan menampilkan credential pada log/report di luar konteks dokumentasi internal yang sudah diizinkan.

Environment label:

```text
source-only
frontend-local
backend-local
route-mock
live-read-only
live-mutating — memerlukan izin eksplisit
```

---

## 11. Implementation Sequence

Urutan wajib:

```text
1. Preflight
2. Finding inventory
3. Root-cause analysis
4. Contract freeze
5. Characterization/failing regression test
6. Backend implementation jika diperlukan
7. Frontend implementation
8. Targeted automated tests
9. Build/lint/static checks
10. Runtime retest
11. Exploratory regression pass
12. Finding-by-finding reconciliation
13. Documentation update
14. Phase completion decision
```

Jangan langsung melompat dari implementation ke status `Done`.

---

## 12. Mandatory Phase Validation Gate

Setelah refactor/perbaikan selesai, lakukan validation pass terpisah.

### 12.1 Checklist per finding

| Finding | Original scenario | Automated test | Runtime retest | Invariant | Regression | Status | Evidence |
|---|---|---|---|---|---|---|---|
| A13-XXX | | | | | | `verified` | |

### 12.2 Persamaan kelulusan

```text
total finding pada coverage phase
= total baris checklist
= total finding verified
```

### 12.3 Wajib dilakukan

1. Reproduce ulang original scenario.
2. Jalankan automated test yang membuktikan fix.
3. Jalankan runtime test pada environment yang sesuai.
4. Verifikasi invariant domain.
5. Periksa console, network, dan renderer.
6. Uji consumer/shared primitive terkait.
7. Jalankan exploratory workflow pass.
8. Catat regression baru.
9. Perbaiki dan verifikasi regression yang disebabkan phase.
10. Update Audit-13 per finding.

### 12.4 Phase tetap in-progress jika

- satu finding belum diretest;
- satu finding hanya `fixed`;
- evidence hanya berupa build/lint;
- backend finding hanya diuji dengan route-mock;
- visual/responsive finding hanya diuji unit test;
- regression baru belum selesai;
- coverage matrix dan checklist tidak sama;
- test gagal atau tidak dijalankan tanpa keputusan eksplisit.

### 12.5 Exception

Finding hanya dapat dikecualikan melalui keputusan eksplisit user.

Dokumentasikan:

```text
Finding:
Alasan:
Risiko:
Status: blocked | wont-fix | deferred
Persetujuan:
Follow-up:
```

Phase dengan exception tidak boleh dilaporkan sebagai “seluruh temuan telah diperbaiki”.

---

## 13. Verification Commands

Frontend:

```bash
cd /workspace/frontend
npm run build
npm run lint
npx playwright test <scope>
```

Backend:

```bash
cd /workspace/laravel_backend
php artisan test --filter=<scope>
vendor/bin/pint --test
```

Tambahkan broader test bila perubahan memengaruhi shared service, accounting posting, stock movement, permission, router, atau serialization global.

Jangan menyatakan command lulus jika tidak dijalankan.

---

## 14. Minimum Browser Matrix

```text
Desktop normal    1440 x 900
Laptop pendek     1366 x 620
Tablet landscape  1180 x 820
Tablet portrait   820 x 1180
Mobile sanity     390 x 844
```

Per page yang berubah, uji sesuai relevansi:

- loading;
- populated;
- empty success;
- API error;
- unexpected response;
- permission;
- validation;
- primary mutation;
- refresh/deep-link;
- keyboard/focus;
- short viewport;
- console/network.

---

## 15. Phase Dependency Guard

| Phase | Jangan mulai sebelum |
|---:|---|
| 24 | Baseline Audit-13 dan guardrails tersedia |
| 25 | Phase 24 verified |
| 26 | Phase 24–25 verified |
| 27 | Phase 24 dan 26 verified |
| 28 | Phase 24–27 dependency terkait verified |
| 29 | Phase 28 verified |
| 30 | Phase 24–27 dependency terkait verified |
| 31 | Phase 30 verified |
| 32 | Phase 25, 28, 30 verified |
| 33 | Phase 24–26 verified |
| 34 | Phase 33 verified |
| 35 | Phase 26, 29, 31, 32, 34 verified |
| 36 | Phase 29, 31, 32, 34, 35 verified |
| 37 | Phase 24–26 verified |
| 38 | Phase 25–37 primary work selesai dan verified |
| 39 | Phase 24–38 validation gates lulus |

Jika dependency hanya `fixed`, phase berikutnya belum boleh dimulai kecuali user menyetujui risiko eksplisit.

---

## 16. Dokumentasi Setelah Phase

Wajib update:

```text
Audit-13:
- status per finding
- evidence
- regression baru

GAP-10:
- status phase
- validation summary
- dependency phase berikutnya

Issue/spec/prompt phase:
- contract decision
- implementation
- test result
- residual risk

AGENTS.md:
- phase status
- build/test status
- next action

struktur_frontend.md:
- file baru/pindah/hapus

Backend docs:
- architecture/contract/migration/repair decision
```

---

## 17. Completion Report Wajib

```markdown
# Phase <N> Completion and Validation Report

## Scope
- Finding count:
- Finding IDs:
- Modules:

## Contract decisions
- ...

## Changes
- Frontend:
- Backend:
- Migration:

## Automated verification
- Frontend build:
- Frontend lint:
- Playwright:
- Backend feature tests:
- Pint:

## Runtime environment
- ...

## Finding reconciliation
| Finding | Automated | Runtime | Invariant | Regression | Status | Evidence |
|---|---|---|---|---|---|---|

## Reconciliation totals
- Coverage findings:
- Checklist rows:
- Verified:
- Failed:
- Blocked:
- Regression new:

## Exit decision
- Phase complete | Phase remains in-progress
- Reason:

## Residual risk
- ...

## Next phase
- ...
```

---

## 18. Stop and Escalate

Berhenti dan minta keputusan jika:

- accounting/inventory rule ambigu;
- breaking API memengaruhi consumer tidak dikenal;
- destructive migration/data repair dibutuhkan;
- production mutation dibutuhkan;
- test environment tidak cukup membuktikan integrity;
- permission model memerlukan keputusan organisasi;
- user changes bertabrakan dan tidak dapat dipertahankan;
- source, test, dan dokumen menghasilkan canonical contract berbeda.

Jangan mengisi gap keputusan dengan asumsi.

---

## 19. Immediate Usage

Paket Audit-13 saat ini:

```text
Audit-13       : selesai sebagai baseline
Spec-37        : selesai
GAP-10         : selesai
Prompt guardrail: selesai
Phase aktif    : Phase 24
Issue Phase 24 : selesai — issue-27-phase-24-runtime-router-foundation.md
Prompt Phase 24: belum dibuat
Implementation : belum dimulai
```

Langkah berikut:

1. baca `issue-27-phase-24-runtime-router-foundation.md`;
2. buat `prompt-phase-24-remediation-foundation-router.md`;
3. kunci open decisions Phase 24;
4. buat baseline Playwright;
5. implementasikan Phase 24;
6. jalankan mandatory validation gate.
