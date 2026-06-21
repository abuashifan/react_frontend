# Issue-27 — Phase 24 Runtime, Router, and Verification Foundation

Tanggal dibuat: 2026-06-21  
Status: Planned — issue detail selesai, implementation belum dimulai  
Phase: 24 — Test Foundation & Global Runtime Containment  
Severity tertinggi: Critical  
Finding canonical: A13-059, A13-254, A13-271  
Spec: `../praproduction_docs/spec-37-audit-13-remediation.md`  
Roadmap: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
Guardrails: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 1. Tujuan

Issue ini mendefinisikan unit kerja teknis Phase 24 untuk:

- memigrasikan routing ke browser URL canonical;
- memulihkan deep-link, refresh, bookmark, share, dan browser history;
- mencegah auth/session bootstrap merusak destination route;
- memasang production-safe route error containment;
- mencegah stack trace, source path, dan raw error bocor ke user;
- membuat Playwright regression foundation permanen;
- menetapkan pola error/runtime verification untuk Phase 25–39.

Issue ini belum mengimplementasikan perubahan. Dokumen ini menjadi input untuk `prompt-phase-24-remediation-foundation-router.md`.

---

## 2. Fungsi Finding ID A13-xxx

Finding ID di Audit-13 adalah identitas kanonis bukti masalah, bukan nama task implementasi.

Alurnya:

```text
Audit evidence
→ Finding ID A13-xxx
→ Issue detail
→ Phase/prompt
→ Code dan automated test
→ Runtime validation
→ Status fixed
→ Status verified
```

Peran setiap artefak:

| Artefak | Fungsi |
|---|---|
| `A13-059` | Identitas masalah browser routing/deep-link global |
| `A13-254` | Identitas masalah unsafe production error boundary |
| `A13-271` | Identitas masalah deep-link/refresh settings dan session bootstrap |
| Issue-27 | Mengelompokkan root cause, contract, file, acceptance, dan test plan |
| Phase 24 prompt | Instruksi eksekusi implementation |
| Validation checklist | Membuktikan setiap finding sudah benar-benar selesai |

Satu issue boleh mencakup beberapa finding jika akar masalah dan dependency-nya sama. Namun setiap finding tetap:

- memiliki acceptance criteria sendiri;
- memiliki automated test sendiri atau assertion eksplisit;
- memiliki runtime evidence sendiri;
- diperbarui statusnya satu per satu;
- tidak boleh ditutup hanya karena issue secara umum terlihat selesai.

---

## 3. Finding Scope

### A13-059 — Browser routing tidak canonical

```text
Severity : critical
Area     : Global Router
Scope    : seluruh route frontend
```

Observed:

- aplikasi memakai `createMemoryRouter`;
- initial browser path dibaca sekali;
- path browser lalu ditulis ulang ke `/`;
- URL tidak merepresentasikan lokasi aplikasi;
- bookmark/share/back/forward tidak canonical.

Expected:

- URL mempertahankan route aktif;
- direct navigation membuka route yang benar;
- refresh mempertahankan halaman;
- route dapat di-bookmark dan dibagikan;
- browser back/forward mengikuti navigation history.

### A13-254 — Unsafe route error boundary

```text
Severity : high
Area     : Global Router / Reports
Scope    : runtime exception pada route
```

Observed:

- React Router default error UI muncul pada uncaught route/render error;
- user melihat `Unexpected Application Error`;
- stack trace, source path, dan pesan developer dapat terlihat;
- tidak ada recovery experience canonical.

Expected:

- production fallback aman;
- raw stack/source path tidak dirender;
- user dapat retry atau kembali;
- detail teknis hanya masuk logging/telemetry yang disetujui;
- error satu route tidak menjatuhkan seluruh session tanpa recovery.

### A13-271 — Settings deep-link/refresh dan session bootstrap

```text
Severity : high
Area     : Settings / Global Router
Scope    : /settings/*
```

Observed:

- direct new-tab settings dapat dipantulkan ke login;
- refresh settings kembali ke dashboard/root;
- URL selalu root;
- browser navigation tidak merepresentasikan settings route.

Expected:

- `/settings/users` dan route settings lain dapat dibuka langsung;
- refresh mempertahankan route;
- authenticated new tab tidak logout secara keliru;
- auth redirect menyimpan destination dan mengembalikannya setelah login;
- URL merepresentasikan route settings.

---

## 4. Source Evidence Saat Ini

### 4.1 Router

File:

```text
src/router/index.tsx
```

