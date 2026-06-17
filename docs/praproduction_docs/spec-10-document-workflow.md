# 10 — Document Workflow Rules

> Ini adalah dokumen paling kritis untuk form transaksi.
> WAJIB dibaca sebelum membangun form apapun.

---

## Core Rule

> **Hanya transaksi berstatus `posted` yang bisa menjadi dependence.**
> Draft dan approved TIDAK bisa dijadikan source document untuk transaksi berikutnya.

---

## Auto-post Setting

Baca dari company store:

```typescript
const { settings } = useCompanyStore()
const isAutoPost = settings.auto_post_enabled
```

### Flow berdasarkan setting:

```
Auto-post ENABLED:
  create → posted → void

Auto-post DISABLED:
  create → draft → approved → posted → void
```

---

## Edit Mode Rules — WAJIB DIIKUTI

| Status Dokumen | Edit Mode | Keterangan |
|---|---|---|
| `draft` | ✅ EDITABLE | Selalu bisa diedit |
| `approved` | 🔒 READ-ONLY | Harus reject dulu → buat ulang |
| `posted` (tanpa dependence posted) | 🔒 READ-ONLY | Hanya bisa void |
| `posted` (ada dependence posted) | 🔒 LOCKED | Tidak bisa aksi apapun |
| `void` | 🔒 READ-ONLY PERMANENT | Tidak ada aksi |

```typescript
// useDocumentEditMode.ts
export function useDocumentEditMode(
  status: DocumentStatus,
  hasPostedDependences: boolean
): DocumentEditMode {
  if (status === 'draft') return 'editable'
  if (status === 'void') return 'readonly'
  if (status === 'posted' && hasPostedDependences) return 'locked'
  return 'readonly'
}

type DocumentEditMode = 'editable' | 'readonly' | 'locked'
```

---

## Button Visibility Matrix

### Auto-post ENABLED

| Status | Permission User | Tombol yang Muncul |
|---|---|---|
| Form baru | `create` | `[Post]` |
| `posted` tanpa dep. | `void` | `[Void]` |
| `posted` + dep. posted | any | _(tidak ada tombol)_ |
| `void` | any | _(tidak ada tombol)_ |

### Auto-post DISABLED

| Status | Permission User | Tombol yang Muncul |
|---|---|---|
| Form baru | `create` only | `[Simpan Draft]` |
| Form baru | `create` + `post` | `[Simpan Draft]` `[Post]` |
| `draft` | `approve` only | `[Approve]` |
| `draft` | `post` only | `[Post]` _(auto-approve)_ |
| `draft` | `approve` + `post` | `[Approve]` `[Post]` |
| `approved` | `post` | `[Post]` `[Reject]` |
| `approved` | `reject` only | `[Reject]` |
| `posted` tanpa dep. | `void` | `[Void]` |
| `posted` + dep. posted | any | _(tidak ada tombol)_ |
| `void` | any | _(tidak ada tombol)_ |

---

## Hook: useDocumentActions

```typescript
// hooks/useDocumentActions.ts
export function useDocumentActions(
  document: DocumentBase,
  hasPostedDependences: boolean
) {
  const { permissions } = useAuthStore()
  const { settings } = useCompanyStore()
  const isAutoPost = settings.auto_post_enabled

  const can = (permission: string) => permissions.includes(permission)
  const editMode = useDocumentEditMode(document.status, hasPostedDependences)

  const availableActions = useMemo(() => {
    const actions: ActionButton[] = []
    const isNew = !document.id

    if (isAutoPost) {
      // Auto-post flow
      if (isNew && can(`${module}.create`)) {
        actions.push({ id: 'post', label: 'Post', variant: 'primary' })
      }
      if (document.status === 'posted' && !hasPostedDependences && can(`${module}.void`)) {
        actions.push({ id: 'void', label: 'Void', variant: 'destructive' })
      }
    } else {
      // Manual approval flow
      if (isNew || document.status === 'draft') {
        if (can(`${module}.create`)) {
          actions.push({ id: 'save_draft', label: 'Simpan Draft', variant: 'secondary' })
        }
        if (can(`${module}.post`)) {
          actions.push({ id: 'post', label: 'Post', variant: 'primary' })
        } else if (can(`${module}.approve`)) {
          actions.push({ id: 'approve', label: 'Approve', variant: 'primary' })
        }
      }
      if (document.status === 'approved') {
        if (can(`${module}.post`)) {
          actions.push({ id: 'post', label: 'Post', variant: 'primary' })
        }
        if (can(`${module}.reject`) || can(`${module}.approve`)) {
          actions.push({ id: 'reject', label: 'Reject', variant: 'secondary' })
        }
      }
      if (document.status === 'posted' && !hasPostedDependences && can(`${module}.void`)) {
        actions.push({ id: 'void', label: 'Void', variant: 'destructive' })
      }
    }

    return actions
  }, [document, isAutoPost, permissions, hasPostedDependences])

  return { availableActions, editMode }
}
```

---

## Void Rules

### Void Standard (posted tanpa dependence)

1. Tampilkan `VoidConfirmDialog`
2. User isi reason (wajib, min 10 karakter)
3. Call API `PATCH /{resource}/{id}/void` dengan `{ reason }`
4. Toast success: "Dokumen berhasil di-void"
5. Refresh data

### Void dengan Dependence (LOCKED)

Dokumen tidak bisa di-void langsung. Tampilkan `DocumentLockedBanner`:

