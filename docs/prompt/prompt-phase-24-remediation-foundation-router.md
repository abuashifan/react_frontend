# Prompt — Phase 24: Test Foundation, Global Runtime Containment, and Router Canonicalization

**Phase**: 24  
**Status**: Planned - execution checklist untuk remediation Audit-13  
**Referensi utama**: `../issue_docs/issue-27-phase-24-runtime-router-foundation.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-27-phase-24-runtime-router-foundation.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
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
```

Jika deployment fallback atau host routing perlu dibuktikan, baca juga config host/reverse proxy yang relevan di repo yang benar. Jangan berasumsi Vite dev server sudah cukup untuk membuktikan production SPA fallback.

---

## 1. Tujuan Phase

Phase 24 menutup tiga finding Audit-13 yang berbagi akar masalah runtime/navigation:

- A13-059: browser routing tidak canonical;
- A13-254: unsafe route error boundary;
- A13-271: settings deep-link/refresh dan session bootstrap.

Target hasil:

- browser URL merepresentasikan route aktif;
- refresh dan deep-link tetap bekerja;
- production route error containment aman;
- auth bootstrap tidak merusak destination route;
- session/sessionStorage/localStorage semantics eksplisit;
- regression harness permanen tersedia untuk phase berikutnya.

Phase ini tidak ditujukan untuk menyelesaikan seluruh domain DTO/business rule. Fokusnya adalah fondasi runtime yang akan dipakai Phase 25–39.

---

## 2. Non-Negotiable Guardrails

- Jangan mempertahankan `createMemoryRouter` sebagai canonical solution untuk route yang harus bisa di-bookmark/share/reload.
- Jangan menghapus route URL dari browser address bar sebagai strategi normal.
- Jangan menampilkan `error.message` mentah, stack trace, atau source path ke user production.
- Jangan membuat semua auth session permanen hanya untuk melewati bug new-tab.
- Jangan menyamakan `rememberMe=false` dengan token yang tetap hidup lintas browser restart tanpa keputusan produk.
- Jangan menyamarkan redirect loop dengan fallback yang diam-diam menyingkirkan destination route.
- Jangan menutup issue routing dengan memindahkan state ke sessionStorage/localStorage jika browser URL tetap salah.
- Jangan redesign shell, ribbon, atau tab architecture lebih jauh dari yang diperlukan untuk canonical routing.
- Jangan membuat endpoint fiktif untuk test foundation.
- Jangan edit `src/components/ui/`.
- Jangan menambahkan `any` tanpa justifikasi.
- Jangan membuat fix yang hanya berlaku pada route tertentu bila root cause bersifat global.

Supersession rules:

- aturan Audit-11 tentang hidden URL/memory router dianggap superseded untuk Phase 24–39;
- aturan lama yang menyatakan backend read-only juga superseded;
- gunakan Spec-37 sebagai kontrak runtime dan validation yang aktif.

---

## 3. Deliverables

### File yang kemungkinan dibuat baru

```text
playwright.config.ts
tests/e2e/router/*.spec.ts
tests/e2e/fixtures/*
src/router/RouteErrorBoundary.tsx
src/router/authDestination.ts
src/router/routerTelemetry.ts
```

