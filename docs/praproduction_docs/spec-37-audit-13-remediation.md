# Spec-37 — Audit-13 Remediation and Safe Agent Handoff

Tanggal dibuat: 2026-06-21  
Status: Aktif — aturan canonical remediation Audit-13  
Scope frontend: `/workspace/frontend`  
Scope backend: `/workspace/laravel_backend`  
Roadmap aktif: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Baseline audit: `../audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md`

---

## 1. Tujuan Dokumen

Dokumen ini adalah spesifikasi kerja lintas sesi untuk memperbaiki seluruh finding Audit-13 dengan aman. Agent baru tanpa memori percakapan sebelumnya harus dapat mengetahui:

- posisi project dan status terakhir;
- sumber kebenaran dan dokumen yang wajib dibaca;
- apa yang sudah selesai dan apa yang belum;
- urutan phase yang harus dijalankan;
- perubahan yang diizinkan di frontend dan backend;
- invariant bisnis yang tidak boleh rusak;
- cara menetapkan kontrak API canonical;
- cara mengimplementasikan, menguji, dan menutup finding;
- kondisi yang mewajibkan agent berhenti dan melakukan eskalasi.

Dokumen ini mengatur **cara remediation dilakukan**. Daftar finding lengkap tetap berada di Audit-13, sedangkan urutan implementasi lengkap berada di GAP-10.

---

## 2. Handoff Status Terkini

Status per 2026-06-21:

| Item | Status |
|---|---|
| Implementation Phase 1–23 | Selesai secara tracking |
| Audit-13 coverage | Selesai |
| Area baseline Audit-13 | 105 |
| Total finding Audit-13 | 280 |
| Critical / P0 | 60 |
| High / P1 | 119 |
| Medium / P2 | 90 |
| Low / P3 | 11 |
| Finding open | 279 |
| Finding verified | 1 |
| Roadmap remediation | GAP-10, Phase 24–39 |
| Prompt guardrails Audit-13 | Selesai |
| Phase aktif berikutnya | Phase 24 |
| Implementasi Audit-13 | Belum dimulai |
| Issue detail Phase 24 | Selesai — `issue-27-phase-24-runtime-router-foundation.md` |
| Prompt Phase 24 | Belum dibuat; wajib dibuat sebelum coding |
| Backend modification | Diizinkan secara scoped |

Interpretasi:

- `Phase 1–23 Done` tidak berarti fitur bebas bug atau contract mismatch.
- Audit-13 adalah baseline terbaru yang menggantikan asumsi kelengkapan phase lama.
- `Audit selesai` berarti coverage audit selesai, bukan aplikasi production-ready.
- Finding tidak boleh dianggap selesai hanya karena code telah diubah.
- Finding baru `verified` setelah automated test dan runtime retest lulus.

Baseline verification terakhir:

```text
Frontend build : lulus, 0 TypeScript error
Frontend lint  : 0 error; 35 warning legacy
Browser audit  : Playwright Chromium headless
Live mutation  : tidak dilakukan pada audit penutup Period-End
```

Agent wajib memeriksa ulang worktree dan test sebelum mengklaim status yang sama pada sesi berikutnya.

---

## 3. Urutan Baca Wajib

### 3.1 Setiap sesi

```text
1. /workspace/frontend/AGENTS.md
2. /workspace/frontend/docs/AGENT_ENTRY_POINT.md
3. /workspace/frontend/docs/praproduction_docs/spec-37-audit-13-remediation.md
4. /workspace/frontend/docs/audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md
5. /workspace/frontend/docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
6. /workspace/frontend/docs/prompt/prompt-guardrails-audit-13-implementation.md
7. Bagian phase aktif di GAP-10
8. Issue dan prompt khusus phase
9. Source frontend yang termasuk scope phase
```

### 3.2 Jika backend disentuh

```text
1. /workspace/laravel_backend/AGENTS.md
2. /workspace/laravel_backend/docs/backend-directory-tree.md
3. /workspace/laravel_backend/docs/backend-modular-monolith-plan.md
4. Implementation plan backend yang relevan
5. Route, FormRequest, controller, service, model, migration, Resource, dan test aktual
```

### 3.3 Dokumen domain tambahan

Untuk UI/layout:

```text
spec-23-tablet-first-layout-rules.md
spec-25-viewport-list.md jika perlu angka viewport
design doc komponen terkait
```

Untuk workflow transaksi:

```text
spec-08-form-architecture.md
spec-10-document-workflow.md
audit-08-business-rules-and-validation-map.md
audit workflow domain terkait
```

