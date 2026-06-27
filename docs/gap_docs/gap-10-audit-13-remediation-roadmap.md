# GAP-10 — Audit-13 Full Remediation Roadmap

Tanggal dibuat: 2026-06-21  
Status: Planned — canonical roadmap setelah Audit-13  
Scope frontend: `/workspace/frontend`  
Scope backend: `/workspace/laravel_backend`  
Sumber utama: `../audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md`
Guardrail implementasi: `../praproduction_docs/spec-37-audit-13-remediation.md`
Prompt eksekusi wajib: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 1. Tujuan

Roadmap ini mengubah 280 finding Audit-13 menjadi rangkaian phase implementasi lintas frontend dan backend yang:

- mengikuti dependency bisnis dan accounting;
- memperbaiki akar masalah, bukan gejala per halaman;
- menjaga kontrak request/response canonical;
- memiliki regression test permanen;
- dapat ditutup dan diverifikasi per finding;
- tidak mengubah data bisnis live saat development atau verification.

Dokumen ini menjadi urutan implementasi aktif setelah Phase 23. Jika dokumen lama bertentangan dengan source aktual atau roadmap ini, gunakan prioritas:

1. business rule dan invariant accounting yang sudah disepakati;
2. backend source dan test aktual;
3. frontend source aktual;
4. Audit-13;
5. Spec-37 sebagai guardrail remediation;
6. roadmap ini;
7. Audit-12/Audit-11 dan spec/prompt historis.

Spec-37 dan prompt guardrails Audit-13 wajib dibaca sebelum menjalankan phase apa pun. Spec-37 menetapkan invariant dan Definition of Done; prompt guardrails menetapkan execution sequence, supersession rules, runtime safety, serta validation checklist.

---

## 2. Documentation Tracker

Bagian ini melacak status artefak dokumentasi remediation, bukan status implementasi phase.

