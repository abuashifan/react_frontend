# AUDIT REPORT — Seaside Escape ERP Design & Spec Documents
**Tanggal:** 2026-06-14  
**Auditor:** Claude Code (audit-only, no code changes)  
**Scope:** 15 design docs (`docs/design_docs/`) + 22 spec docs (`docs/praproduction_docs/`)

---

## RINGKASAN EKSEKUTIF

| Kategori | Status |
|---|---|
| Responsive & Viewport Rules | ✅ Solid, minor gap |
| Spacing & Sizing | ⚠️ Ada inkonsistensi kritis (bottom bar height) |
| Typography | ✅ Lengkap |
| Color & Theming | ✅ Lengkap |
| Component States | ⚠️ Focus ring tidak terdefinisi |
| Layout Rules | ⚠️ Satu kontradiksi nyata (height 56px vs 60px) |
| Animation & Transition | ⚠️ Beberapa durasi belum dispesifikasikan |
| Accessibility | ⚠️ Focus ring gap, keyboard nav parsial |
| Cross-document Consistency | ❌ 4 kontradiksi terverifikasi |
| Missing Design Documents | ❌ 4 komponen tanpa design doc |

---

## 1. RESPONSIVE & VIEWPORT RULES

| Rule | Status | Sumber | Catatan |
|---|---|---|---|
| Minimum viewport dinyatakan eksplisit | ✅ | spec-01, spec-06 | "iPad mini 6 (768px)" — jelas |
| Pendekatan scaling dijelaskan | ✅ | spec-06 | "Compact Scaling, Bukan Reflow" — sangat jelas, termasuk analogi Excel |
| Breakpoints dengan nilai pixel tepat | ✅ | spec-04, spec-06 | 768px / 1024px / 1280px / 1440px — konsisten |
| Horizontal scroll tabel/form | ✅ | spec-06, spec-08, spec-09 | `overflow-x-auto` + `min-w-full` terdefinisi di beberapa tempat |
| Touch target minimum size | ✅ | spec-06 | "minimum 44px height untuk semua interactive element" di mobile |
| Viewport meta tag | ✅ | spec-06 | `width=device-width, initial-scale=1.0` disebutkan eksplisit |

**Gap kecil:** spec-06 menyebut mobile memerlukan "bottom navigation" sebagai pengganti ribbon di <768px, namun tidak ada design doc untuk komponen ini. Behaviour disebutkan tapi tidak didesain.

---

## 2. SPACING & SIZING

| Rule | Status | Sumber | Catatan |
|---|---|---|---|
| Dimensi fixed dalam px | ✅ | Semua design docs | Semua ukuran dalam px, tidak ada unit relatif |
| Padding/margin per breakpoint | ✅ | spec-06 | Mobile 12px / Tablet 16px / Desktop 24px — jelas |
| Component heights per breakpoint | ✅ | spec-04, spec-06 | Row 36px (tablet) / 40px (desktop), input 34px / 36px — jelas |
| Content area padding-top calculation | ✅ | design-A1, spec-05 | Dokumentasi paling lengkap di seluruh codebase — sangat solid |

**Inkonsistensi terverifikasi — KRITIS:**

> ❌ **Fixed Bottom Bar height: spec-04 vs semua dokumen lain**
> - `spec-04` tabel "Layout Dimensions": `Fixed bottom bar height: **60px**`
> - `spec-05` Zone 7: `Height: **56px**`
> - `design-D3`: `h=**56px**`
> - `design-A1` summary table: `Bottom Bar: **56px**`
>
> **Keputusan diperlukan:** 56px (mayoritas dokumen) atau 60px (spec-04)?

---

## 3. TYPOGRAPHY

| Rule | Status | Sumber | Catatan |
|---|---|---|---|
| Font family eksplisit | ✅ | spec-02, spec-04 | Inter (Google Fonts) — terdefinisi di dua tempat |
| Tabular-nums requirement | ✅ | spec-02, spec-04, CLAUDE.md | Hard rule, global CSS, tailwind class — triple-enforced |
| Font sizes per breakpoint | ✅ | spec-06 | Mobile / Tablet / Desktop semua terdefinisi |
| Font weights per use case | ✅ | spec-04 | Type scale table dengan role, size, weight, line-height |

**Tidak ada gap.** Typography adalah kategori paling solid di seluruh dokumentasi.

---

## 4. COLOR & THEMING