Dokumen historis dapat memuat route, field, method, dependency version, atau lifecycle yang sudah tidak benar. Selalu verifikasi terhadap source dan test aktual.

---

## 4. Hierarki Sumber Kebenaran

Jika terdapat konflik:

```text
1. Invariant bisnis, accounting, inventory, tenancy, dan security
2. Backend route, middleware, FormRequest, service, model, migration, Resource, dan test aktual
3. Frontend service, type, hook, page, router, dan test aktual
4. Bukti runtime terbaru yang dapat direproduksi
5. Audit-13
6. Spec-37
7. GAP-10
8. Audit-12/GAP-09 dan Audit-11
9. Spec, issue, gap, prompt, dan audit historis lain
```

Aturan interpretasi:

- Source aktual menjelaskan perilaku yang ada, tetapi tidak otomatis membuktikan perilaku itu benar.
- Invariant bisnis mengalahkan implementasi yang konsisten salah di kedua sisi.
- Audit-13 menjelaskan bukti masalah; tidak selalu menentukan satu-satunya desain solusi.
- GAP-10 menentukan dependency dan sequencing.
- Spec-37 menentukan guardrail implementation dan verification.
- Contoh request/response lama bersifat ilustratif sampai diverifikasi.
- Jangan menyalin endpoint dari dokumen historis tanpa membuka route backend aktual.

Jika kontrak bisnis belum dapat ditentukan, jangan menebak. Catat keputusan yang dibutuhkan dan eskalasi.

---

## 5. Repository dan Batas Akses

### 5.1 Frontend

```text
Repository: /workspace/frontend
Stack aktual:
- React 19
- React Router 7
- Vite 8
- TypeScript 6
- TanStack Query 5
- Zustand 5
- React Hook Form 7
- Zod 4
- Tailwind CSS 3
- Playwright 1.55
```

### 5.2 Backend

```text
Repository: /workspace/laravel_backend
Stack aktual:
- PHP 8.3
- Laravel 13
- Sanctum 4
- PHPUnit 12
```

Backend boleh diubah untuk remediation Audit-13 setelah membaca backend `AGENTS.md`.

### 5.3 Larangan umum

- Jangan memodifikasi data bisnis live.
- Jangan menjalankan migration, seeder, repair, destructive command, atau mutating API terhadap production.
- Jangan menyentuh perubahan user yang tidak terkait.
- Jangan menghapus atau menimpa worktree kotor.
- Jangan memakai operasi Git destruktif.
- Jangan membuat endpoint fiktif agar UI terlihat bekerja.
- Jangan menyembunyikan error backend sebagai empty state.
- Jangan menonaktifkan permission, validation, period lock, atau accounting guard agar test lewat.

---

## 6. Invariant yang Tidak Boleh Rusak

### 6.1 Tenant isolation

- Setiap query dan write terikat pada company/tenant aktif.
- ID tenant lain menghasilkan not-found atau forbidden sesuai policy.
- Backend tidak mempercayai company ID payload tanpa scope server-side.
- Cache/query key frontend memisahkan company bila data dapat berubah antar-company.

### 6.2 Authentication dan authorization

- Backend permission middleware/policy adalah enforcement final.
- Frontend permission guard adalah presentation dan prevention tambahan.
- Jangan hardcode role name sebagai pengganti permission.
- Action tidak dirender atau dapat dipanggil tanpa permission.
- Self-deactivate, self-remove, dan last-owner removal dicegah di backend dan UI.

### 6.3 Accounting integrity

- Total debit sama dengan total kredit.
- Posted journal tidak diedit atau dihapus langsung.
- Koreksi posted transaction melalui void, reversal, atau workflow resmi.
- Control account tidak dipakai sembarang pada manual journal.
- Source transaction dan journal memiliki linkage yang dapat diaudit.
- Posting ulang tidak menghasilkan duplicate journal.
- Posting/void/reversal atomic.
- Tanggal transaksi tunduk pada fiscal year dan period lock.
- Nilai uang memakai precision/rounding canonical backend.

### 6.4 Subledger integrity

- AR/AP balance dapat direkonsiliasi dengan control account.
- Allocation tidak melebihi outstanding amount.
- Payment/receipt, note, deposit, dan return mempertahankan source linkage.
- Aging dan ledger menggunakan cutoff/as-of konsisten.
- Report tidak menampilkan `NaN`, `undefined`, atau total dari field salah.

### 6.5 Inventory integrity