### File yang kemungkinan diubah

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
vite.config.ts
package.json
docs/struktur_frontend.md
docs/prompt/prompt-00-master-index.md
```

Jika deployment host/fallback perlu dicatat, update dokumentasi yang relevan di repo deployment/backend yang benar.

---

## 4. Execution Plan

### Step 1 - Lock the decisions

Sebelum coding, tulis keputusan untuk:

1. canonical router strategy;
2. production SPA fallback strategy;
3. auth destination persistence strategy;
4. rememberMe=false behavior in same-tab and new-tab;
5. company bootstrap readiness signal;
6. route error boundary placement;
7. logger/telemetry boundary for unexpected route errors.

Kalau ada keputusan yang belum aman diputuskan, hentikan dan eskalasi. Jangan lanjut pakai asumsi.

### Step 2 - Build test foundation first

Tambahkan regression harness yang bisa dipakai sebelum dan sesudah refactor:

- Playwright config canonical;
- login/bootstrap helper;
- active company helper;
- console/page error collector;
- failed request collector;
- viewport presets;
- route-mock vs live-read-only project separation.

Baseline test harus bisa membuktikan:

- direct deep-link representative;
- refresh representative;
- browser history/back-forward;
- error boundary fallback;
- session bootstrap behavior;
- settings route recovery.

### Step 3 - Implement route containment

Kerjakan routing canonical dan fallback aman:

- browser URL dan app route harus sinkron;
- route-level error containment harus tersedia;
- not-found tetap not-found;
- unexpected render/route error harus masuk safe fallback;
- user harus punya recovery path yang jelas;
- stack/source path tidak boleh muncul di UI production.

### Step 4 - Fix auth/session bootstrap

Kerjakan state startup supaya:

- auth bootstrap tidak logout prematur saat route sedang dipulihkan;
- destination internal path bisa dipertahankan sampai redirect selesai;
- new-tab behavior mengikuti keputusan `rememberMe`;
- invalid/expired session tetap logout dengan jelas;
- company bootstrap tidak memicu redirect salah karena object belum siap.

### Step 5 - Sync tabs with canonical routing

Perbaiki sinkronisasi tab/navigation hanya sejauh yang diperlukan agar:

- active primary/secondary tab mengikuti route aktif;
- browser back/forward tidak memutus workspace;
- refresh tidak kehilangan route;
- route dan tab state tidak saling meniadakan;
- internal tab state tetap menjadi UI workspace state, bukan pengganti browser URL.

### Step 6 - Add safety helpers only if needed

Tambahkan helper kecil jika dibutuhkan:

- auth destination validator;
- route error logger abstraction;
- tab-route sync helper;
- session bootstrap readiness flag;
- redirect guard agar destination selalu internal path yang valid.

Jangan memperluas helper menjadi domain layer baru.

---

## 5. Implementation Notes

### 5.1 Router

Tujuan router:

- direct navigation bekerja;
- refresh bekerja;
- browser URL tidak dibersihkan ke root;
- production fallback mendukung SPA deep-link;
- route-level `errorElement` atau equivalent aman dipasang.

Perubahan yang perlu dihindari:

- jangan menyelesaikan problem dengan mematikan navigation history;
- jangan menyembunyikan route di memory router sebagai final architecture;
- jangan memindahkan source of truth route ke Zustand.

### 5.2 Error boundary

Pastikan:

- error boundary terpasang pada titik yang benar;
- fallback generic, aman, dan dapat recovery;
- route render error tidak memunculkan developer overlay di production build;
- error detail hanya dicatat di logger.

### 5.3 Auth/session

Pastikan:

- destination internal path dipersist dengan aman hanya selama flow yang dibutuhkan;
- startup tidak menghapus auth state valid terlalu dini;
- `rememberMe=false` tidak otomatis berarti session semestinya hilang saat new tab jika product decision menyatakan sebaliknya;
- apapun keputusan finalnya, ia harus eksplisit dan diuji.

### 5.4 Tabs

Jika tab sync berubah, jaga invariant:

- workspace tabs tetap ada;
- active route tetap canonical;
- close tab/fallback tab tetap bekerja;
- internal route browsing tidak membuat double-scroll atau broken shell.

---

## 6. Required Test Scenarios

### A13-059

- buka deep-link representative langsung;
- refresh page pada route representative;
- back/forward tetap valid;
- route tidak hilang dari browser URL;
- route bisa di-bookmark/share;
- fallback production SPA terbukti.

### A13-254

- route/render throw menghasilkan safe fallback;
- fallback tidak memuat stack/source path/raw message;
- recovery action ada;
- not-found tetap not-found;
- error boundary tidak mematikan seluruh app tanpa fallback.

### A13-271

- direct `/settings/users` authenticated;
- refresh `/settings/users`;
- protected deep-link unauthenticated menuju login lalu kembali ke destination;
- new tab behavior sesuai decision `rememberMe`;
- company bootstrap tidak redirect salah;
- tidak ada redirect loop.

### Regression surface tambahan

- login/logout;
- company picker;
- onboarding redirect;
- dashboard;
- ribbon navigation;
- primary/secondary tabs;
- close tab fallback;
- `/403`, `/500`, `/network-error`, `/maintenance`;
- unknown route;
- console/page error capture.

---

## 7. Verification

Jalankan:

```bash
cd /workspace/frontend
npm run build
npm run lint
npx playwright test <phase-24-scope>
```

Jika backend/reverse proxy/fallback config berubah:

```bash
cd /workspace/laravel_backend
php artisan test --filter=<relevant-scope>
vendor/bin/pint --test
```

Manual checks minimum:

- URL mencerminkan route aktif;
- refresh tidak memutus halaman;
- direct settings deep-link tetap bekerja;
- error route tampil aman;
- tab/shell tidak regress;
- tidak ada `Unexpected Application Error` atau raw stack leak;
- no unexpected console errors.

---

## 8. Completion Rules

Phase 24 hanya boleh ditutup jika:

- A13-059 verified;
- A13-254 verified;
- A13-271 verified;
- mandatory validation gate Spec-37 §17.1 lulus;
- total finding phase = total checklist = total verified;
- tidak ada regression baru yang belum diselesaikan;
- build/lint/test lulus sesuai scope;
- dokumentasi diperbarui.

Dokumentasi setelah selesai:

- Audit-13 tracker;
- GAP-10 tracker;
- completion report Phase 24;
- AGENTS.md section 6;
- `docs/struktur_frontend.md` jika ada file baru.

---

## 9. Out of Scope

Jangan campur Phase 24 dengan:

- perbaikan DTO master data;
- sales/purchase transaction contract;
- accounting posting logic;
- reports contract;
- fixed assets;
- period-end business rules;
- settings access refactor di luar bootstrap/router;
- redesign visual shell.

Kalau ada regression di luar scope, catat sebagai finding baru dan kembalikan ke tracker Phase 24/25 sesuai akar masalahnya.
