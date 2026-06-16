# 01 — Project Context & Goals

## Tentang Produk

**Seaside Escape ERP** adalah aplikasi ERP berbasis web yang dibangun sebagai produk SaaS untuk dipasarkan ke segmen UKM hingga mid-market Indonesia. Dimulai dari vertikal **agen gas**, dengan roadmap menjadi ekosistem bisnis penuh seperti Odoo — mencakup portal pegawai, pengajuan anggaran, sistem akuntansi, dan modul industri lain (distribusi, lembaga pendidikan, dll.).

---

## Arsitektur Sistem

```
┌─────────────────────┐         ┌─────────────────────┐
│   Frontend (SPA)    │  HTTP   │   Backend (Laravel)  │
│   React 18 + Vite   │ ──────► │   API Only           │
│   Port: 5173        │         │   Laravel Sanctum    │
└─────────────────────┘         └─────────────────────┘
```

- Frontend adalah **SPA standalone** — tidak ada coupling dengan Laravel selain HTTP
- Autentikasi via **Bearer token** (Laravel Sanctum)
- Setiap request bisnis wajib menyertakan **X-Company-ID header**
- Base URL API: `{VITE_API_BASE_URL}/api/v1`

---

## Target Pengguna

| Role | Deskripsi |
|---|---|
| Data Entry | Input transaksi harian (invoice, receipt, dll.) |
| Supervisor/Approver | Review dan approve dokumen |
| Accountant/Finance | Post dokumen, lihat laporan, closing periode |
| Admin/Owner | Akses penuh, setting perusahaan |

---

## Target Device

- **Minimum**: iPad mini 6 (768px width)
- **Primary**: Tablet landscape + desktop (1024px - 1440px)
- **Mobile** (< 768px): Didukung dengan layout single column, bukan prioritas utama

---

## Modul yang Dibangun

### Fase 1 (Core ERP)
- **Master Data**: COA, Kontak, Produk, Satuan, Gudang, Payment Terms, Departemen, Proyek, Account Mapping
- **Penjualan**: Quotation → Sales Order → Delivery Order → Invoice → Receipt → Return
- **Pembelian**: Purchase Request → Purchase Order → Goods Receipt → Bill → Payment → Return
- **Persediaan**: Stock Balance, Stock Movement, Stock Adjustment, Stock Opname
- **Akuntansi**: Manual Journal, Fiscal Year, Period Lock
- **Kas & Bank**: Cash Receipt, Cash Payment, Bank Transfer, Bank Reconciliation
- **Laporan**: General Ledger, Trial Balance, P&L, Balance Sheet, Cash Flow, AR/AP Aging

### Fase 2+ (Roadmap)
- Portal Pegawai
- Pengajuan Anggaran
- Aktiva Tetap (Fixed Assets)
- Manufaktur
- Multi-industri (Pendidikan, Hospitality, dll.)

---

## Setting Perusahaan yang Mempengaruhi UI

### Auto-post Setting
Pengaturan ini mengubah workflow dokumen secara fundamental:

```
Auto-post ENABLED:
  create → posted → void
  (draft & approved di-skip)

Auto-post DISABLED:
  create → draft → approved → posted → void
```

UI agent WAJIB membaca setting ini dari auth/company store sebelum render:
- Button visibility di form
- Filter status dokumen di sidebar (hanya muncul jika auto-post DISABLED)
- Edit mode rules

### Approval Setting per Dokumen
Beberapa dokumen mungkin punya setting approval tersendiri. Selalu cek dari company context.

---

## Referensi Backend

Semua endpoint, request/response format, dan permission ada di:
- `docs/backend/frontend-api-contract.md` — **Wajib dibaca sebelum buat API call**
- `docs/backend/02-api-route-map.md` — Route map detail
- `docs/backend/04-sales-workflow-audit.md` — Sales workflow & business rules
- `docs/backend/05-purchase-workflow-audit.md` — Purchase workflow
- `docs/backend/06-inventory-workflow-audit.md` — Inventory workflow
- `docs/backend/07-accounting-and-reporting-audit.md` — Accounting workflow
- `docs/backend/08-business-rules-and-validation-map.md` — Validasi & business rules

---

## Prinsip Produk

1. **Familiar untuk accountant** — UI tidak boleh membuat user harus belajar ulang dari nol
2. **Clean tapi tidak kosong** — Notion-like whitespace, tapi tetap information-dense
3. **Consistent above all** — Lebih baik sederhana dan konsisten daripada canggih tapi tidak konsisten
4. **Error harus jelas** — Setiap error harus menjelaskan apa yang salah dan cara memperbaikinya
5. **Permission-aware** — UI hanya menampilkan aksi yang memang boleh dilakukan user