- Stock movement hanya berasal dari workflow valid.
- Return tidak melebihi quantity yang dapat diretur.
- Delivery/receipt/invoice tidak melampaui source tanpa rule eksplisit.
- Negative stock mengikuti setting perusahaan dan dienforce backend.
- Void/reversal mengembalikan stock effect dengan trace benar.
- UOM, warehouse, batch/serial jika berlaku, dan costing tidak diabaikan adapter.

### 6.6 Fixed Assets integrity

- Acquisition, capitalization, depreciation, transfer, revaluation, impairment, dan disposal memiliki lifecycle eksplisit.
- Nilai capitalized/accumulated depreciation tidak berubah lewat edit bebas.
- Partial capitalization mempertahankan uncapitalized balance.
- Depreciation berhenti pada disposal atau batas lifecycle canonical.
- Category account mapping tervalidasi sebelum posting.
- Register/reconciliation report menghormati cutoff/as-of.
- Accounting effect memiliki journal/source linkage dan idempotency.

### 6.7 Period-End integrity

- Status/checklist merepresentasikan backend, bukan asumsi UI.
- Run/reopen memakai authorization, period/date guard, confirmation, dan audit trail.
- Run tidak sukses parsial tanpa status yang dapat dipulihkan atau ditelusuri.
- Reopen menjaga dependency dengan periode berikutnya dan posted process.
- Default period memakai timezone perusahaan.

### 6.8 Auditability

- Perubahan status penting menyimpan actor, timestamp, company, alasan bila wajib, dan source.
- Error tidak menghilangkan bukti kegagalan.
- Repair data dilakukan dengan migration/command testable, bukan edit database manual.

---

## 7. Arsitektur Canonical

### 7.1 Frontend

```text
Page/component
  → domain hook / TanStack Query mutation
  → module service
  → request adapter
  → shared HTTP client
  → backend API
  → response adapter/runtime guard
  → typed UI model
```

Aturan:

- Fetch server data melalui TanStack Query.
- Zustand hanya untuk UI/auth state client-side.
- API call berada di `src/modules/{module}/services/`.
- Normalisasi domain berada di adapter module, bukan shared HTTP client.
- Form memakai React Hook Form dan Zod.
- Backend field error dipetakan ke form.
- Unknown response tidak langsung di-cast sebagai UI model.
- Query invalidation spesifik pada resource, company, filter, dan detail.
- Jangan optimistic update jika rollback domain tidak aman.

### 7.2 Backend

```text
Route + permission middleware
  → FormRequest
  → controller/action
  → domain service
  → model/repository/query
  → Resource/response builder
  → feature test
```

Aturan:

- Validation dan input authorization berada pada layer tepat.
- Business logic tidak ditanam di controller.
- Multi-write memakai database transaction.
- Query tenant-scoped.
- Success/error response konsisten.
- Side effect accounting/inventory idempotent bila action dapat diulang.
- Migration forward-safe dan memiliki strategy untuk existing data.
- Endpoint baru/berubah memiliki feature test.

### 7.3 Shared primitive

Perbaiki primitive reusable sebelum rollout massal bila finding berulang:

- API error parser dan field-error mapper;
- response adapter/runtime guard;
- persistent draft;
- source-document picker;
- permission/lifecycle policy;
- server-side filter/pagination;
- confirmation dialog;
- accessible form controls;
- route error boundary;
- report cutoff model;
- date/timezone normalization.

Primitive tidak boleh menyembunyikan perbedaan domain yang nyata.

---

## 8. Kontrak End-to-End Wajib

Sebelum coding, buat contract matrix untuk setiap resource/workflow.

| Field | Isi wajib |
|---|---|
| Resource/workflow | Nama domain canonical |
| Route | Path aktual |
| Method | GET/POST/PATCH/DELETE aktual |
| Permission | Permission key backend |
| Tenant scope | Cara company ditentukan |
| Request | Field, type, nullable, enum, format |
| Response | Envelope, DTO, relation, pagination |
| Status lifecycle | Status dan transisi legal |
| Validation error | HTTP status dan error shape |
| Side effect | Journal, stock, subledger, audit log |
| Idempotency | Protection retry/double submit |
| Compatibility | Consumer lama dan migration strategy |
| Frontend adapter | Request/response mapping |
| Backend tests | Happy path dan failure path |
| Runtime evidence | Playwright/local/live proof |

### 8.1 Lokasi fix

Gunakan frontend adapter jika backend contract benar/stabil dan perbedaan hanya UI model atau presentation.

Gunakan backend fix jika validation, permission, tenancy, lifecycle, calculation, source data, atomicity, idempotency, atau response contract backend salah.

Gunakan kedua sisi jika canonical contract baru diperlukan atau kedua sisi melewatkan invariant.