Current behavior:

```ts
const initialEntry = `${window.location.pathname}${window.location.search}${window.location.hash}`

if (window.location.pathname !== '/') {
  window.history.replaceState(window.history.state, '', '/')
}

export const router = createMemoryRouter(..., {
  initialEntries: [initialEntry],
})
```

Impact:

- browser path dihapus;
- internal navigation hidup hanya di memory history;
- browser URL dan app route berbeda;
- refresh tidak memiliki route aktif untuk dipulihkan;
- deployment tidak pernah benar-benar diuji sebagai SPA deep-link host.

### 4.2 Route error containment

Router tidak menetapkan:

```text
errorElement
ErrorBoundary route module
production-safe route fallback
```

React Router memakai default error boundary ketika route melempar error.

### 4.3 Shared ErrorBoundary

File:

```text
src/components/shared/feedback/ErrorBoundary.tsx
```

Current status:

- component tersedia;
- tidak dipasang pada application root atau route tree;
- fallback merender `this.state.error?.message`;
- `componentDidCatch` hanya `console.error`;
- reset hanya menghapus state tanpa menjamin route/query recovery.

Raw `error.message` tidak aman sebagai production user copy karena dapat memuat:

- endpoint;
- source path;
- internal field;
- stack-adjacent diagnostic;
- sensitive business/debug detail.

### 4.4 Auth/session bootstrap

Files:

```text
src/main.tsx
src/stores/useAuthStore.ts
src/router/guards.tsx
```

Current storage:

```text
token/auth state : localStorage, key seaside-auth
session marker   : sessionStorage, key auth-session
```

Current startup:

```ts
if (!rememberMe && !sessionStorage.getItem('auth-session')) {
  logout()
}
```

Consequence:

- user dengan `rememberMe=false` memiliki auth state persisted di localStorage;
- tab baru tidak memiliki `auth-session`;
- startup langsung logout;
- deep-link di tab baru dipantulkan ke login;
- destination berada di navigation state yang hilang setelah reload penuh bila tidak dipersist dengan desain eksplisit.

Catatan:

- Jangan “memperbaiki” ini dengan membuat semua session permanen.
- Semantics `remember me`, same-tab refresh, new-tab behavior, dan session expiration harus ditetapkan eksplisit.

### 4.5 Company bootstrap

`activeCompanyId` tersimpan di auth store, tetapi object `activeCompany` berada pada store non-persistent.

Guard onboarding membaca:

```text
activeCompany.settings.onboarding_completed
```

Phase 24 harus memastikan route guard menunggu/bootstrap context yang diperlukan sebelum mengambil keputusan redirect. Jangan menganggap keberadaan ID selalu berarti company object siap.

### 4.6 Test foundation

Current repository:

- dependency `@playwright/test` tersedia;
- belum ada `playwright.config.ts` canonical di root;
- belum ada permanent Phase 24 route regression suite;
- audit sebelumnya memakai script/ad-hoc browser execution;
- tidak ada command package yang menjelaskan project route-mock/live-read-only.

---

## 5. Root Cause

### Root cause 1 — Hidden URL diperlakukan sebagai requirement lama

Phase lama sengaja mengganti browser router dengan memory router dan membersihkan address bar. Audit-13 membuktikan tradeoff tersebut merusak capability browser yang fundamental.

Aturan hidden URL dari Audit-11 telah superseded.

### Root cause 2 — Router state dan tab state terlalu dicampur

Virtual tabs adalah UI workspace state. Browser URL adalah navigation state. Keduanya boleh terhubung, tetapi tidak boleh saling menggantikan.

Target:

```text
Browser URL = route aktif yang dapat direload
Tab store    = daftar workspace/tab dan metadata UI
```

### Root cause 3 — Session lifetime tidak dimodelkan eksplisit

Auth state persisted ke localStorage sementara session marker berada di sessionStorage. Startup logout dilakukan sebelum navigation flow memiliki kesempatan memulihkan destination.

### Root cause 4 — Tidak ada route-level production fallback

Shared ErrorBoundary tidak terpasang dan router tidak memiliki `errorElement`, sehingga fallback developer dari React Router muncul.

### Root cause 5 — Tidak ada permanent regression harness

Router, auth bootstrap, route exception, dan viewport hanya diuji ad-hoc. Behavior yang sebelumnya sengaja diubah tidak memiliki regression test untuk capability browser canonical.

---

## 6. Canonical Behavior Decision

### 6.1 Router