| Artefak | File | Status | Keterangan |
|---|---|---|---|
| Audit baseline | `../audit_docs/audit-13-manual-frontend-audit-tracker-17-06-26.md` | ✅ Ada | Sumber temuan A13-001..280 |
| Guardrail spesifikasi | `../praproduction_docs/spec-37-audit-13-remediation.md` | ✅ Ada | Guardrail lintas sesi |
| Guardrail prompt | `../prompt/prompt-guardrails-audit-13-implementation.md` | ✅ Ada | Checklist eksekusi phase |
| Roadmap utama | file ini | ✅ Ada | Phase 24–39 canonical |
| Issue Phase 24 | `../issue_docs/issue-27-phase-24-runtime-router-foundation.md` | ✅ Ada | Issue detail Phase 24 |
| Prompt Phase 24 | `../prompt/prompt-phase-24-remediation-foundation-router.md` | ✅ Ada | Checklist implementasi Phase 24 |
| Completion report Phase 24 | `../tracking/phase-24-completion-report.md` atau lokasi yang dipilih | ⏳ Belum dibuat | Diisi setelah Phase 24 selesai dan divalidasi |
| Issue Phase 25 | `../issue_docs/issue-28-phase-25-master-data-account-mapping-canonical.md` | ✅ Ada | Issue detail Phase 25 |
| Prompt Phase 25 | `../prompt/prompt-phase-25-master-data-account-mapping-canonical.md` | ✅ Ada | Checklist implementasi Phase 25 |
| Completion report Phase 25 | `../tracking/phase-25-completion-report.md` atau lokasi yang dipilih | ⏳ Belum dibuat | Dibuat setelah Phase 25 selesai |
| Issue Phase 26 | `../issue_docs/issue-29-phase-26-accounting-foundation-opening-balance.md` | ✅ Ada | Issue detail Phase 26 |
| Prompt Phase 26 | `../prompt/prompt-phase-26-accounting-foundation-opening-balance.md` | ✅ Ada | Checklist implementasi Phase 26 |
| Completion report Phase 26 | `../tracking/phase-26-completion-report.md` atau lokasi yang dipilih | ⏳ Belum dibuat | Dibuat setelah Phase 26 selesai |
| Issue Phase 27 | `../issue_docs/issue-30-phase-27-cash-bank-contract-reconciliation.md` | ✅ Ada | Issue detail Phase 27 |
| Prompt Phase 27 | `../prompt/prompt-phase-27-cash-bank-contract-reconciliation.md` | ✅ Ada | Checklist implementasi Phase 27 |
| Completion report Phase 27 | `../tracking/phase-27-completion-report.md` atau lokasi yang dipilih | ⏳ Belum dibuat | Dibuat setelah Phase 27 selesai |
| Issue Phase 28 | `../issue_docs/issue-31-phase-28-sales-transaction-contract.md` | ✅ Ada | Issue detail Phase 28 |
| Prompt Phase 28 | `../prompt/prompt-phase-28-sales-transaction-contract.md` | ✅ Ada | Checklist implementasi Phase 28 |
| Completion report Phase 28 | `../tracking/phase-28-completion-report.md` atau lokasi yang dipilih | ⏳ Belum dibuat | Dibuat setelah Phase 28 selesai |
| Issue Phase 29 | `../issue_docs/issue-32-phase-29-ar-subledger-reports.md` | ✅ Ada | Issue detail Phase 29 |
| Prompt Phase 29 | `../prompt/prompt-phase-29-ar-subledger-reports.md` | ✅ Ada | Checklist implementasi Phase 29 |
| Completion report Phase 29 | `../tracking/phase-29-completion-report.md` atau lokasi yang dipilih | ⏳ Belum dibuat | Dibuat setelah Phase 29 selesai |
| Issue Phase 30 | `../issue_docs/issue-33-phase-30-purchase-transaction-contract.md` | ✅ Ada | Issue detail Phase 30 |
| Prompt Phase 30 | `../prompt/prompt-phase-30-purchase-transaction-contract.md` | ✅ Ada | Checklist implementasi Phase 30 |
| Completion report Phase 30 | `../tracking/phase-30-completion-report.md` atau lokasi yang dipilih | ✅ Ada | Phase 30 selesai dan divalidasi |
| Issue Phase 31 | `../issue_docs/issue-34-phase-31-ap-subledger-reports.md` | ✅ Ada | Issue detail Phase 31 |
| Prompt Phase 31 | `../prompt/prompt-phase-31-ap-subledger-reports.md` | ✅ Ada | Checklist implementasi Phase 31 |
| Completion report Phase 31 | `../tracking/phase-31-completion-report.md` atau lokasi yang dipilih | ✅ Ada | Phase 31 selesai dan divalidasi |
| Issue Phase 32 | `../issue_docs/issue-35-phase-32-inventory-integrity-workflow.md` | ✅ Ada | Issue detail Phase 32 |
| Prompt Phase 32 | `../prompt/prompt-phase-32-inventory-integrity-workflow.md` | ✅ Ada | Checklist implementasi Phase 32 |
| Completion report Phase 32 | `../tracking/phase-32-completion-report.md` atau lokasi yang dipilih | ⏳ Belum dibuat | Dibuat setelah Phase 32 selesai |
| Issue Phase 33 | `../issue_docs/issue-36-phase-33-fixed-assets-runtime-core.md` | ✅ Ada | Issue detail Phase 33 |
| Prompt Phase 33 | `../prompt/prompt-phase-33-fixed-assets-runtime-core.md` | ✅ Ada | Checklist implementasi Phase 33 |
| Completion report Phase 33 | `../tracking/phase-33-completion-report.md` atau lokasi yang dipilih | ✅ Ada | Phase 33 selesai dan divalidasi |
| Issue Phase 34 | `../issue_docs/issue-37-phase-34-fixed-assets-lifecycle-reports.md` | ✅ Ada | Issue detail Phase 34 |
| Prompt Phase 34 | `../prompt/prompt-phase-34-fixed-assets-lifecycle-reports.md` | ✅ Ada | Checklist implementasi Phase 34 |
| Completion report Phase 34 | `../tracking/phase-34-completion-report.md` atau lokasi yang dipilih | ✅ Ada | Phase 34 selesai dan divalidasi |
| Issue Phase 35 | `../issue_docs/issue-38-phase-35-period-end-processing.md` | ✅ Ada | Issue detail Phase 35 |
| Prompt Phase 35 | `../prompt/prompt-phase-35-period-end-processing.md` | ✅ Ada | Checklist implementasi Phase 35 |
| Completion report Phase 35 | `../tracking/phase-35-completion-report.md` atau lokasi yang dipilih | ✅ Ada | Phase 35 selesai dan divalidasi |
| Issue Phase 36 | `../issue_docs/issue-39-phase-36-financial-operational-reports.md` | ✅ Ada | Issue detail Phase 36 |
| Prompt Phase 36 | `../prompt/prompt-phase-36-financial-operational-reports.md` | ✅ Ada | Checklist implementasi Phase 36 |
| Completion report Phase 36 | `../tracking/phase-36-completion-report.md` atau lokasi yang dipilih | ⏳ Belum dibuat | Dibuat setelah Phase 36 selesai |
| Issue Phase 37 | `../issue_docs/issue-40-phase-37-settings-access-dashboard-router.md` | ✅ Ada | Issue detail Phase 37 |
| Prompt Phase 37 | `../prompt/prompt-phase-37-settings-access-dashboard-router.md` | ✅ Ada | Checklist implementasi Phase 37 |
| Completion report Phase 37 | `../tracking/phase-37-completion-report.md` atau lokasi yang dipilih | ✅ Ada | Phase 37 selesai dan divalidasi |
| Issue Phase 38 | `../issue_docs/issue-41-phase-38-cross-cutting-ux-accessibility-consistency.md` | ✅ Ada | Issue detail Phase 38 |
| Prompt Phase 38 | `../prompt/prompt-phase-38-cross-cutting-ux-accessibility-consistency.md` | ✅ Ada | Checklist implementasi Phase 38 |
| Completion report Phase 38 | `../tracking/phase-38-completion-report.md` atau lokasi yang dipilih | ⏳ Belum dibuat | Dibuat setelah Phase 38 selesai |
| Issue Phase 39 | `../issue_docs/issue-42-phase-39-full-regression-data-repair-audit-closure.md` | ✅ Ada | Issue detail Phase 39 |
| Prompt Phase 39 | `../prompt/prompt-phase-39-full-regression-data-repair-audit-closure.md` | ✅ Ada | Checklist implementasi Phase 39 |
| Completion report Phase 39 | `../tracking/phase-39-completion-report.md` atau lokasi yang dipilih | ⏳ Belum dibuat | Dibuat setelah Phase 39 selesai |