| Rule | Status | Sumber | Catatan |
|---|---|---|---|
| Semua color token dengan hex eksplisit | ✅ | spec-04 | 9 brand tokens + 13 status tokens, semua dengan hex |
| Status colors fully specified | ✅ | spec-04 | draft, submitted, approved, confirmed, posted, partially_paid, paid, void, cancelled, rejected, delivered, received, converted — semua ada |
| Larangan arbitrary colors | ✅ | CLAUDE.md, spec-02 | "DILARANG styling inline atau Tailwind ad-hoc di luar design token" |

**Tidak ada gap.** Color system sangat solid dan konsisten.

---

## 5. COMPONENT STATES

| Rule | Status | Sumber | Catatan |
|---|---|---|---|
| Semua interactive states (default/hover/active/disabled/focus/error) | ⚠️ Parsial | design-C3, design-A1, design-C1 | Default, hover, active, disabled, error: ✅. **Focus ring untuk elemen non-input (button, link, checkbox) tidak didefinisikan.** |
| Loading states (skeleton, spinner) | ✅ | design-C1, design-D3, spec-07 | Skeleton rows DataTable, spinner di button — keduanya ada |
| Empty states | ✅ | design-E4 | Dua konteks (kosong + no results) — sangat lengkap |
| Error states dengan styling tepat | ✅ | design-B, design-C3, design-D1 | `border #ef4444`, error text 12px `#ef4444` — konsisten |

**Gap teridentifikasi:**

> ⚠️ **Focus ring styling belum didefinisikan sebagai global rule.**
> - Input/SearchableSelect punya focus style: `box-shadow: 0 0 0 3px rgba(92,158,173,0.12)` — ✅
> - Button, link, checkbox, tab items: **tidak ada spec focus ring eksplisit** untuk keyboard navigation.
> - spec-06 melarang `user-scalable=no` (accessibility aware), tapi tidak mendefinisikan visual focus indicator untuk non-input elements.

---

## 6. LAYOUT RULES

| Rule | Status | Sumber | Catatan |
|---|---|---|---|
| Z-index stack terdokumentasi | ✅ | design-A1, design-E2 | Topbar z-50, Ribbon z-40, Primary Tabs z-38, Secondary Tabs z-37, Bottom Bar z-40, Toast z-[100] |
| Fixed element heights terdokumentasi | ⚠️ | design-A1, spec-05 | Heights terdokumentasi tapi ada kontradiksi (lihat Sizing section) |
| Dynamic padding-top calculation | ✅ | design-A1, spec-05 | Paling lengkap: expanded 200px, collapsed 136px, form view juga |
| Sidebar collapse behavior | ✅ | spec-06, design-C2 | 220px → 0, `.2s ease`, collapse/expand button jelas |
| Form view vs list view layout | ✅ | spec-05, design-A1 | "Visibility Rules Ringkasan" di kedua dokumen |

**Catatan kecil tentang z-index:**

> ⚠️ `z-45` untuk expand ribbon button (design-A1) adalah **non-standard Tailwind class**. Tailwind default hanya sampai z-40. Perlu konfirmasi apakah ini menggunakan custom config atau `style` inline.
>
> ⚠️ Dialog/modal z-index tidak pernah disebutkan secara eksplisit. VoidConfirmDialog (design-E3) dan Session Warning (design-B) tidak mendefinisikan z-index mereka.

---

## 7. ANIMATION & TRANSITION

| Rule | Status | Sumber | Catatan |
|---|---|---|---|
| Transition durations dispesifikasikan | ⚠️ Parsial | design-A1, design-C2, design-E2 | Ribbon `.18s`, sidebar `.2s`, toast `200ms`/`150ms` — ada. **Bulk action bar, tab transitions: tidak ada duration.** |
| Animation types (ease, ease-in-out) | ⚠️ Parsial | design-A1, design-E2 | Ribbon `ease`, toast `ease-out`/`ease-in` — ada. Sidebar hanya `.2s` tanpa easing type. |
| Specific animations disebutkan | ✅ | design-A1, design-C1, design-E2 | Ribbon collapse, toast slide-in dari kanan, bulk action bar slide-down |

**Gap teridentifikasi:**

> ⚠️ **BulkActionBar animation duration:** design-C1 menyebut "slide-down animasi" tapi tidak ada durasi atau easing type.
>
> ⚠️ **Tab transition:** saat primary/secondary tab aktif berubah, tidak ada spec transition apapun. Apakah instant atau ada fade/slide?
>
> ⚠️ **Filter sidebar animation type:** design-C2 menyebut "width .2s ease" — easing ada, tapi tidak disebutkan di spec-06 yang membahas hal yang sama.

---

## 8. ACCESSIBILITY