Jangan memilih lokasi fix hanya karena paling cepat.

### 8.2 Compatibility

Jika route atau DTO berubah:

1. inventarisasi consumer;
2. tetapkan canonical contract;
3. tentukan kebutuhan backward compatibility;
4. tambah adapter/deprecation jika perlu;
5. update test kedua sisi;
6. hapus contract lama setelah tidak ada consumer.

---

## 9. Lifecycle Finding

```text
open → triaged → in-progress → fixed → verified
```

| Status | Syarat |
|---|---|
| `open` | Tercatat, belum dianalisis untuk implementasi |
| `triaged` | Root cause, phase, contract, dependency, acceptance ditetapkan |
| `in-progress` | Implementasi aktif |
| `fixed` | Code dan automated test terkait lulus |
| `verified` | Runtime/Playwright membuktikan outcome dan regression scope |

Larangan:

- Jangan melompat dari `open` ke `verified`.
- Jangan menandai `fixed` berdasarkan build saja.
- Jangan menandai `verified` memakai route-mock jika finding menyangkut backend real.
- Jangan menutup beberapa finding tanpa evidence per finding.

Evidence minimum:

```text
Finding ID
Root cause
Files changed
Contract decision
Automated tests
Runtime scenario
Expected result
Actual result
Residual risk
```

---

## 10. Roadmap Phase 24–39

| Phase | Fokus | Finding utama | Dependency |
|---:|---|---|---|
| 24 | Test foundation, error containment, router/deep-link | A13-059, A13-254, A13-271 | Tidak ada |
| 25 | Master Data dan Account Mapping | A13-004..046, 060..084, 255..257 | 24 |
| 26 | Accounting foundation dan Opening Balance | A13-047..058, 085..115 | 24–25 |
| 27 | Cash & Bank dan Bank Reconciliation | A13-116..135 | 24, 26 |
| 28 | Sales transaction contract | A13-136..154 | 24–27 |
| 29 | AR subledger dan report | A13-155..160 | 28 |
| 30 | Purchase transaction contract | A13-161..179 | 24–27 |
| 31 | AP subledger dan report | A13-180..185 | 30 |
| 32 | Inventory integrity dan workflow | A13-186..203 | 25, 28, 30 |
| 33 | Fixed Assets runtime dan core | A13-204..214, 220..224, 229..231 | 24–26 |
| 34 | Fixed Assets lifecycle dan report | A13-215..219, 225..228 | 33 |
| 35 | Period-End | A13-272..280 | 26, 29, 31, 32, 34 |
| 36 | Financial dan operational reports | A13-232..253 | 29, 31, 32, 34–35 |
| 37 | Settings, access, dashboard, router verification | A13-001..003, 258..270 | 24–26 |
| 38 | Cross-cutting UX dan accessibility | P2/P3 tersisa | 25–37 |
| 39 | Full regression dan Audit-13 closure | A13-001..280 | 24–38 |

Rules:

- Ikuti dependency, bukan kemudahan atau nomor finding.
- Parallel hanya bila file, contract, dan domain dependency tidak bertabrakan.
- Jangan mulai Phase 35 sebelum accounting/subledger/inventory/asset stabil.
- Jangan menunda P0 integrity untuk polish P2/P3.
- Perubahan prioritas user dicatat di GAP-10 beserta alasan.

---

## 11. Protokol Eksekusi Phase

### Step 1 — Preflight

```text
1. Baca AGENTS, entry point, Spec-37, Audit-13, GAP-10.
2. Pastikan dependency phase selesai.
3. Periksa worktree frontend/backend.
4. Pertahankan perubahan existing.
5. Jalankan baseline test relevan.
6. Catat environment: live read-only, local, atau route-mock.
```

### Step 2 — Triage

- Reproduksi bila aman.
- Identifikasi root cause.
- Petakan file frontend/backend.
- Tentukan invariant terdampak.
- Tentukan dependency antar-finding.
- Tetapkan acceptance terukur.

### Step 3 — Freeze contract

- Lengkapi contract matrix.
- Verifikasi route, permission, FormRequest, response, dan status transition aktual.
- Tentukan adapter dan compatibility.
- Catat keputusan perubahan business behavior.

### Step 4 — Regression test

- Abadikan behavior yang sudah benar.
- Tambahkan failing test yang mereproduksi bug.
- Pastikan test gagal karena finding, bukan setup.

### Step 5 — Implement backend

- Migration jika schema berubah.
- FormRequest/policy.
- Domain service.
- Resource/response.
- Transaction/idempotency/audit trail.
- Feature test happy dan failure paths.

### Step 6 — Implement frontend