Aturan penggunaan tracker:

- jika status `✅ Ada`, dokumen itu sudah bisa dipakai sebagai referensi canonical;
- jika status `⏳ Belum dibuat`, jangan mengasumsikan isinya ada;
- phase berikutnya tidak boleh dimulai sebelum issue dan prompt untuk phase aktif tersedia;
- completion report hanya dibuat setelah phase selesai dan divalidasi;
- tracker ini harus diupdate setiap kali sebuah artefak dokumentasi baru dibuat.

---

## 3. Baseline Audit-13

| Metric | Jumlah |
|---|---:|
| Area baseline | 105 |
| Finding | 280 |
| P0 / critical | 60 |
| P1 / high | 119 |
| P2 / medium | 90 |
| P3 / low | 11 |
| Finding open | 279 |
| Finding verified | 1 |

Audit selesai secara cakupan. Status tersebut tidak berarti aplikasi production-ready; finding terbuka adalah backlog implementasi aktif.

---

## 4. Prinsip Remediation

### 3.1 Satu kontrak end-to-end

Untuk setiap resource atau workflow, tetapkan satu kontrak canonical:

```text
Route + Permission + Request + Response + Status/Lifecycle + Error Shape
```

- Backend menggunakan FormRequest, service, Resource/serializer atau response builder, permission middleware, dan feature test.
- Frontend menggunakan service adapter, typed UI model, TanStack Query, RHF/Zod, dan state loading/error/empty/not-found yang eksplisit.
- Jangan menambah normalisasi domain besar ke `src/services/http.ts`.
- Jangan mempertahankan kontrak yang terbukti salah hanya karena salah satu sisi sudah menggunakannya.

### 3.2 Accounting dan inventory integrity menang atas UX convenience

Perubahan yang memengaruhi journal, subledger, stock, period lock, fixed assets, atau source document wajib menjaga:

- debit sama dengan kredit;
- control account tidak dapat disalahgunakan;
- period/date guard;
- source linkage dan idempotency;
- transaction atomicity;
- void/reversal chain;
- tenant isolation;
- audit trail.

### 3.3 Perbaiki pola bersama sebelum rollout massal

Pola berulang berikut harus diselesaikan sebagai primitive reusable:

- API error dan field-error mapping;
- response adapter dan runtime guard;
- persistent form draft;
- source-document picker;
- permission/lifecycle policy;
- server-side filter/pagination;
- confirmation dialog;
- accessible form controls;
- production-safe route error boundary.

### 3.4 Backend boleh diubah

Backend boleh diperbaiki sesuai aturan `/workspace/laravel_backend/AGENTS.md`.

- Schema berubah melalui migration.
- Business logic berada di service.
- Validasi berada di FormRequest.
- Write operation transaction-safe.
- Tambahkan feature test untuk happy path dan failure path.
- Jangan memutasi database atau tenant live secara langsung.

---

## 5. Model Status Finding

Setiap finding melewati status berikut:

```text
open → triaged → in-progress → fixed → verified
```

Definisi:

| Status | Syarat |
|---|---|
| `triaged` | Phase, owner, root cause, dan acceptance sudah ditetapkan |
| `in-progress` | Implementasi aktif pada branch/worktree |
| `fixed` | Code dan automated test terkait lulus |
| `verified` | Runtime/Playwright retest membuktikan user-visible outcome |

Finding tidak boleh menjadi `verified` hanya karena build lulus.

### 4.1 Mandatory Validation Gate Setiap Phase