| Rule | Status | Sumber | Catatan |
|---|---|---|---|
| Touch target minimum size | ✅ | spec-06 | 44px minimum, mobile-specific |
| Focus ring styling | ❌ Belum didefinisikan | — | Hanya input focus style ada. Tidak ada global focus rule untuk button, link, tab |
| Keyboard navigation | ⚠️ Parsial | design-C3 | SearchableSelect: ↑↓ navigate, Enter select, Escape tutup ✅. **DataTable, form tabs, ribbon: tidak ada keyboard nav spec.** |
| `user-scalable=no` dilarang | ✅ | spec-06 | Eksplisit dengan alasan "accessibility requirement" |

**Gap kritis:**

> ❌ **Keyboard navigation untuk DataTable tidak terdefinisi.** Tidak ada spec apakah:
> - Tab key harus navigate antar cell/row
> - Space/Enter untuk select checkbox
> - Arrow keys untuk row navigation
>
> ❌ **Focus ring untuk button dan tab items tidak ada spec visual.** Browser default focus ring akan digunakan, yang mungkin tidak konsisten dengan design system.

---

## 9. CROSS-DOCUMENT CONSISTENCY

### Kontradiksi Terverifikasi

| # | Deskripsi | Dokumen A | Dokumen B | Severity |
|---|---|---|---|---|
| C-01 | **Fixed Bottom Bar height** | `spec-04`: 60px | `spec-05`, `design-A1`, `design-D3`: 56px | 🔴 Kritis |
| C-02 | **HTTP error code untuk wrong credentials** | `design-B`: 422 (field highlight + toast) | `spec-17`: 401 (toast saja) | 🟡 Medium |
| C-03 | **Login schema `remember_me` field** | `design-B`: `z.boolean().default(false)` ada di schema | `spec-17`: schema tanpa `remember_me` | 🟡 Medium |
| C-04 | **Session dialog dismiss behavior** | `design-B`: Dialog tidak bisa di-dismiss (Esc/backdrop) | `spec-17`: perilaku ini tidak disebutkan sama sekali | 🟡 Medium |

### Tidak Konsisten tapi Bukan Kontradiksi

| # | Deskripsi | Catatan |
|---|---|---|
| A-01 | Dashboard tidak punya Ribbon | `design-H1` + `spec-20`: jelas tidak ada ribbon. `spec-05` hanya menyebut "ribbon tampil di list view / hidden di form view" tanpa menyebut dashboard sebagai exception. |
| A-02 | Z-index Dialog/Modal | `VoidConfirmDialog` (design-E3) tidak mendefinisikan z-index. Shadcn Dialog default mungkin tidak match dengan z-stack yang sudah didefinisikan. |
| A-03 | `Batal` button di Bottom Bar | `design-D3` menjelaskan Batal button secara detail. `spec-10` button visibility matrix tidak menyebut Batal button sama sekali. |

---

## 10. MISSING DESIGN DOCUMENTS

### Komponen di spec-07 Tanpa Design Doc

| Komponen | Ada di spec-07 | Design Doc | Status |
|---|---|---|---|
| `WorkspaceLayout.tsx` | ✅ | ❌ Tidak ada | Tidak ada design doc — hanya ada spec behavior di spec-05 |
| `FormLayout.tsx` | ✅ | ⚠️ Parsial | design-D1 cover form *content* tapi bukan *layout wrapper* itu sendiri |
| `DocumentStatusBadge.tsx` | ✅ | ❌ Tidak ada | Warna ada di spec-04, tapi tidak ada spec ukuran badge, padding, border-radius |
| `SystemGeneratedBadge.tsx` | ✅ | ❌ Tidak ada | Hanya ada "Render: 🔧 System Generated" di spec-07 |
| `TablePagination.tsx` | ✅ | ⚠️ Parsial | Tercakup dalam design-C1, tidak ada dedicated doc |
| `BulkActionBar.tsx` | ✅ | ⚠️ Parsial | Tercakup dalam design-C1, tidak ada dedicated doc |
| `FormSection.tsx` | ✅ | ⚠️ Parsial | Tercakup dalam design-D1, tidak ada dedicated doc |

### Modul/Halaman Tanpa Design Doc Sama Sekali

| Modul | Ada spec- | Ada design- | Gap |
|---|---|---|---|
| Settings Module | `spec-19` ✅ | ❌ Tidak ada `design-G-` | Tidak ada visual spec sama sekali |
| Reports Module | `spec-16` ✅ | ❌ Tidak ada `design-I-` | Report filter page, print preview renderer, preset analysis — semua tanpa visual spec |
| Error Pages | `spec-21` ✅ | ❌ Tidak ada `design-` | Hanya ada inline spec di spec-21 |
| Mobile Navigation (<768px) | `spec-06` ✅ (disebutkan) | ❌ Tidak ada | "Bottom navigation" disebutkan tapi tidak pernah didesain |

