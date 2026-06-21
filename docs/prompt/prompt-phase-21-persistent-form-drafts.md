# Prompt — Phase 21: Persistent Form Drafts

**Phase**: 21  
**Referensi**: `spec-36-audit-12-ux-workflow-fixes.md`, `issue-20-persistent-form-draft.md`  
**Guardrails wajib**: `prompt-guardrails-audit-12-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-12-implementation.md
docs/issue_docs/issue-20-persistent-form-draft.md
docs/praproduction_docs/spec-08-form-architecture.md
docs/praproduction_docs/spec-10-document-workflow.md
src/stores/useTabStore.ts
src/modules/**/pages/*FormPage.tsx
```

---

## 1. Tugas

1. Buat hook `usePersistentFormDraft`.
2. Gunakan `useWatch` + debounce.
3. Key draft harus menyertakan company id, route/module, dan document id/new.
4. Terapkan bertahap ke form transaksi prioritas.
5. Clear draft saat save/post/void/discard sukses.
6. Support line items di luar RHF bila ada.

---

## 2. Verification

```bash
npm run build
```

Manual:

- Isi form baru, pindah tab, kembali: draft tetap ada.
- Refresh browser: draft tetap bisa restore.
- Save sukses membersihkan draft.
