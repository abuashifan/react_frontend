# Prompt — Phase 38: Cross-Cutting UX, Accessibility, and Consistency

**Phase**: 38  
**Status**: Planned  
**Referensi utama**: `../issue_docs/issue-41-phase-38-cross-cutting-ux-accessibility-consistency.md`  
**Spec canonical**: `../praproduction_docs/spec-37-audit-13-remediation.md`  
**Roadmap canonical**: `../gap_docs/gap-10-audit-13-remediation-roadmap.md`  
**Guardrails wajib**: `../prompt/prompt-guardrails-audit-13-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-13-implementation.md
docs/issue_docs/issue-41-phase-38-cross-cutting-ux-accessibility-consistency.md
docs/praproduction_docs/spec-37-audit-13-remediation.md
docs/gap_docs/gap-10-audit-13-remediation-roadmap.md
src/modules/*
src/components/shared/*
src/lib/*
```

---

## 1. Tujuan Phase

Phase 38 menutup temuan P2/P3 yang tersisa setelah behavior utama stabil: accessibility, semantics, labels, dialog descriptions, viewport polish, copy, dan lint warning pada file yang disentuh.

---

## 2. Non-Negotiable Guardrails

- Jangan melakukan redesign besar.
- Jangan memperkenalkan pattern baru jika shared pattern yang ada cukup.
- Jangan meninggalkan control penting tanpa label/semantics.
- Jangan memproduksi warning baru pada file yang disentuh.

---

## 3. Tugas Utama

### Step 1 - Accessibility and semantics

Audit representative surfaces untuk label/control association, keyboard, focus, dialog semantics, dan copy yang jelas.

### Step 2 - Viewport polish

Pastikan viewport pendek dan mobile tidak memunculkan overflow, button overlap, atau copy yang ambigu.

### Step 3 - Consistency

Rapikan loading/error/empty copy dan warning lint pada file yang disentuh phase sebelumnya.

---

## 4. Verification

Run:

```bash
cd /workspace/frontend
npm run build
npm run lint
```

Manual checks:

- no unlabeled critical control;
- no root overflow pada viewport matrix;
- dialog semantics konsisten;
- lint tidak mendapat warning baru pada file yang disentuh.
