# Prompt — Phase 19: Stock Balance Contract Fixes

**Phase**: 19  
**Referensi**: `spec-36-audit-12-ux-workflow-fixes.md`, `issue-17-stock-balance-dto-detail.md`  
**Guardrails wajib**: `prompt-guardrails-audit-12-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-12-implementation.md
docs/issue_docs/issue-17-stock-balance-dto-detail.md
src/modules/inventory/services/stockBalanceApi.ts
src/modules/inventory/types/stockBalance.types.ts
src/modules/inventory/pages/StockBalanceListPage.tsx
src/modules/inventory/pages/StockBalanceDetailPage.tsx
src/modules/inventory/routes.tsx
```

---

## 1. Tugas

1. Verifikasi route backend stock balance; perbaiki backend bila kontrak atau query stock balance memang salah dan tambahkan feature test.
2. Update type Product relation inventory ke DTO canonical.
3. Tambahkan adapter display product code/name/description.
4. Ganti detail call yang memakai endpoint fiktif.
5. Hapus/disable filter yang backend belum dukung atau ubah menjadi client-side dengan label jelas.

---

## 2. Verification

```bash
npm run build
```

Manual:

- Stock balance list menampilkan kode/nama/deskripsi produk.
- Klik detail tidak 404.
- Filter yang terlihat bekerja sesuai kontrak.