- Typed request/response adapter.
- Query/mutation.
- Loading/error/empty/not-found.
- Form validation dan field error.
- Permission/lifecycle UI.
- Responsive/accessibility.
- Targeted Playwright.

### Step 7 — Verify

```text
Backend: feature tests, broader domain tests, Pint.
Frontend: targeted tests, Playwright, build, lint.
Runtime: console dan network inspection.
```

### Step 8 — Close documentation

- Update status finding.
- Update GAP-10.
- Update issue/spec/prompt phase.
- Update AGENTS tracking.
- Update `struktur_frontend.md`.
- Catat command, hasil, residual risk, dan next action.

---

## 12. Frontend Requirements

### 12.1 API dan data

- Jangan fetch langsung di component.
- Jangan simpan server data di Zustand.
- Jangan hardcode URL.
- Jangan memakai `any` tanpa justifikasi lokal.
- Jangan memaksa type dengan cast tanpa runtime validation.
- Gunakan adapter eksplisit untuk DTO berbeda.
- Pagination/filter/search/sort/date mengikuti contract server.
- Jangan mengirim filter unsupported.

### 12.2 Error states

Setiap surface membedakan:

```text
loading
success with data
success empty
validation error
permission error
not found
conflict/business-rule error
server/network error
unexpected response shape
```

- Error tidak berubah menjadi empty list.
- Renderer tidak crash pada malformed response.
- Runtime guard memberi diagnostic yang dapat ditindaklanjuti.
- Production UI tidak membocorkan stack trace atau secret.

### 12.3 Form dan draft

- RHF + Zod.
- Default value berasal dari response adapter.
- Edit tidak menghapus field yang tidak dimuat.
- Draft scoped per company/user/form.
- Draft posted/read-only tidak dipulihkan sebagai editable.
- Submit tahan double click.
- Source document wajib bila workflow membutuhkannya.

### 12.4 Permission dan lifecycle

- Action mengikuti permission dan status.
- Posted/locked document tidak editable.
- Backend menolak action ilegal walau dipanggil langsung.
- Disabled action penting menjelaskan alasannya.

### 12.5 Layout dan accessibility

- Gunakan `dvh`, bukan `vh`.
- Compact mode viewport pendek mengikuti Spec-23.
- Dialog/dropdown punya max-height dan scroll aman.
- Control punya accessible name.
- Error terhubung ke field.
- Focus dan dialog semantics benar.
- Angka memakai `tabular-nums`.
- Jangan edit `src/components/ui/`.

### 12.6 Router

Memory router dan rewrite URL saat ini adalah finding, bukan pola canonical. Target Phase 24:

- deep link dapat dibuka;
- refresh mempertahankan route;
- browser back/forward konsisten;
- auth redirect mempertahankan destination;
- route error tercontain;
- virtual tab behavior tidak regression.

---

## 13. Backend Requirements

### 13.1 Route dan permission

- Route memiliki middleware/policy sesuai.
- Permission key sama dengan contract frontend.
- Business workflow kompleks tidak menggunakan route closure.
- HTTP method konsisten dengan semantics.

### 13.2 Validation

- Reference aktif dan tenant-scoped.
- Date/period lock server-side.
- Quantity/amount/outstanding server-side.
- Status transition server-side.
- Field error stabil dan dapat dipetakan frontend.

### 13.3 Service dan transaction

- Posting, void, allocation, movement, capitalization, depreciation, period-end berada di service.
- Multi-write memakai transaction.
- Gunakan lock/concurrency strategy bila double processing mungkin.
- Retry tidak menduplikasi side effect.
- Failure rollback effect yang tidak boleh parsial.

### 13.4 Response

- Resource/response builder konsisten.
- List/detail memiliki identity/display field cukup.
- Date/timezone dan decimal serialization eksplisit.
- Pagination metadata stabil.
- Nullability konsisten.

### 13.5 Schema/data repair

- Schema berubah melalui migration.
- Existing data dianalisis sebelum constraint.
- Repair memakai command/migration testable dan idempotent.
- Jangan repair production tanpa authorization terpisah.
- Destructive migration perlu rollback/backup strategy dan persetujuan.

### 13.6 Test minimum mutating endpoint

- happy path;
- unauthenticated/unauthorized;
- cross-tenant;
- invalid reference;
- invalid status transition;
- period/date lock;
- duplicate/retry bila relevan;
- rollback failure;
- expected journal/stock/subledger effect;
- void/reversal bila tersedia.

---

## 14. Acceptance per Domain

### 14.1 Master Data

