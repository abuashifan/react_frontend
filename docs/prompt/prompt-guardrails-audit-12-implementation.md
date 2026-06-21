# Prompt Guardrails — Audit-12 Implementation

Gunakan file ini sebelum menjalankan prompt phase 18-23.

---

## Baca Dulu

```text
docs/audit_docs/audit-12-frontend-ux-workflow-audit-16-06-26.md
docs/gap_docs/gap-09-audit-12-ux-workflow-fixes.md
docs/praproduction_docs/spec-36-audit-12-ux-workflow-fixes.md
docs/praproduction_docs/spec-23-tablet-first-layout-rules.md
docs/praproduction_docs/spec-09-table-and-list.md
docs/praproduction_docs/spec-13-filter-and-search.md
```

Lalu baca issue detail dan design docs sesuai phase.

---

## Guardrails

- Backend `/workspace/laravel_backend` boleh diubah bila diperlukan untuk kontrak atau business rule; baca backend `AGENTS.md` terlebih dahulu.
- Perubahan backend harus scoped, transaction-safe, tenant-safe, permission-aware, dan disertai feature test relevan.
- Jangan menambah endpoint fiktif.
- Jangan edit `src/components/ui/`.
- Jangan redesign shell, topbar, ribbon, atau virtual tab architecture kecuali phase memang menyentuh tab action.
- Jangan simpan API/server data di Zustand.
- Jangan menampilkan action tanpa permission guard.
- Jangan memakai `h-screen`, `min-h-screen`, atau `100vh` di file baru/ubah.
- Jika tambah file, update `docs/struktur_frontend.md`.
- Jalankan `npm run build` sebelum selesai.
- Jika backend berubah, jalankan test backend tersempit yang relevan dan `vendor/bin/pint --test`.

---

## Dokumentasi Selesai Phase

Setelah phase selesai:

- update status di `AGENTS.md` section 6A/6D;
- update build status section 6C;
- catat gap/issue jika ada keputusan non-final;
- update struktur jika file baru dibuat.