```
🔒 Dokumen ini terkunci.
   Void transaksi berikut terlebih dahulu (dari hilir ke hulu):
   
   · RCP-2026-010 (Penerimaan) — Posted     [Lihat →]
   · INV-2026-001 (Invoice Penjualan) — Posted  [Lihat →]
   · DO-2026-005 (Pengiriman) — Posted      [Lihat →]
   
   Setelah semua di-void, dokumen ini dapat di-void.
```

Urutan ditampilkan dari **hilir ke hulu** — user tahu harus mulai dari mana.

### Special Cases — Void Diblokir

| Kondisi | Pesan |
|---|---|
| Invoice status `partially_paid` atau `paid` | "Invoice ini tidak dapat di-void karena sudah ada pembayaran tercatat." |
| Vendor Bill status `paid` | "Tagihan ini tidak dapat di-void karena sudah ada pembayaran tercatat." |

Tombol Void di-disable dengan tooltip pesan tersebut.

---

## Dependence Map

| Dokumen | Terkunci jika ada downstream POSTED |
|---|---|
| Sales Quotation | Sales Order |
| Sales Order | Delivery Order / Invoice / Customer Deposit |
| Delivery Order | Sales Invoice / Sales Return |
| Sales Invoice | Sales Receipt / Sales Return / Deposit Allocation |
| Purchase Request | Purchase Order |
| Purchase Order | Goods Receipt / Vendor Bill / Vendor Deposit |
| Goods Receipt | Vendor Bill / Purchase Return |
| Vendor Bill | Vendor Payment / Purchase Return / Deposit Allocation |

---

## Locked State UI

```tsx
// Ketika editMode === 'locked'
<>
  {/* Banner informatif */}
  <DocumentLockedBanner dependences={sortedDependences} />

  {/* Form tetap tampil tapi semua field read-only */}
  <SalesInvoiceForm isReadOnly={true} />

  {/* Fixed bottom bar TIDAK muncul */}
</>
```

---

## Reject Flow (Auto-post DISABLED)

Ketika atasan reject dokumen `approved`:
1. Call API `PATCH /{resource}/{id}/reject` dengan `{ reason }`
2. Status kembali ke `draft` (atau `rejected` — cek response)
3. User data entry bisa edit ulang dan submit
4. Toast: "Dokumen berhasil ditolak dan dikembalikan ke draft"

---

## System Generated Documents

Dokumen yang dibuat otomatis oleh sistem (jurnal closing, depresiasi, dll.):

- Selalu `READ-ONLY`
- Tampilkan `<SystemGeneratedBadge />`
- Fixed bottom bar **tidak muncul**
- Tidak ada tombol void/edit
- Filter di workspace: tampilkan badge "System" di kolom type

---

## Status Transitions yang Diizinkan API

Dari `frontend-api-contract.md` dan workflow audit — jangan call endpoint yang tidak sesuai:

```
Sales Quotation:  draft → sent → approved → accepted/rejected/cancelled
Sales Order:      draft → approved → confirmed → cancelled/closed
Delivery Order:   draft → ready → shipped → delivered → void/cancelled
Sales Invoice:    draft → approved → posted → void (via receipt/return untuk paid)
Purchase Request: draft → submitted → approved → rejected/cancelled
Purchase Order:   draft → approved → confirmed → cancelled/closed
Goods Receipt:    draft → received → void/cancelled
Vendor Bill:      draft → approved → posted → void
```

---

## Quantity & Amount Tracking (Read-only di Form)

Tampilkan progress tracking di form (informational only, tidak bisa diedit):

```tsx
// Di Sales Order line item
<div className="flex gap-4 text-xs text-[#64748b]">
  <span>Dikirim: {line.delivered_quantity} / {line.quantity}</span>
  <span>Diinvoice: {line.invoiced_quantity} / {line.quantity}</span>
  <span>Retur: {line.returned_quantity}</span>
</div>

// Di Sales Invoice
<div className="flex gap-4 text-sm">
  <span>Total: {formatCurrency(invoice.grand_total)}</span>
  <span className="text-[#065F46]">Dibayar: {formatCurrency(invoice.paid_amount)}</span>
  <span className="text-[#991B1B] font-medium">Sisa: {formatCurrency(invoice.balance_due)}</span>
</div>
```

---

## Edit / Read-Only Mode Policy (Audit-12 A12-10)

Policy konsisten antar modul untuk form dokumen transaksi:

- **Create** → selalu edit mode.
- **Draft** → edit mode (tetap cek permission update sebelum render tombol aksi).
- **Posted / approved / paid / void / cancelled / closed / finalized** → read-only.
- Saat read-only, form **wajib** menampilkan alasan yang jelas (bukan sekadar field disabled).

### Implementasi

- `isEditable` dihitung per form (umumnya `isCreate || status === 'draft'`) karena
  aturan editable spesifik per dokumen mengikuti backend.
- `FormLayout` menerima prop `readOnly` (+ opsional `readOnlyReason`). Saat
  `readOnly` true, FormLayout merender banner read-only di atas konten form.
- Teks alasan default diturunkan dari `status` lewat
  `documentReadOnlyReason(status)` di
  `src/components/shared/document/documentEditPolicy.ts`. Form dengan semantik
  non-draft (mis. Fixed Asset disposed/depreciated) memberikan `readOnlyReason`
  eksplisit.
- Pola adopsi per form: tambahkan `readOnly={!isEditable}` ke `<FormLayout>`
  dokumen (bukan FormLayout state loading).
- Tombol aksi tetap melalui `DocumentActionBar` yang permission-guarded; banner
  locked dependency tetap via `DocumentLockedBanner`.