- DTO list/detail/form konsisten atau diadaptasi eksplisit.
- Activate/deactivate jelas; delete hanya bila didukung.
- Search/filter/pagination tidak kehilangan state.
- Account mapping memakai key nyata, bukan `undefined`.
- Mapping wajib tervalidasi sebelum workflow downstream.
- Partial update tidak merusak existing record.

### 14.2 Accounting dan Opening Balance

- Journal balance/account rules dienforce backend.
- Posted journal immutable.
- Fiscal year close/reopen memakai ID nyata dan preview/checklist.
- Period unlock memiliki reason/audit trail bila wajib.
- Opening Balance tidak menyamarkan 500 sebagai “belum ada data”.
- Batch validation/posting atomic dan dapat direkonsiliasi.

### 14.3 Cash & Bank

- Receipt/payment request dan detail response canonical.
- Allocation tidak melebihi source/outstanding.
- Post/void menghasilkan journal benar dan idempotent.
- Bank reconciliation line adapter sesuai DTO.
- Cutoff, matched status, finalization konsisten.

### 14.4 Sales dan AR

- Semua form Sales punya request adapter.
- Detail response diadaptasi ke UI.
- Return wajib source valid.
- Quantity/amount tidak melampaui source.
- Draft tidak berpindah company/document.
- Aging, reconciliation, customer/invoice ledger memakai cutoff dan field canonical.

### 14.5 Purchase dan AP

- Semua form Purchase punya request adapter.
- Detail response diadaptasi ke UI.
- Return wajib source sesuai rule.
- Quantity/amount tidak melampaui source.
- Aging, reconciliation, vendor/bill ledger memakai cutoff dan field canonical.

### 14.6 Inventory

- Product, warehouse, UOM, quantity DTO canonical.
- Movement source/status dapat ditelusuri.
- Workflow tunduk pada negative-stock rule.
- Stock balance detail/report memakai filter benar.
- Costing/as-of tidak memakai data setelah cutoff.

### 14.7 Fixed Assets

- Semua surface API tidak crash.
- Financial field capitalized dikunci atau direvisi melalui workflow.
- Partial capitalization benar.
- Date/period guards diterapkan.
- Disposal menghentikan depreciation.
- Category account mapping tervalidasi.
- Register/reconciliation menghormati cutoff.

### 14.8 Period-End

- Status/checklist tidak 500 pada company valid.
- Renderer aman untuk blocked/ready/completed.
- Run/reopen memakai contract aktual.
- Permission/confirmation benar.
- Partial/error result terlihat.
- Timezone perusahaan menentukan default period.

### 14.9 Reports

- Filter period/date/as-of canonical dan terkirim.
- Tidak crash pada valid, empty, atau error response.
- Total dihitung dari field canonical.
- AR/AP dan reconciliation menggunakan adapter domain.
- Stock/inventory analysis memakai cutoff benar.
- Export hanya muncul bila endpoint nyata dan teruji.

### 14.10 Settings, Access, Dashboard

- Dashboard memakai endpoint nyata atau fallback jujur.
- Partial settings update tidak menghapus field.
- Owner tidak dapat menghapus diri/last owner.
- Audit log memiliki filter dan tenant scope.
- Account mapping tidak save ke `/undefined`.
- Settings route dapat deep-link dan refresh.

---

## 15. Test dan Runtime Verification

### 15.1 Evidence environment

Setiap evidence diberi label:

- `source-only`
- `backend-local`
- `frontend-local`
- `route-mock`
- `live-read-only`
- `live-mutating` — dilarang tanpa izin eksplisit

Route-mock cocok untuk state UI, permission matrix, error renderer, responsive, dan request shape tanpa mutation.

Route-mock tidak membuktikan backend validation, transaction, journal/stock effect, tenancy, idempotency, atau real serialization.

### 15.2 Playwright minimum

Untuk page berubah:

- initial load;
- loading;
- empty;
- populated;
- API error;
- permission state;
- primary action;
- validation error;
- deep-link/refresh bila relevan;
- console error dan failed network;
- desktop, viewport pendek, tablet, mobile sanity.

Data test menggunakan prefix `AUDIT-`.

### 15.3 Viewport

```text
Desktop normal   : 1440 x 900
Laptop pendek    : 1366 x 620
Tablet landscape: 1180 x 820
Tablet portrait : 820 x 1180
Mobile sanity   : 390 x 844
```

### 15.4 Commands

```bash
cd /workspace/frontend
npm run build
npm run lint
npx playwright test <scope>

cd /workspace/laravel_backend
php artisan test --filter=<scope>
vendor/bin/pint --test
```