Setelah seluruh refactor/perbaikan phase diimplementasikan, lakukan validation pass terpisah sebelum phase boleh ditutup.

```text
implementation selesai
→ automated regression test
→ runtime retest setiap finding
→ exploratory regression pass
→ reconciliation coverage matrix
→ phase complete
```

Ketentuan:

- coverage matrix phase menjadi daftar finding wajib;
- setiap finding memiliki evidence sendiri;
- seluruh severity dalam scope harus berstatus `verified`;
- tidak boleh ada finding `open`, `triaged`, `in-progress`, atau hanya `fixed`;
- finding backend harus diuji terhadap backend real/local, bukan route-mock saja;
- finding UI/responsive harus diuji melalui browser pada viewport relevan;
- regression baru akibat phase wajib dicatat, diperbaiki, dan diverifikasi sebelum phase selesai;
- jika satu finding gagal atau belum dapat divalidasi, phase tetap `in-progress`;
- exception hanya melalui keputusan eksplisit user dan tidak boleh dilaporkan sebagai seluruh temuan selesai.

Rekonsiliasi wajib:

```text
total finding coverage phase = total checklist = total verified
```

Format checklist dan evidence mengikuti Spec-37 §17.1.

---

## 5. Verification Foundation

Sebelum rollout besar, siapkan test permanen.

### Frontend

- Tambahkan `playwright.config.ts`.
- Buat test helper login/bootstrap company.
- Pisahkan project:
  - route-mock deterministic;
  - live read-only smoke;
  - destructive workflow hanya terhadap backend test/local atau tenant disposable.
- Matrix viewport minimum:
  - `1440×900`;
  - `1180×708`;
  - `1024×656`;
  - `390×844`.
- Capture console error, page error, failed request, horizontal overflow, dan unsafe stack trace.

### Backend

- Gunakan PHPUnit feature test per module.
- Pastikan test tenant memakai database terisolasi.
- Tambahkan contract assertion untuk envelope, field canonical, permission, status, dan error code.
- Untuk accounting/inventory write:
  - assert rollback;
  - assert journal balanced;
  - assert source linkage;
  - assert period lock;
  - assert idempotency.

### Gates umum

```bash
cd /workspace/frontend
npm run build
npm run lint
npx playwright test <scope>

cd /workspace/laravel_backend
php artisan test --filter=<scope>
vendor/bin/pint --test
```

---

## 6. Urutan Phase

| Phase | Nama | Primary Finding | Dependency |
|---:|---|---|---|
| 24 | Test Foundation & Global Runtime Containment | A13-059, 254, 271 | — |
| 25 | Master Data & Account Mapping Canonical | A13-004..046, 060..084, 255..257 | 24 |
| 26 | Accounting Foundation & Opening Balance | A13-047..058, 085..115 | 24–25 |
| 27 | Cash & Bank Contract and Reconciliation | A13-116..135 | 24–26 |
| 28 | Sales Transaction Contract | A13-136..154 | 24–27 |
| 29 | AR Subledger and Reports | A13-155..160 | 28 |
| 30 | Purchase Transaction Contract | A13-161..179 | 24–27 |
| 31 | AP Subledger and Reports | A13-180..185 | 30 |
| 32 | Inventory Integrity and Workflow | A13-186..203 | 27–31 |
| 33 | Fixed Assets Runtime and Core Contract | A13-204..214, 220..224, 229..231 | 25–32 |
| 34 | Fixed Assets Lifecycle and Historical Reports | A13-215..219, 225..228 | 33 |
| 35 | Period-End Processing | A13-272..280 | 26, 33–34 |
| 36 | Financial and Operational Reports | A13-232..253 | 26–35 |
| 37 | Settings, Access Safety, Dashboard, and Router | A13-001..003, 258..270 | 24–36 |
| 38 | Cross-Cutting UX, Accessibility, and Consistency | Finding P2/P3 lintas modul | 25–37 |
| 39 | Full Regression, Data Repair, and Audit Closure | A13-001..280 | 24–38 |

Phase boleh dipecah menjadi sub-phase kecil, tetapi dependency dan acceptance tidak boleh dilewati.

---

## 7. Detail Phase

### Phase 24 — Test Foundation & Global Runtime Containment

Issue detail:

```text
../issue_docs/issue-27-phase-24-runtime-router-foundation.md
```

Tujuan:

- membuat regression suite permanen;
- menghentikan stack trace production;
- memulihkan deep-link/refresh canonical;
- menyediakan error-state primitive yang akan dipakai semua phase.

Scope:

- A13-059 routing/deep-link;
- A13-254 production error boundary;
- A13-271 memory-router/deep-link;
- pola global API error, retry, not-found, dan console capture.

Frontend:

