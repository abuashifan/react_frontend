# Prompt — Phase 23: Tabs, Ribbon Diagnostic, and Lint Cleanup

**Phase**: 23  
**Referensi**: `spec-36-audit-12-ux-workflow-fixes.md`, issue-23, issue-24, issue-26  
**Guardrails wajib**: `prompt-guardrails-audit-12-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-12-implementation.md
docs/issue_docs/issue-23-primary-tab-close-all.md
docs/issue_docs/issue-24-fixed-assets-ribbon-empty.md
docs/issue_docs/issue-26-lint-debt-cleanup.md
src/stores/useTabStore.ts
src/components/shared/layout/PrimaryTabs.tsx
src/components/shared/layout/RibbonPanel.tsx
src/router/moduleConfig.ts
```

---

## 1. Tugas

1. Tambah `closeAllPrimaryTabs()` di tab store.
2. Tambah icon button close all dengan tooltip di PrimaryTabs.
3. Tambah empty diagnostic saat ribbon aktif tetapi semua item tersaring permission.
4. Jalankan lint dan cleanup error bertahap:
   - route Fast Refresh;
   - set-state-in-effect;
   - unused vars;
   - RHF watch warning yang mudah diselesaikan.

---

## 2. Verification

```bash
npm run build
npm run lint
```

Jika lint belum 0 karena debt besar, catat kategori sisa di AGENTS.md section 6C/6D.