Jika command tidak dijalankan, dokumentasikan alasan. Jangan menyatakan lulus.

---

## 16. Regression Protection

Sebelum mengubah area yang bekerja:

1. identifikasi behavior benar;
2. tambah characterization test;
3. lakukan perubahan terkecil untuk root cause;
4. jalankan test domain dan consumer;
5. periksa invalidation, route, permission, side effect;
6. periksa console/network;
7. dokumentasikan compatibility.

Larangan:

- broad refactor tanpa test;
- mengubah contract global untuk satu page;
- catch semua error lalu return empty array;
- menghapus action yang seharusnya didukung agar bug hilang;
- fallback yang membuat angka finansial terlihat valid saat source gagal;
- menonaktifkan validation;
- mengubah rounding/date semantics tanpa keputusan;
- hardcoded sample data sebagai fix.

---

## 17. Definition of Done

Finding `fixed` bila:

- root cause dan contract decision tercatat;
- implementasi selesai pada sisi yang benar;
- automated test lulus;
- build/lint tidak menambah error;
- tidak ada known regression scope;
- dokumentasi diperbarui.

Finding `verified` bila:

- skenario pengguna diretest;
- environment evidence jelas;
- real backend digunakan bila finding backend;
- expected dan actual cocok;
- console/network bersih dari error tak tertangani;
- evidence dicatat.

Phase selesai bila:

- seluruh finding yang dipetakan ke phase sudah direkonsiliasi satu per satu;
- seluruh finding scope berstatus `verified`, bukan hanya `fixed`;
- tidak ada finding scope berstatus `open`, `triaged`, atau `in-progress`;
- regression suite lulus;
- frontend build/lint lulus;
- backend tests/Pint lulus jika berubah;
- GAP-10, AGENTS, issue/spec/prompt, struktur docs diperbarui;
- residual risk/deferred item eksplisit.

### 17.1 Mandatory Phase Validation Gate

Setelah refactor atau perbaikan code selesai, agent **belum boleh** menandai phase selesai. Agent wajib menjalankan validation pass terpisah untuk memastikan seluruh temuan phase benar-benar tertutup.

Validation pass wajib:

1. Ambil daftar finding canonical phase dari coverage matrix GAP-10.
2. Buat checklist satu baris per finding; range finding tidak boleh divalidasi sebagai satu klaim umum.
3. Reproduksi ulang skenario asli finding menggunakan environment yang sesuai.
4. Verifikasi acceptance criteria dan invariant domain.
5. Jalankan automated test yang membuktikan fix serta regression test consumer terkait.
6. Gunakan backend real/local untuk finding contract, validation, tenancy, accounting, inventory, atau side effect; route-mock saja tidak cukup.
7. Periksa browser console, failed network request, error boundary, dan data display.
8. Catat expected result, actual result, command, environment, dan evidence untuk setiap finding.
9. Jalankan exploratory pass pada workflow phase untuk mendeteksi regression baru.
10. Catat regression baru sebagai finding baru dan selesaikan dalam phase jika disebabkan oleh perubahan phase.

Tabel validasi phase wajib:

| Finding | Skenario asli | Automated test | Runtime retest | Invariant check | Regression check | Status | Evidence |
|---|---|---|---|---|---|---|---|
| A13-XXX | | | | | | `verified` | |

Phase validation dinyatakan lulus hanya jika:

```text
jumlah finding pada coverage matrix phase
= jumlah baris validation checklist
= jumlah finding berstatus verified
```

Aturan keras:

- `fixed` berarti implementasi selesai, tetapi belum cukup untuk menutup phase.
- Semua severity P0, P1, P2, dan P3 dalam scope phase wajib divalidasi.
- Build, lint, atau test suite hijau tidak menggantikan retest per finding.
- Satu Playwright smoke test umum tidak menggantikan evidence per finding.
- Finding backend tidak dapat diverifikasi hanya dari UI mock.
- Finding visual/responsive tidak dapat diverifikasi hanya dari unit test.
- Jika satu finding gagal retest, phase tetap `in-progress`.
- Jika regression baru muncul akibat perubahan phase, phase tetap `in-progress` sampai regression diperbaiki dan diverifikasi.
- Finding hanya boleh dikecualikan melalui keputusan eksplisit user; exception harus terdokumentasi dan phase tidak boleh disebut “seluruh temuan selesai”.

Output akhir validation pass harus memuat:

```text
Total finding phase
Verified
Failed retest
Blocked
Regression baru
Test commands dan hasil
Environment yang digunakan
Residual risk
Keputusan lanjut: phase complete atau kembali ke implementation
```

---