- evaluasi `createBrowserRouter` sebagai canonical router;
- tambahkan route-level `errorElement` aman;
- jangan tampilkan `error.message` mentah pada production fallback;
- tambahkan Playwright config/helper/fixtures;
- buat shared query-state/error-state wrapper bila diperlukan.

Backend:

- tambahkan route/contract smoke test untuk endpoint kritis;
- pastikan SPA deployment fallback mendukung deep-link.

Exit:

- refresh route detail mempertahankan halaman;
- error render tidak mengekspos source path/stack;
- Playwright route-mock dan live smoke dapat dijalankan lewat command tetap.

---

### Phase 25 — Master Data & Account Mapping Canonical

Tujuan:

- menstabilkan master data sebagai dependency seluruh transaksi;
- memperbaiki account mapping sebelum accounting/fixed-assets posting.

Scope:

- A13-004..046;
- A13-060..084;
- A13-255..257;
- finding global save variant/draft/accessibility yang muncul pada halaman master data.

Cluster:

1. COA dan control-account policy.
2. Contact.
3. Product, category, unit, warehouse, payment term.
4. Department dan project.
5. Account mapping response/save contract.
6. Server-side search/pagination/activate/deactivate.

Frontend:

- adapter backend DTO → UI model per service;
- request adapter UI form → backend payload;
- rollout persistent draft ke form master data;
- preload selected labels;
- gunakan real pagination metadata;
- bedakan API error dari empty.

Backend:

- Resource/serializer canonical untuk relation dan pagination;
- lengkapi field/request yang memang dibutuhkan bisnis;
- account mapping response wajib memakai `mapping_key`, label, account relation, required/type metadata;
- validasi account type, active state, required mapping;
- feature test CRUD/lifecycle/search/pagination.

Exit:

- tidak ada save ke `/undefined`;
- create/edit utama berhasil;
- relasi tampil sebagai label, bukan ID;
- pagination/search mengubah dataset server-side;
- required mapping tidak dapat dikosongkan secara tidak valid.

---

### Phase 26 — Accounting Foundation & Opening Balance

Tujuan:

- menstabilkan journal, opening balance, period lock, dan fiscal year sebelum transaksi lanjutan.

Scope:

- A13-047..058;
- A13-085..115.

Frontend:

- journal totals dan account relation adapter;
- draft persistence jurnal;
- lifecycle/permission policy;
- opening-balance system/manual line rendering;
- blocker object adapter;
- period lock `locked_until` canonical;
- fiscal year ID/method/preview/checklist flow.

Backend:

- list journal totals/source metadata;
- error code aman tanpa bocor detail internal;
- opening-balance status/preview contract;
- fiscal-year close/reopen route, request, checklist, dan tests;
- period lock reason/audit requirements bila unlock bersifat sensitif.

Exit:

- journal list/detail konsisten dan balanced;
- opening balance blocker tidak crash;
- lock aktif terbaca benar;
- close/reopen hanya melalui preview/checklist canonical;
- period/fiscal guards diuji.

---

### Phase 27 — Cash & Bank Contract and Reconciliation

Tujuan:

- memastikan penerimaan, pengeluaran, transfer, dan rekonsiliasi memiliki DTO dan accounting workflow yang benar.

Scope:

- A13-116..135.

Frontend:

- request/response adapter tiap resource;
- account selector hanya cash/bank account valid;
- line validation RHF/Zod;
- confirmation + reason untuk post/void/destructive refresh;
- reconciliation line adapter;
- opening balance dan difference formula;
- dirty-state preservation.

Backend:

- eager-load relation canonical;
- validate same-account transfer;
- validate cleared date dalam statement period;
- refresh-lines tidak boleh menghapus cleared state tanpa explicit reset policy;
- feature test posting, void, journal, reconciliation balance.

Exit:

- create/detail/post/void seluruh cash-bank lulus;
- transfer tidak dapat memakai akun sama;
- reconciliation menampilkan opening/ending/cleared/difference benar;
- refresh/mark lines tidak menyebabkan kehilangan state diam-diam.

---

### Phase 28 — Sales Transaction Contract

Tujuan:

- memperbaiki seluruh form/list Sales pada satu adapter pattern.

Scope:

- A13-136..154.

Resource:

- quotation;
- sales order;
- delivery order;
- proforma;
- invoice;
- customer deposit;
- receipt;
- return.

Frontend:

- request adapter field tanggal dan line canonical;
- response adapter detail/list;
- persistent draft semua create form;
- source picker dan remaining quantity/amount;
- nested line validation;
- lifecycle action/permission;
- server-side search/filter/page size;
- explicit error/not-found state.

Backend:

- canonical Resources untuk header, lines, totals, source, customer/product/warehouse/account;
- source conversion dan idempotency;
- return wajib source atau unlinked-return policy eksplisit dan balanced;
- deposit apply/refund contract;
- feature test per resource create/update/post/void/source.