Target canonical:

```text
createBrowserRouter
browser URL mengikuti route aktif
SPA host fallback mengarah ke index.html
```

Tidak boleh:

```text
window.history.replaceState(..., '/', '/')
menyembunyikan route di memory history
menyimpan route aktif hanya di Zustand/sessionStorage
```

### 6.2 Virtual tabs

Virtual tabs tetap dipertahankan sebagai UI workspace.

Ketika user:

- membuka ribbon item: tab dibuat/diaktifkan dan browser navigate ke path;
- memilih primary/secondary tab: browser navigate ke path tab;
- memakai browser back/forward: active tab state disinkronkan tanpa membuat loop;
- refresh: route browser dirender dan tab yang relevan direkonstruksi/diaktifkan secara aman;
- membuka direct link: route tidak bergantung tab sudah ada.

Exact synchronization strategy harus ditetapkan di prompt/implementation setelah semua tab consumer dibaca.

### 6.3 Auth session

Behavior minimum:

- same-tab refresh tidak logout selama session valid;
- new-tab behavior mengikuti keputusan `rememberMe` yang eksplisit;
- protected deep-link yang belum authenticated menuju login sambil menyimpan destination;
- setelah login berhasil, user kembali ke destination yang valid;
- expired/invalid token tetap logout;
- tidak ada redirect sebelum auth bootstrap selesai.

Keputusan produk yang masih harus dikunci:

```text
Apakah rememberMe=false boleh digunakan di tab baru?
```

Rekomendasi teknis:

- `rememberMe=false`: auth lifetime tab/session browser, jangan persist token permanen ke localStorage;
- `rememberMe=true`: auth dapat dipulihkan lintas tab/browser restart sesuai security policy;
- storage strategy harus konsisten, bukan localStorage token + sessionStorage marker yang saling bertentangan.

Jika perubahan storage berpotensi memengaruhi security/session policy yang belum disepakati, eskalasi sebelum implementation final.

### 6.4 Error containment

Route error fallback:

- tidak merender raw `error.message`;
- tidak merender stack/source path;
- menampilkan copy generik;
- menyediakan retry/reload route;
- menyediakan kembali ke dashboard/previous safe route;
- membedakan not-found dari unexpected exception;
- mencatat detail hanya melalui logger abstraction;
- tidak mengirim data sensitif ke telemetry.

### 6.5 Deployment

Browser router hanya valid jika host production menyediakan SPA fallback:

```text
unknown non-API path → frontend index.html
/api/*               → backend/API, tidak di-rewrite ke frontend
static assets         → asset aktual atau 404
```

Deployment configuration aktual belum ditemukan di repository frontend. Implementation Phase 24 wajib:

1. mengidentifikasi host/reverse proxy config yang mengelola `app.finlite.my.id`;
2. menambah config di repository yang benar atau mendokumentasikan external change;
3. menguji direct HTTP request pada deep route;
4. tidak menganggap Vite dev fallback membuktikan production fallback.

---

## 7. Contract / Behavior Matrix

| Scenario | Canonical behavior | Finding |
|---|---|---|
| Direct `/master-data/departments` authenticated | Halaman department terbuka, URL tetap sama | A13-059 |
| Refresh detail route | Route/detail tetap aktif | A13-059 |
| Browser back/forward | Route dan active workspace sinkron | A13-059 |
| Copy/share URL | Tab baru membuka target atau login lalu kembali ke target | A13-059/A13-271 |
| Direct `/settings/users` authenticated | Settings users terbuka | A13-271 |
| Direct protected route unauthenticated | Login dengan destination aman | A13-271 |
| Login selesai | Redirect ke destination valid | A13-271 |
| Session invalid | Logout dan login, tanpa redirect loop | A13-271 |
| Company context belum siap | Loading/bootstrap state, bukan redirect salah | A13-271 |
| Route component throw | Safe error fallback | A13-254 |
| Error fallback production | Tanpa raw message/stack/source path | A13-254 |
| Retry recovery | Route dapat dicoba ulang/reload | A13-254 |
| Unknown route | NotFoundPage, bukan generic exception | A13-254 |
| API 500 yang ditangani page | Page error state, bukan route crash | Foundation |
| Malformed response melempar | Route fallback mengandung crash | A13-254 |

---

## 8. Candidate Files

Existing files yang kemungkinan berubah:

```text
src/router/index.tsx
src/router/guards.tsx
src/main.tsx
src/stores/useAuthStore.ts
src/stores/useCompanyStore.ts
src/stores/useTabStore.ts
src/components/shared/feedback/ErrorBoundary.tsx
src/components/shared/layout/PrimaryTabs.tsx
src/components/shared/layout/SecondaryTabs.tsx
src/components/shared/layout/RibbonPanel.tsx
package.json
vite.config.ts
```

Candidate new files, final naming ditetapkan prompt Phase 24:

```text
playwright.config.ts
tests/e2e/fixtures/*
tests/e2e/router/*
src/router/RouteErrorBoundary.tsx
src/router/routerTelemetry.ts atau logger abstraction yang sesuai
src/router/authDestination.ts jika diperlukan
```

Deployment file mungkin berada di luar repository. Jangan membuat config spekulatif tanpa mengetahui platform.

---

## 9. Test Foundation Requirements

### 9.1 Playwright projects

Minimum:

```text
route-mock
live-read-only
```

Optional setelah local backend siap:

```text
local-integration
```

Mutation/destructive project tidak boleh mengarah ke production.

### 9.2 Shared fixtures

- login/bootstrap helper;
- active company bootstrap;
- route mock helper;
- console/page error collector;
- failed request collector;
- viewport presets;
- test data prefix `AUDIT-`;
- safe storage/session setup.

### 9.3 Required Phase 24 tests

#### A13-059

- direct deep-link master data;
- direct deep-link detail/form representative;
- refresh route;
- browser back/forward;
- query string/hash preservation jika didukung;
- active tab sync;
- unknown path not-found;
- production-like server fallback.

#### A13-254

- route component throws;
- fallback contains safe copy;
- fallback does not contain stack/source path/raw sentinel error;
- retry/reload action;
- navigation to safe route;
- page-level API error does not unnecessarily trigger route fallback.

#### A13-271

- direct `/settings/users`;
- refresh `/settings/users`;
- unauthenticated protected deep-link;
- login returns to destination;
- same-tab session refresh;
- new-tab behavior for `rememberMe=true`;
- decided behavior for `rememberMe=false`;
- company bootstrap loading;
- no redirect loop.

### 9.4 Viewports

```text
1440 x 900
1180 x 708
1024 x 656
390 x 844
```

Router behavior primarily functional, tetapi fallback UI harus aman pada seluruh viewport.

---

## 10. Backend and Deployment Scope

Tidak ada domain API baru yang wajib untuk ketiga finding ini.

Backend/deployment checks:

- API routes tidak tertangkap SPA fallback;
- unauthorized response tetap JSON, bukan index.html;
- production host melayani deep-link frontend;
- cache/static asset policy tidak merusak fallback;
- security header dan error response tidak membocorkan stack.

Jika deployment config berada di backend/reverse proxy repository, perubahan dilakukan pada repository tersebut dengan test/smoke yang relevan.

---

## 11. Acceptance Criteria per Finding

### A13-059 verified jika

- aplikasi memakai browser routing canonical;
- URL merepresentasikan route aktif;
- `replaceState('/')` removal tidak ada;
- direct deep-link representative berhasil;
- refresh mempertahankan route;
- back/forward lulus;
- virtual tabs tetap bekerja;
- SPA production fallback dibuktikan;
- Playwright evidence tersedia.

### A13-254 verified jika

- router memiliki production-safe error boundary;
- raw sentinel error tidak tampil;
- stack/source path tidak tampil;
- fallback memiliki recovery action;
- not-found tetap memakai NotFoundPage;
- page-level expected error tidak berubah menjadi app crash;
- desktop/mobile Playwright evidence tersedia.

### A13-271 verified jika

- direct dan refresh `/settings/*` berhasil;
- protected destination dipertahankan melalui login;
- auth bootstrap tidak melakukan redirect prematur;
- session storage behavior konsisten dengan `rememberMe`;
- company bootstrap tidak menyebabkan redirect salah;
- tidak ada redirect loop;
- Playwright evidence tersedia.

---

## 12. Mandatory Validation Matrix

Phase 24 hanya boleh selesai jika:

```text
3 finding coverage
= 3 baris validation finding
= 3 finding verified
```

| Finding | Automated test | Runtime retest | Invariant/behavior | Regression | Status | Evidence |
|---|---|---|---|---|---|---|
| A13-059 | Pending | Pending | URL/deep-link/history/tab sync | Pending | open | |
| A13-254 | Pending | Pending | safe containment/no leak | Pending | open | |
| A13-271 | Pending | Pending | auth/company bootstrap/destination | Pending | open | |

