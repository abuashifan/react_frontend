# GAP-09 — Audit-12 UX, Workflow, Filter, Tabs, Reports

Tanggal: 2026-06-16  
Source: `../audit_docs/audit-12-frontend-ux-workflow-audit-16-06-26.md`  
Status: Phase 18-21 dan 23 sudah dieksekusi, sisa phase 22 menunggu

---

## 1. Ringkasan

Audit-12 menemukan gap UX dan workflow yang tersisa setelah Audit-11 contract fixes:

- laporan crash karena shape frontend tidak cocok dengan backend;
- saldo stok tidak menampilkan kode/nama/deskripsi produk dan detail route 404;
- filter checkbox masih single-select dan date range belum merata;
- checkbox row selection dan bulk void belum tersedia di list transaksi;
- draft form hilang saat pindah tab/refresh;
- SearchableSelect belum preload opsi awal/label edit secara konsisten;
- input tanggal edit belum dinormalisasi ke `YYYY-MM-DD`;
- virtual primary tabs belum punya close-all;
- ribbon Aktiva Tetap bisa kosong karena permission/filter runtime;
- edit/view mode dokumen belum punya policy UX global;
- lint full masih gagal karena debt lama.

---

## 2. Issue Mapping

| Audit-12 | Judul | Detail |
|---|---|---|
| A12-12/A12-15 | Reports crash + endpoint fiktif | `issue-16-reports-runtime-contract.md` |
| A12-05/A12-13/A12-14 | Stock balance display/detail/filter mismatch | `issue-17-stock-balance-dto-detail.md` |
| A12-01/A12-02 | Multi-select filter + date range transaction list | `issue-18-transaction-list-filters.md` |
| A12-06/A12-07 | Row selection + bulk void workflow | `issue-19-datatable-selection-bulk-void.md` |
| A12-08 | Persistent unsaved form draft | `issue-20-persistent-form-draft.md` |
| A12-09 | SearchableSelect preload/search/selected labels | `issue-21-searchable-select-preload.md` |
| A12-11 | Date input normalization | `issue-22-date-input-normalization.md` |
| A12-03 | Close all primary tabs | `issue-23-primary-tab-close-all.md` |
| A12-04 | Fixed assets ribbon empty diagnostic | `issue-24-fixed-assets-ribbon-empty.md` |
| A12-10 | Edit/view mode policy | `issue-25-document-edit-mode-policy.md` |
| A12-16 | Lint debt cleanup | `issue-26-lint-debt-cleanup.md` |

---

## 3. Spec dan Prompt

Canonical spec:

```text
docs/praproduction_docs/spec-36-audit-12-ux-workflow-fixes.md
```

Guardrails:

```text
docs/prompt/prompt-guardrails-audit-12-implementation.md
```

Prompt eksekusi:

| Phase | Fokus | Prompt |
|---|---|---|
| 18 | Reports contract hardening | `prompt-phase-18-reports-contract-hardening.md` |
| 19 | Stock balance DTO/detail | `prompt-phase-19-stock-balance-contract-fixes.md` |
| 20 | Filter + table selection + bulk void policy | `prompt-phase-20-filter-and-table-bulk-workflow.md` |
| 21 | Persistent form drafts | `prompt-phase-21-persistent-form-drafts.md` |
| 22 | SearchableSelect + date normalization + edit mode | `prompt-phase-22-select-date-edit-mode-ux.md` |
| 23 | Close-all tabs + fixed-assets ribbon diagnostic + lint cleanup | `prompt-phase-23-tabs-ribbon-lint-cleanup.md` |

---

## 4. Urutan Implementasi

1. Phase 18 — laporan tidak boleh crash; hide endpoint export/transaction yang belum ada.
2. Phase 19 — stock balance list/detail harus menampilkan product canonical dan tidak memakai route fiktif.
3. Phase 20 — filter multi-select/date range dan row selection/bulk void dibuat dengan policy jelas.
4. Phase 21 — draft form tersimpan saat pindah tab/refresh dan clear saat save/discard.
5. Phase 22 — async select lebih mudah dipakai, label edit tidak hilang, input date selalu `YYYY-MM-DD`, mode edit/view konsisten.
6. Phase 23 — close all primary tabs, diagnostic ribbon kosong, lint cleanup bertahap.

---

## 5. Acceptance Global

- `npm run build` harus pass setelah tiap phase.
- Jangan menambah endpoint fiktif baru.
- Jangan mengirim filter backend yang belum didukung tanpa fallback/label jelas.
- Jangan menyimpan server data di Zustand; draft form boleh di storage khusus/hook.
- Jangan edit `src/components/ui/`.
- Jangan modifikasi backend dari task frontend.
- Jika file source baru dibuat, update `docs/struktur_frontend.md`.