Exit:

- seluruh payload valid UI diterima backend;
- detail round-trip sama dengan data tersimpan;
- source conversion tidak over-convert;
- draft tidak hilang;
- return tidak melewati accounting/inventory control.

---

### Phase 29 — AR Subledger and Reports

Tujuan:

- memulihkan AR summary, aging, reconciliation, customer ledger, dan invoice ledger.

Scope:

- A13-155..160.

Frontend:

- adapter `{customers,buckets,invoices}` dan `{movements}`;
- renderer aggregate reconciliation;
- canonical `as_of_date/start_date/end_date`;
- permission `sales.ar.reconcile`;
- retry/error/not-found.

Backend:

- pastikan totals/buckets/movements mempunyai contract stabil;
- reconcile AR subledger vs GL pada cutoff sama;
- feature test total, bucket, running balance, mismatch, permission.

Exit:

- lima surface AR tidak crash;
- totals UI sama dengan response/test fixture;
- mismatch terlihat jelas;
- ledger running balance benar.

---

### Phase 30 — Purchase Transaction Contract

Tujuan:

- memperbaiki seluruh form/list Purchase dengan pola yang sama seperti Sales.

Scope:

- A13-161..179.

Resource:

- purchase request;
- purchase order;
- goods receipt;
- vendor bill;
- vendor deposit;
- vendor payment;
- purchase return.

Frontend:

- request/response adapter canonical;
- draft semua form;
- source workflow PR → PO → GR → Bill;
- vendor context, deposit, bill balance;
- nested line/date validation;
- lifecycle permission/confirmation;
- server-side filter/page size/error.

Backend:

- canonical Resources dan source linkage;
- partial receive/bill controls;
- vendor deposit apply/refund;
- return wajib source atau explicit balanced policy;
- feature test full purchase chain.

Exit:

- seluruh create/detail round-trip benar;
- partial flow tidak over-receive/over-bill;
- vendor payment memakai balance/deposit canonical;
- return menjaga AP dan stock origin.

---

### Phase 31 — AP Subledger and Reports

Tujuan:

- memulihkan AP summary, aging, reconciliation, vendor ledger, dan bill ledger.

Scope:

- A13-180..185.

Implementasi mengikuti pola Phase 29 dengan entity vendor/bill dan permission `purchase.ap.reconcile`.

Exit:

- seluruh surface AP tidak crash;
- bucket, totals, running balance, dan reconciliation cutoff terverifikasi.

---

### Phase 32 — Inventory Integrity and Workflow

Tujuan:

- memperbaiki list/detail contract dan risiko kehilangan/korupsi stock movement.

Scope:

- A13-186..203.

Frontend:

- relation/count adapter;
- stock card detail;
- persistent draft Movement dan Opname;
- line schema dan nested errors;
- preserve dirty row atau Save All atomic;
- confirmation Generate Lines/approve/post/finalize;
- canonical permission.

Backend:

- server-side filter/search/pagination;
- migration/adapter movement type legacy;
- perbaiki duplicate-source model agar mixed adjustment/opname atomic;
- validate all counts before counted/finalized;
- transaction rollback jika satu movement gagal;
- feature test quantity/value/journal/source.

Exit:

- mixed increase/decrease berhasil atomik;
- Generate Lines tidak menghapus count tanpa confirmation;
- input row lain tidak hilang saat save;
- stock card menunjukkan source dan running balance.

---

### Phase 33 — Fixed Assets Runtime and Core Contract

Tujuan:

- memulihkan API live dan menstabilkan category/asset/acquisition/capitalization contract.

Scope:

- A13-204..214;
- A13-220..224;
- A13-229..231.

Backend:

- audit dan perbaiki tenant migration/readiness;
- category account validation;
- vendor bill source eligibility dan remaining capitalization;
- full versus partial capitalization policy;
- lock financial fields setelah capitalization atau buat adjustment workflow;
- apply TransactionDateGuard;
- expose history/source/account relations;
- feature test category, create, capitalize, edit guard, permission.

Frontend:

- error/retry bukan empty;
- draft asset;
- category/account selected labels;
- Vendor Bill source picker;
- read-only/adjustment policy;
- history/context rendering;
- dedicated dialogs and accessibility.

Exit:

- seluruh endpoint core Fixed Assets live 2xx pada tenant sehat;
- capitalization journal dan subledger konsisten;
- mapping salah ditolak;
- posted financial fields tidak dapat mengubah GL diam-diam.

---

### Phase 34 — Fixed Assets Lifecycle and Historical Reports

Tujuan:

- memperbaiki depreciation/disposal dan report historical cutoff.

Scope:

- A13-215..219;
- A13-225..228.