Selain tiga finding, Phase 24 harus mencatat:

- test harness dapat dijalankan dengan command tetap;
- tidak ada regression shell/ribbon/tab;
- tidak ada regression login/company/onboarding;
- tidak ada console/page error baru;
- build/lint tetap lulus.

Jika satu baris belum `verified`, Phase 24 tetap `in-progress`.

---

## 13. Regression Surface

Wajib diuji setelah perubahan router:

- login;
- logout;
- remember me;
- company picker;
- onboarding redirect;
- dashboard;
- ribbon navigation;
- primary tabs;
- secondary tabs;
- close tab dan fallback tab;
- permission redirect;
- `/403`;
- `/500`;
- `/network-error`;
- `/maintenance`;
- unknown route;
- representative list/create/detail route setiap module family;
- query cache tidak reset tanpa alasan pada navigation;
- browser reload tidak membuat duplicate tabs tanpa batas.

---

## 14. Non-Goals

Phase 24 tidak boleh mencakup:

- memperbaiki seluruh DTO/report crash yang sudah dipetakan ke phase domain;
- mengubah permission key domain;
- redesign AppShell/ribbon/tabs;
- mengganti seluruh state management;
- membuat telemetry vendor integration tanpa keputusan;
- memperbaiki dashboard endpoint;
- memperbaiki settings business contract selain bootstrap/router;
- menutup A13-254 hanya dengan menyembunyikan detail React Router lewat CSS;
- menutup A13-059 hanya dengan menyimpan last route di localStorage.

---

## 15. Risks and Mitigation

| Risiko | Mitigasi |
|---|---|
| Production host tidak punya SPA fallback | Identifikasi config sebelum switch; test direct HTTP deep route |
| Virtual tab dan URL loop | Satu arah navigation yang eksplisit; regression back/forward/tab |
| Auth redirect loop | Bootstrap readiness state dan destination validation |
| Open redirect melalui destination | Hanya izinkan internal canonical path |
| rememberMe semantics berubah | Contract decision dan session tests |
| Error fallback tetap membocorkan detail | Sentinel error assertions dan production build test |
| Error boundary menelan expected API state | Bedakan handled query error dari uncaught exception |
| Existing user storage tidak compatible | Version/migration/clear strategy untuk persisted auth/tab |
| New route duplicates tab | Rehydrate/sync test |

---

## 16. Open Decisions Sebelum Implementation

Wajib diputuskan pada prompt/implementation:

1. Storage canonical untuk `rememberMe=false`.
2. Behavior new tab untuk session non-remembered.
3. Mekanisme bootstrap active company dari persisted ID.
4. Sinkronisasi browser history dengan virtual tabs.
5. Deployment platform dan lokasi SPA fallback config.
6. Logger abstraction minimum untuk uncaught route errors.
7. Apakah root React ErrorBoundary tetap diperlukan selain router `errorElement`.

Default aman:

- jangan persist non-remembered token lintas browser restart;
- destination hanya internal path;
- jangan kirim raw error ke UI;
- jangan menambah external telemetry tanpa persetujuan;
- jangan switch router sebelum production fallback diketahui.

---

## 17. Implementation Sequence

```text
1. Buat prompt Phase 24.
2. Kunci open decisions.
3. Tambahkan Playwright config dan baseline failing tests.
4. Tambahkan route error boundary dan tests.
5. Migrasikan router dan deployment fallback.
6. Perbaiki auth/company bootstrap.
7. Sinkronkan virtual tabs dan browser history.
8. Jalankan targeted tests.
9. Jalankan regression surface.
10. Jalankan mandatory validation matrix.
11. Update A13-059, A13-254, A13-271 satu per satu.
12. Tutup Phase 24 hanya jika ketiganya verified.
```

---

## 18. Verification Commands

```bash
cd /workspace/frontend
npm run build
npm run lint
npx playwright test <phase-24-scope>
```

Jika deployment/backend config berubah:

```bash
cd /workspace/laravel_backend
php artisan test --filter=<route-or-fallback-scope>
vendor/bin/pint --test
```

Tambahkan direct HTTP smoke terhadap deployment-like server untuk membuktikan deep-link fallback.

---

## 19. Exit Decision

Current:

```text
Issue detail : complete
Prompt Phase 24: not created
Implementation: not started
Validation    : not started
Phase status  : planned
```

Next:

```text
Create docs/prompt/prompt-phase-24-remediation-foundation-router.md
```
