# Phase 24 — Completion Report

Tanggal: 2026-06-21
Phase: 24 — Test Foundation, Global Runtime Containment, and Router Canonicalization
Status: ✅ Done — A13-059, A13-254, A13-271 verified
Referensi: `../issue_docs/issue-27-phase-24-runtime-router-foundation.md`, `../prompt/prompt-phase-24-remediation-foundation-router.md`, `../gap_docs/gap-10-audit-13-remediation-roadmap.md`

---

## 1. Ringkasan

Phase 24 menutup tiga finding runtime/navigation yang berbagi akar masalah dan
menyiapkan regression harness permanen untuk Phase 25–39.

| Finding | Severity | Status | Evidence |
|---|---|---|---|
| A13-059 | critical | verified | `tests/e2e/router/deep-link.spec.ts` |
| A13-254 | high | verified | `tests/e2e/router/error-containment.spec.ts` |
| A13-271 | high | verified | `tests/e2e/router/settings-bootstrap.spec.ts` |

Mandatory validation gate Spec-37 §17.1: `3 finding coverage = 3 checklist = 3 verified`.

---

## 2. Perubahan Implementasi

### 2.1 Router canonical (A13-059)

- `src/router/index.tsx`: `createMemoryRouter` → `createBrowserRouter`.
- Dihapus: pembacaan `initialEntry` + `window.history.replaceState(..., '/')`
  yang membersihkan address bar.
- Seluruh route dibungkus pathless root route ber-`errorElement`.

### 2.2 Production-safe error containment (A13-254)

- Baru `src/router/RouteErrorBoundary.tsx`: `errorElement` canonical.
  404 response → `NotFoundPage`; error lain → fallback generik "500" dengan
  recovery (Coba Lagi / Ke Dashboard). Tidak pernah merender message/stack/source.
- Baru `src/router/routerTelemetry.ts`: `logRouteError` — detail teknis hanya ke
  channel log (console; detail penuh hanya di DEV). Tidak ada telemetry vendor
  eksternal (keputusan ditahan, issue-27 §16).
- `src/components/shared/feedback/ErrorBoundary.tsx`: berhenti merender
  `error.message`; pakai copy generik + `logRouteError`.

### 2.3 Auth/session bootstrap (A13-271)

Keputusan produk (dikunci bersama user 2026-06-21): **opsi "Ingat saya"
(rememberMe) dihapus sepenuhnya.** Model sesi menjadi tunggal & konsisten.

- `src/modules/auth/schemas/loginSchema.ts`: hapus field `remember_me`.
- `src/modules/auth/pages/LoginPage.tsx`: hapus checkbox + import `Checkbox`,
  `defaultValues`, dan argumen `remember_me` pada `authApi.login`/`setAuth`.
- `src/types/auth.types.ts`: hapus `remember_me` dari `LoginPayload`.
- `src/stores/useAuthStore.ts`: hapus field `rememberMe`, marker
  `sessionStorage('auth-session')`, dan parameter `rememberMe` pada `setAuth`.
- `src/main.tsx`: hapus blok startup-logout
  (`if (!rememberMe && !sessionStorage.getItem('auth-session')) logout()`) —
  akar pantulan deep-link/new-tab ke `/login`.

Akibat: token ter-persist di localStorage; refresh/new-tab/deep-link
authenticated tidak logout prematur; expiry tetap ditangani
`useSessionTimeout` + interceptor 401. Tidak ada lagi kontradiksi
localStorage-token + sessionStorage-marker.

### 2.4 Test foundation

- `playwright.config.ts`: project `route-mock` (deterministik, webServer Vite dev)
  + `live-read-only` opt-in (`PLAYWRIGHT_LIVE=1`).
- `tests/e2e/fixtures/test.ts`: error collector (console/page/failed request),
  `seedAuth`/`clearAuth`, `mockApi`.
- `tests/e2e/fixtures/viewports.ts`: matrix 1440×900 / 1180×708 / 1024×656 / 390×844.
- `tests/e2e/router/*.spec.ts`: 12 test untuk tiga finding.
- `package.json`: script `test:e2e`, `test:e2e:ui`.
- `eslint.config.js`: override Node globals + matikan react-hooks/react-refresh
  untuk glob `tests/**` & `playwright.config.ts` (fixture `use()` bukan React Hook).

---

## 3. Verifikasi

```
npm run build   → ✅ 0 error
npm run lint    → ✅ 0 error, 35 warning (legacy RHF/useMemo, file tak disentuh)
npx playwright test --project=route-mock → ✅ 12 passed
```

Bukti boundary menangkap throw nyata: malformed API (`data: 'not-an-array'`) pada
`/master-data/units` → fallback "500 / Coba Lagi / Ke Dashboard", tanpa overlay/stack.

---

## 4. Mandatory Validation Matrix

| Finding | Automated test | Runtime retest | Invariant | Regression | Status |
|---|---|---|---|---|---|
| A13-059 | deep-link.spec.ts (5) | route-mock Chromium desktop+mobile | URL/deep-link/history canonical | tidak ada | verified |
| A13-254 | error-containment.spec.ts (3) | route-mock + probe throw nyata | safe fallback, no leak, not-found tetap | tidak ada | verified |
| A13-271 | settings-bootstrap.spec.ts (4) | route-mock direct/refresh/unauth | bootstrap tanpa pantulan/loop | tidak ada | verified |

---

## 5. Open Items (di luar scope, dicatat)

1. **SPA fallback host PRODUCTION** (`app.finlite.my.id`): arsitektur deploy
   diputuskan **Opsi A — frontend Vercel + backend DigitalOcean + CORS**
   (keputusan user 2026-06-21). Artefak config + panduan sudah dibuat:
   `vercel.json` (SPA fallback), `.env.production.example`,
   `deploy/nginx-backend.conf.example`, backend `config/cors.php` env-driven,
   dan `docs/deployment/deploy-guide-vercel-do.md`. **Sisa**: eksekusi deploy +
   verifikasi `curl -I https://app.finlite.my.id/settings/users` (200 index.html,
   bukan 404) di host produksi nyata — belum dijalankan.
2. Warning lint legacy (35) di file yang tidak disentuh phase ini → Phase 38.

---

## 6. Dokumentasi yang diperbarui

- Audit-13 tracker: A13-059/254/271 → verified + evidence.
- GAP-10 roadmap: baseline count + documentation tracker (completion report Phase 24).
- AGENTS.md §6A/§6C/§6D.
- `docs/struktur_frontend.md`: file baru router + tests.