Backend:

- fully-depreciated status;
- disposal nilai buku nol;
- stop/cancel schedule setelah disposal;
- partial disposal consistency;
- register as-of berdasarkan cutoff;
- reconciliation memakai cutoff sama dengan GL;
- dedicated report DTO;
- feature test historical periods.

Frontend:

- disposal preview NBV/gain-loss/journal;
- renderer khusus register/depreciation/disposal/reconciliation;
- totals, variance, detail links, error/retry, period validation.

Exit:

- disposed asset tidak didepresiasi lagi;
- historical report tidak memakai current balance;
- reconciliation variance benar untuk lebih dari satu cutoff.

---

### Phase 35 — Period-End Processing

Tujuan:

- memulihkan Period-End setelah Fixed Assets stabil.

Scope:

- A13-272..280.

Backend:

- perbaiki `500 DATABASE_ERROR` dan deployment readiness;
- checklist object contract canonical;
- selaraskan permission `period_end.run` dan `fixed_assets.depreciate`;
- test ready/blocked/completed/reopened/failed/idempotent;
- test close/reopen accounting period dan reversal routine.

Frontend:

- blocker/warning object adapter;
- seluruh checklist key/status canonical;
- explicit loading/error/retry;
- lifecycle action kontekstual;
- accessible dialog/control;
- timezone-aware default period;
- mobile header layout.

Exit:

- status/checklist live berhasil;
- blocked state tidak crash;
- run/reopen hanya tersedia sesuai capability;
- tidak ada period-end double post.

---

### Phase 36 — Financial and Operational Reports

Tujuan:

- membuat seluruh report akurat, filter-aware, dan tidak crash.

Scope:

- A13-232..253.

Urutan internal:

1. General Ledger dan filter period.
2. Trial Balance/Profit Loss/Balance Sheet/Cash Flow/Financial Summary.
3. AR/AP Aging reuse adapter Phase 29/31.
4. Reconciliation.
5. Stock dan Inventory Analysis.
6. Print/export/volume policy.

Backend:

- dedicated report DTO per report;
- canonical filter names;
- cash-flow classification operating/investing/financing;
- integrity fields `is_balanced/difference`;
- pagination/export/streaming decision;
- feature tests dengan fixture accounting terkontrol.

Frontend:

- satu adapter per report, bukan generic nested assumptions;
- runtime guard dan error/retry;
- account/entity/warehouse/dimension filters;
- balance/variance warnings;
- accessible tabs;
- ribbon discoverability.

Exit:

- seluruh report route merender fixture 200 tanpa crash;
- filter response membuktikan period diterapkan;
- totals sama dengan backend tests;
- reconciliation mismatch terlihat.

---

### Phase 37 — Settings, Access Safety, Dashboard, and Router

Tujuan:

- menutup area admin/security dan data dashboard setelah contract domain stabil.

Scope:

- A13-001..003;
- A13-258..270;
- final verification A13-059/A13-271.

Backend:

- dashboard aggregate endpoints atau satu canonical summary endpoint;
- self/last-owner guard server-side;
- users/roles/invitations/audit pagination/filter;
- preference contract;
- company currency/precision change guard;
- transaction mode/toggle validation.

Frontend:

- dashboard query/empty/error;
- hide/block unsafe owner actions;
- role permission matrix;
- server-side user/invitation/audit pagination;
- actor filter;
- RHF/Zod settings forms;
- associated labels;
- company/profile/preference completeness.

Exit:

- last owner tidak dapat dihapus/dinonaktifkan;
- settings save contract benar;
- dashboard tidak bergantung endpoint fiktif;
- refresh/deep-link settings stabil.

---

### Phase 38 — Cross-Cutting UX, Accessibility, and Consistency

Tujuan:

- menutup temuan berulang yang tersisa setelah behavior utama stabil.

Scope:

- seluruh P2/P3 yang belum tertutup;
- save variants;
- search/bulk/reactivate/default action;
- dialog descriptions;
- label/control association;
- button semantics;
- mobile/short viewport;
- loading/error/empty copy;
- lint warning pada file yang disentuh.

Rules:

- jangan melakukan redesign besar;
- gunakan shared component/pattern yang sudah stabil;
- setiap modul minimal diuji keyboard dan viewport matrix.

Exit:

- tidak ada known unlabeled critical control;
- tidak ada root overflow pada matrix;
- tidak ada native destructive confirm pada workflow yang sudah memiliki dialog pattern;
- lint tidak mendapat warning baru.

Catatan progres 2026-06-27:

- Shared `SearchableSelect` sudah mendukung `triggerId` dan `triggerAriaLabel`.
- Surface settings yang memakai `SearchableSelect` sudah memakai identifier/label trigger eksplisit pada pengaturan transaksi dan pemetaan akun.
- Sweep accessibility Phase 38 sudah merapikan label/programmatic association, dialog description, dan destructive confirmation consistency pada representative settings/access pages berikut:
  - `/settings/users`
  - `/settings/invitations`
  - `/settings/roles`
  - `/settings/audit`
  - `/settings/preferences`
- Yang belum selesai di Phase 38 saat ini:
  - viewport polish lintas modul pada short/mobile viewport;
  - consistency sweep lintas modul di luar representative settings/access slice;
  - penutupan sisa temuan P2/P3 yang belum diverifikasi ulang;
  - validation gate penuh Phase 38, termasuk lint/build/playwright phase-wide setelah blocker repo-wide yang tidak terkait selesai atau dipisahkan jelas.

---

### Phase 39 — Full Regression, Data Repair, and Audit Closure

Tujuan:

- memastikan seluruh finding benar-benar selesai dan deployment siap.

Aktivitas:

1. Jalankan full backend test.
2. Jalankan frontend build/lint/Playwright regression.
3. Jalankan migration pada environment disposable.
4. Siapkan data-repair command untuk legacy data jika diperlukan.
5. Jalankan live read-only smoke seluruh 105 area.
6. Jalankan mutation test hanya pada tenant disposable dengan prefix `AUDIT-`.
7. Update setiap finding menjadi `verified`, `wont-fix`, atau `duplicate` dengan bukti.
8. Buat release checklist dan rollback plan.

Exit akhir:

- tidak ada P0/P1 open;
- P2/P3 yang tersisa memiliki keputusan tertulis;
- seluruh migration reversible atau memiliki rollback strategy;
- seluruh route utama bebas crash/stack leak;
- accounting and inventory reconciliation fixture seimbang;
- Audit-13 ditandai fixes verified.

---

## 8. Coverage Matrix A13-001..280

Matriks ini memastikan tidak ada finding terlewat.

| Finding Range | Primary Phase |
|---|---:|
| A13-001..003 | 37 |
| A13-004..046 | 25 |
| A13-047..058 | 26 |
| A13-059 | 24, final verification 37 |
| A13-060..084 | 25 |
| A13-085..115 | 26 |
| A13-116..135 | 27 |
| A13-136..154 | 28 |
| A13-155..160 | 29 |
| A13-161..179 | 30 |
| A13-180..185 | 31 |
| A13-186..203 | 32 |
| A13-204..214 | 33 |
| A13-215..219 | 34 |
| A13-220..224 | 33 |
| A13-225..228 | 34 |
| A13-229..231 | 33 |
| A13-232..253 | 36 |
| A13-254 | 24 |
| A13-255..257 | 25 |
| A13-258..270 | 37 |
| A13-271 | 24, final verification 37 |
| A13-272..280 | 35 |

Cross-cutting P2/P3 tetap diverifikasi ulang pada Phase 38 walaupun primary fix dilakukan lebih awal.

---

## 9. Aturan Dokumentasi Per Phase

Setiap phase baru harus memiliki:

```text
docs/issue_docs/issue-{n}-*.md        # detail root cause jika perlu
docs/praproduction_docs/spec-{n}-*.md # kontrak implementasi
docs/prompt/prompt-phase-{n}-*.md     # execution checklist
```

Setelah phase:

- jalankan mandatory validation gate Spec-37 §17.1;
- cocokkan jumlah finding coverage phase dengan jumlah finding `verified`;
- update finding Audit-13 satu per satu beserta evidence;
- update GAP-10 status;
- update `AGENTS.md` §6A/§6C/§6D;
- update `docs/struktur_frontend.md` jika ada file baru;
- update backend-local implementation plan jika backend domain berubah;
- catat migration/data-repair requirement.

---

## 10. Immediate Next Action

Phase 24 kini sudah punya issue detail canonical:

```text
docs/issue_docs/issue-27-phase-24-runtime-router-foundation.md
```

Proses kerja sekarang:

1. baca issue Phase 24;
2. buat prompt Phase 24;
3. implementasikan scope kecil dan terukur;
4. jalankan mandatory validation gate Spec-37 §17.1;
5. update A13-059, A13-254, dan A13-271 satu per satu;
6. hanya setelah itu lanjut ke Phase 25.

Scope teknis Phase 24:

1. buat Playwright regression foundation;
2. pasang production-safe route error boundary;
3. tetapkan keputusan Browser Router/deployment fallback;
4. buat backend critical-route contract smoke test;
5. jangan mencampur phase ini dengan adapter transaksi.

Setelah Phase 24 lulus dan divalidasi, lanjut Phase 25 karena Master Data dan Account Mapping adalah dependency untuk Accounting, transaksi, Fixed Assets, dan Period-End.
