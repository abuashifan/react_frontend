# Prompt — Phase 15: Transaction Document Number & Journal Display Contract

**Phase**: 15  
**Estimasi**: 1-2 sesi  
**Referensi**: `spec-33-transaction-dto-number-contract.md`, GAP-08, issue-10, issue-12, issue-13  
**Guardrails wajib**: `prompt-guardrails-audit-11-implementation.md`

---

## 0. Baca Dulu

```text
docs/prompt/prompt-guardrails-audit-11-implementation.md
docs/praproduction_docs/spec-33-transaction-dto-number-contract.md
docs/gap_docs/gap-08-transaction-dto-number-contract.md
docs/issue_docs/issue-10-journal-list-totals-and-account-labels.md
docs/issue_docs/issue-12-searchable-select-selected-options-audit.md
docs/issue_docs/issue-13-formatters-null-invalid-guard.md
docs/praproduction_docs/spec-12-api-integration.md
```

---

## 1. Non-Negotiable Guardrails

- Jangan menambah mapping business DTO baru di `http.ts` kecuali sebagai fallback sementara yang documented.
- Jangan ubah Topbar, Ribbon, PrimaryTabs, SecondaryTabs behavior.
- Jangan ubah router/memory router/hidden URL behavior.
- Jangan ubah tab store dari session storage.
- Jangan tampilkan `Rp 0` untuk value yang belum tersedia.

---

## 2. Tugas Utama

### Step 1 — Formatter Guards

Fix shared formatter agar aman untuk:

```text
null
undefined
""
NaN
invalid date
```

Nilai `0` tetap valid.

### Step 2 — Service Adapters per Module

Map backend document number field ke UI `number` di service adapter:

```text
Sales: quotation_number, order_number, delivery_number, proforma_number, invoice_number, receipt_number, return_number, deposit_number
Purchase: request_number, order_number, receipt_number/goods_receipt_number, bill_number, payment_number, return_number, deposit_number
CashBank: receipt_number, payment_number, transfer_number, reconciliation_number
Inventory: adjustment_number, movement_number, opname_number
Accounting: journal_number
```

Jaga `meta` pada paginated response.

### Step 3 — Journal Totals and Labels

- Jika total journal tidak tersedia, tampilkan `-`, bukan `Rp 0`.
- Detail journal harus memberi `selectedOptions` ke account `SearchableSelect`.
- Label akun: `account_code - account_name`.

---

## 3. Verification

Run:

```bash
cd /workspace/frontend
npm run build
```

Manual checks:

- Quotation list shows quotation number.
- Other workspace list numbers are visible where backend sends them.
- Journal list does not show fake `Rp 0`.
- Journal detail account labels are visible.
- No `NaN` / `Invalid Date`.
- Address bar remains root while internal route changes.