## 18. Dokumentasi Wajib Diperbarui

| Kondisi | Dokumen |
|---|---|
| Finding ditriage/fixed/verified | Audit-13 |
| Phase progress/dependency berubah | GAP-10 |
| Guardrail lintas phase berubah | Spec-37 |
| Detail solusi kelompok finding | issue doc phase |
| Instruksi eksekusi phase | prompt phase |
| File baru/pindah/hapus | `struktur_frontend.md` |
| Phase/build status berubah | frontend `AGENTS.md` §6 |
| Backend architecture berubah | backend docs/plan |
| API contract berubah | contract matrix dan test kedua sisi |

Dokumen tidak boleh menyatakan `done` jika test/runtime verification belum dilakukan.

---

## 19. Checklist Startup Agent Baru

```text
[ ] Membaca frontend AGENTS.md
[ ] Membaca AGENT_ENTRY_POINT.md
[ ] Membaca Spec-37
[ ] Membaca Audit-13 finding phase aktif
[ ] Membaca GAP-10 dan dependency
[ ] Mengetahui phase aktif: Phase 24 jika belum ada update baru
[ ] Memeriksa worktree frontend
[ ] Memeriksa worktree backend jika masuk scope
[ ] Membaca source frontend terkait
[ ] Membaca backend AGENTS dan source/test terkait
[ ] Menetapkan environment verification
[ ] Menulis contract matrix
[ ] Menetapkan acceptance criteria
[ ] Menambahkan test reproduksi sebelum fix berisiko
```

Checklist harus lengkap sebelum perubahan contract atau workflow finansial.

---

## 20. Kondisi Wajib Eskalasi

Berhenti sebelum perubahan material jika:

- business rule accounting/inventory memiliki lebih dari satu interpretasi masuk akal;
- perubahan memutus consumer eksternal yang belum terinventarisasi;
- destructive migration atau production repair diperlukan;
- local test environment tidak cukup membuktikan integrity;
- task membutuhkan mutasi live;
- konflik dengan perubahan user tidak dapat dipertahankan;
- permission model membutuhkan keputusan organisasi;
- opening balance, fiscal close, period-end, atau asset accounting membutuhkan keputusan akuntansi baru;
- source dan test aktual bertentangan tanpa canonical decision.

Eskalasi menyertakan:

```text
Keputusan yang dibutuhkan
Opsi dan dampaknya
Rekomendasi teknis
File/contract terdampak
Pekerjaan aman yang sudah selesai
```

---

## 21. Immediate Next Action

Jika user tidak mengubah prioritas:

```text
Phase 24 — Remediation Foundation, Error Containment, and Router
Finding utama: A13-059, A13-254, A13-271
```

Tujuan:

- regression harness permanen;
- deep-link dan refresh;
- route-level error containment;
- unexpected API shape tidak menjatuhkan aplikasi;
- pola error untuk Phase 25–39.

Sebelum implementasi buat:

```text
1. issue detail Phase 24;
2. prompt Phase 24;
3. behavior matrix router/error boundary;
4. baseline Playwright deep-link, refresh, back/forward, API error, crash containment.
```

Non-goal:

- seluruh DTO domain;
- business workflow transaksi;
- redesign global;
- menutup finding domain lain hanya karena error sudah tercontain.

---

## Appendix A — Contract Matrix Template

```markdown
## <Resource / Workflow>

| Concern | Canonical decision | Evidence |
|---|---|---|
| Route | | |
| Method | | |
| Permission | | |
| Tenant scope | | |
| Request DTO | | |
| Response DTO | | |
| Error shape | | |
| Lifecycle | | |
| Side effects | | |
| Idempotency | | |
| Compatibility | | |
| Frontend adapter | | |
| Backend tests | | |
| Runtime verification | | |
```

## Appendix B — Finding Closure Template

```markdown
### A13-XXX — <Title>

- Status: fixed | verified
- Root cause:
- Canonical contract:
- Frontend files:
- Backend files:
- Tests added:
- Commands run:
- Runtime environment:
- Expected:
- Actual:
- Regression checked:
- Residual risk:
```

## Appendix C — Phase Completion Report Template

```markdown
# Phase <N> Completion Report

## Scope
- Findings:
- Modules:

## Contract decisions
- ...

## Implementation
- Frontend:
- Backend:
- Migration:

## Verification
- Backend tests:
- Frontend build:
- Frontend lint:
- Playwright:
- Runtime:

## Finding status
| Finding | Before | After | Evidence |
|---|---|---|---|

## Residual risk
- ...

## Documentation updated
- ...

## Next phase
- ...
```