### Design Docs yang Direferensikan AGENTS.md tapi Tidak Ada

Semua 15 design docs yang ada di filesystem sudah sesuai dengan AGENTS.md §5.
Tidak ada "dangling reference" — semua file yang disebut di AGENTS.md ada di disk.

---

## 11. TEMUAN TAMBAHAN

### Tailwind Config — Status Colors Format

`spec-04` mendefinisikan Tailwind config dengan status colors dalam nested object:
```typescript
status: {
  draft: { bg: '#F1F5F9', text: '#475569' },
```
Tailwind tidak support nilai object seperti ini secara native tanpa plugin. Di bawahnya `spec-04` juga mendefinisikan CSS class `.status-draft { @apply bg-[#F1F5F9] text-[#475569]; }` — format ini yang benar dan bisa dipakai. Ada inkonsistensi antara Tailwind config yang ditulis dan implementasi CSS yang dimaksud. Developer yang mengikuti config tersebut secara literal akan menghasilkan class yang tidak berfungsi (`text-status-draft-text` tidak akan ada).

### Print & Export — Tidak Ada Visual Design Spec

`spec-21` mendefinisikan CSS `@media print` dalam code, tapi tidak ada visual design spec bagaimana dokumen terlihat saat dicetak. Desainer dan developer harus menebak layout print untuk Invoice, PO, dll.

### Onboarding Step 2 — Preview COA Panel

`design-F1` menyebut "Klik card → expand panel accordion di bawah grid" untuk preview COA tree. Detail panel ini sangat minim: hanya "tree 2 level, max-height 200px, overflow scroll". Tidak ada spec border, background, padding, atau bagaimana tree akun dirender secara visual.

### Session Warning Dialog Countdown

`design-B` mendefinisikan countdown "36px, font-weight 700, tabular-nums" dalam format "MM:SS". Tapi tidak ada spec untuk bagaimana progress visualized (progress bar? color change saat mendekati 0?). `spec-17` tidak menyebut countdown sama sekali.

---

## PRIORITAS PERBAIKAN

| Prioritas | Item | Action yang Disarankan |
|---|---|---|
| 🔴 P0 — Kritis | C-01: Bottom bar height 56 vs 60px | Tetapkan satu nilai, update `spec-04` (kemungkinan besar 56px yang benar) |
| 🔴 P0 — Kritis | Focus ring untuk button/tab/link | Definisikan global focus style di `spec-04` atau `spec-06` |
| 🟡 P1 — Medium | C-02: HTTP error code credentials | Klarifikasi 401 vs 422 di `spec-17`, sinkronkan dengan `design-B` |
| 🟡 P1 — Medium | C-03: Login schema `remember_me` | Sinkronkan `design-B` dan `spec-17` |
| 🟡 P1 — Medium | C-04: Session dialog dismiss behavior | Tambahkan ke `spec-17` |
| 🟡 P1 — Medium | `DocumentStatusBadge` tanpa design doc | Buat spec ukuran badge: height, padding, border-radius untuk sm vs md |
| 🟡 P1 — Medium | Keyboard nav DataTable tidak ada | Tambahkan spec keyboard navigation ke `design-C1` atau `spec-09` |
| 🟡 P1 — Medium | `z-45` non-standard Tailwind class | Ganti dengan `[45]` atau tambahkan ke Tailwind config |
| 🟢 P2 — Nice to have | Settings module tanpa design doc | Buat `design-G-settings.md` |
| 🟢 P2 — Nice to have | Reports module tanpa design doc | Buat `design-I-reports.md` untuk filter page + print preview |
| 🟢 P2 — Nice to have | BulkActionBar animation duration | Tambahkan durasi eksplisit ke `design-C1` |
| 🟢 P2 — Nice to have | Tab transition animation | Tentukan apakah instant atau ada transition, dokumentasikan di `design-A1` |
| 🟢 P2 — Nice to have | Mobile bottom navigation | Buat design doc atau hapus referensi dari `spec-06` |
| 🟢 P2 — Nice to have | Dialog z-index | Tambahkan ke z-index stack di `design-A1` |
| 🟢 P2 — Nice to have | Tailwind config status colors | Perbaiki format di `spec-04` (hapus nested object, gunakan CSS class saja) |
