# Prompt Guardrails — Audit-11 Implementation

**Status**: Wajib dibaca sebelum menjalankan prompt phase 14+  
**Scope**: Semua implementasi setelah Audit-11  
**Tujuan**: Menjaga shell, viewport, ribbon, virtual tabs, dan hidden URL behavior tetap utuh saat memperbaiki kontrak API/DTO.

---

## 1. Dokumen Wajib Dibaca

```text
docs/AGENT_ENTRY_POINT.md
docs/audit_docs/audit-11-frontend-global-contract-map-16-06-26.md
docs/praproduction_docs/spec-23-tablet-first-layout-rules.md
docs/praproduction_docs/spec-34-route-ribbon-canonical-map.md
docs/design_docs/design-A1-topbar-ribbon.md
```

---

## 2. Guardrails Viewport

Jangan merusak aturan viewport/tablet-first:

- Root AppShell tetap `h-dvh overflow-hidden`.
- Jangan ganti ke `h-screen`, `min-h-screen`, `100vh`, atau `calc(100vh - ...)`.
- Scroll hanya boleh di region internal page, bukan body/root shell.
- Topbar height tetap `52px`.
- Ribbon overlay height tetap `64px`.
- Primary tabs tetap `36px`.
- Secondary tabs tetap `32px`.
- Bottom action bar tetap `56px`.
- Ribbon tetap overlay; jangan memasukkan ribbon ke height calculation content.

Sebelum selesai implementasi, grep manual untuk memastikan file yang disentuh tidak menambah:

```text
h-screen
min-h-screen
100vh
```

---

## 3. Guardrails Topbar

Topbar module buttons tidak boleh membuka route halaman.

Topbar hanya boleh:

```text
setActiveModule(moduleKey)
openRibbon()
closeRibbon()
```

Topbar module click tidak boleh:

```text
navigate('/sales/...')
window.location.href = ...
history.pushState(...)
```

Pengecualian:

- logout boleh navigate ke `/login`;
- switch company boleh navigate ke `/select-company`;
- auth/onboarding flow boleh tetap memakai route internal.

Untuk module ERP, jalur benar adalah:

```text
Topbar module icon -> activeModule state -> RibbonPanel terbuka
Ribbon item click -> open tab state + navigate internal memory route
```

---

## 4. Guardrails Ribbon Menu

Ribbon item boleh melakukan internal `navigate(item.path)` karena router memakai memory router.

Namun:

- Path ribbon harus frontend route canonical, bukan API endpoint.
- COA frontend route tetap `/master-data/coa`, walau API endpoint `/master-data/chart-of-accounts`.
- Parent route tanpa page harus diarahkan ke default child route, misalnya `/sales/ar/summary`.
- Jangan membuat placeholder route hanya untuk menutup mismatch.
- Jangan mengubah visual ribbon tanpa membaca `design-A1-topbar-ribbon.md`.

---

## 5. Guardrails Virtual Tabs

Virtual tabs adalah state UI, bukan URL browser.

State canonical:

```text
src/stores/useTabStore.ts
storage: sessionStorage
persist key: seaside-erp-tabs
```

Jangan ubah ke:

```text
localStorage
URL query params
hash route
backend persistence
Zustand API-data store
```

Primary tab wajib menyimpan:

```text
id
menuKey
label
module
path
```

Secondary tab wajib menyimpan:

```text
id
label
type
path
pinned
formState?
```

Route untuk list/create/detail boleh disimpan di tab state. Ini adalah internal route state untuk memory router.

---

## 6. Guardrails Hidden URL

Browser address bar harus tetap tidak mengikuti internal app route.

Current behavior:

```text
src/router/index.tsx memakai createMemoryRouter
initialEntries membaca path awal
window.history.replaceState(..., '/', '/') membersihkan address bar
```

Jangan ganti ke:

```text
createBrowserRouter
BrowserRouter
window.history.pushState internal route
Link yang sengaja expose internal route di address bar
```

Acceptance:

- User tetap melihat `app.finlite.my.id` atau root `/`.
- Internal route seperti `/sales/orders` tetap boleh ada di memory router.
- Copy URL spesifik halaman tidak menjadi target phase ini.

---

## 7. Guardrails API/Data

- Semua API call tetap di `src/modules/{module}/services/`.
- Jangan fetch langsung di component.
- Jangan simpan API response di Zustand.
- Jangan menambah business DTO mapping besar di `src/services/http.ts`; pakai service adapter.
- Jangan edit backend.
- Jangan edit `src/components/ui/`.
- Jangan pakai `any` tanpa komentar justifikasi.

---

## 8. Verification Minimum

Setiap phase implementasi harus:

```bash
cd /workspace/frontend
npm run build
```

Untuk phase yang menyentuh shell/navigation, juga verifikasi manual:

- klik topbar module hanya membuka ribbon, tidak langsung membuka page;
- klik ribbon item membuka workspace internal;
- primary tab switch memulihkan internal route dari tab state;
- secondary tab switch memulihkan list/form route;
- address bar tetap root;
- refresh browser memulihkan session tab dari `sessionStorage` selama session masih sama;
- tidak ada root/body double scroll.
