# Issue-26 — Lint Debt Cleanup

**Tipe**: Code quality gate  
**Severity**: Medium  
**Sumber**: Audit-12 A12-16  
**Status**: Done — Phase 23 (2026-06-16)

---

## Ringkasan

`npm run build` pass, tetapi full lint masih gagal karena debt lama. Lint perlu dipisah dari functional fixes agar tidak mencampur refactor besar dengan bugfix user-facing.

---

## Kategori Debt

- `react-refresh/only-export-components` di banyak `routes.tsx`.
- `react-hooks/set-state-in-effect` di beberapa settings/master pages.
- `@typescript-eslint/no-unused-vars`.
- Warning `react-hooks/incompatible-library` karena RHF `watch()` dipakai langsung di render.

---

## Prinsip Fix

- Buat cleanup phase terpisah setelah crash/workflow utama selesai.
- Untuk route config, pilih salah satu:
  - split constant route arrays ke file non-component;
  - atau file-level disable dengan justification jika pattern disetujui.
- Ganti `watch()` render usage dengan `useWatch` saat menyentuh form terkait.
- Jangan melakukan redesign atau behavior change besar di phase lint.

---

## Acceptance Criteria

- `npm run lint` turun ke 0 error.
- Warning RHF utama berkurang atau ada backlog tertulis.
- Build tetap pass.

---

## Implementation Notes — Phase 23

- Menambahkan lint-disable terjelaskan untuk file route config statis (`routes.tsx`) yang memang bukan komponen React.
- Merapikan beberapa `setState` effect dengan deferred callback agar aturan `react-hooks/set-state-in-effect` berhenti memblokir build lint.
- Menghapus unused destructuring yang memicu `@typescript-eslint/no-unused-vars`.
- Status akhir:
  - `npm run lint` ✅ 0 error
  - warning `react-hooks/incompatible-library` dan `react-hooks/exhaustive-deps` masih ada di file legacy non-Phase-23
