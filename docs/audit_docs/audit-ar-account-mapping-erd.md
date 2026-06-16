# ERD — AR Account Mapping ke Customer

Dokumen ini menjelaskan desain mapping **Akun Piutang Usaha / Accounts Receivable** pada modul Sales & AR.

Keputusan desain:

```text
Customer → boleh punya AR Account khusus
Product  → punya Revenue Account
Account Mapping → default fallback
Invoice → menyimpan snapshot akun final
Journal → dibuat dari snapshot invoice
```

---

## 1. ERD Mermaid

```mermaid
erDiagram
    CHART_OF_ACCOUNTS ||--o{ ACCOUNT_MAPPINGS : "mapped as default account"
    CHART_OF_ACCOUNTS ||--o{ CONTACTS : "default AR/AP account"
    CHART_OF_ACCOUNTS ||--o{ PRODUCTS : "sales/revenue account"
    CHART_OF_ACCOUNTS ||--o{ SALES_INVOICES : "resolved AR account snapshot"
    CHART_OF_ACCOUNTS ||--o{ SALES_INVOICE_LINES : "resolved revenue account snapshot"
    CHART_OF_ACCOUNTS ||--o{ JOURNAL_ENTRY_LINES : "journal account"

    CONTACTS ||--o{ SALES_INVOICES : "customer"
    PAYMENT_TERMS ||--o{ CONTACTS : "default payment term"
    PAYMENT_TERMS ||--o{ SALES_INVOICES : "invoice payment term"

    SALES_INVOICES ||--o{ SALES_INVOICE_LINES : "invoice lines"
    PRODUCTS ||--o{ SALES_INVOICE_LINES : "sold product"

    SALES_INVOICES ||--o{ SALES_RECEIPTS : "payment for invoice"
    SALES_INVOICES ||--o{ CUSTOMER_DEPOSIT_ALLOCATIONS : "deposit applied"
    SALES_INVOICES ||--o{ SALES_RETURNS : "return or credit"

    SALES_INVOICES ||--o{ JOURNAL_ENTRIES : "posting source"
    JOURNAL_ENTRIES ||--o{ JOURNAL_ENTRY_LINES : "journal lines"

    CHART_OF_ACCOUNTS {
        bigint id PK
        string account_code
        string account_name
        string account_type
        string normal_balance
        boolean is_active
    }

    ACCOUNT_MAPPINGS {
        bigint id PK
        string mapping_key UK
        bigint account_id FK
        string module
        string label
        boolean is_active
    }

    CONTACTS {
        bigint id PK
        string contact_code
        string name
        boolean is_customer
        boolean is_supplier
        bigint payment_term_id FK
        bigint receivable_account_id FK "nullable"
        bigint payable_account_id FK "nullable"
        boolean is_active
    }

    PAYMENT_TERMS {
        bigint id PK
        string code
        string name
        integer days
        boolean is_active
    }

    PRODUCTS {
        bigint id PK
        string product_code
        string product_name
        bigint sales_account_id FK "revenue account"
        bigint inventory_account_id FK "stock item only"
        bigint cogs_account_id FK "later phase"
        boolean is_active
    }

    SALES_INVOICES {
        bigint id PK
        string invoice_number
        date invoice_date
        date due_date
        bigint customer_id FK
        bigint payment_term_id FK
        bigint ar_account_id FK "resolved snapshot"
        decimal subtotal
        decimal tax_total
        decimal grand_total
        decimal paid_amount
        decimal balance_due
        string status
    }

    SALES_INVOICE_LINES {
        bigint id PK
        bigint sales_invoice_id FK
        bigint product_id FK
        bigint revenue_account_id FK "resolved snapshot"
        string description
        decimal quantity
        decimal unit_price
        decimal line_total
    }

    JOURNAL_ENTRIES {
        bigint id PK
        string journal_number
        date journal_date
        string source_type
        bigint source_id
        string status
    }

    JOURNAL_ENTRY_LINES {
        bigint id PK
        bigint journal_entry_id FK
        bigint account_id FK
        decimal debit
        decimal credit
        string description
    }
```

---

## 2. Account Mapping yang Dibutuhkan

```text
ACCOUNT_MAPPINGS
├── sales.accounts_receivable  → Piutang Usaha default
├── sales.sales_revenue        → Pendapatan Penjualan default
├── sales.output_tax           → PPN Keluaran
├── sales.customer_deposit     → Uang Muka Pelanggan
├── sales.sales_discount       → Diskon Penjualan
└── sales.sales_return         → Retur Penjualan
```

---

## 3. Relasi Customer ke AR Account

```text
CONTACTS / CUSTOMER
├── Customer umum
│   └── receivable_account_id = null
│       fallback ke sales.accounts_receivable
│
├── Customer corporate / khusus
│   └── receivable_account_id = akun piutang khusus
│
└── Customer internal
    └── receivable_account_id = akun piutang internal
```

---

## 4. Rule Resolve Akun Piutang

Saat Sales Invoice di-submit/post:

```text
1. Ambil customer dari sales_invoices.customer_id
2. Jika contacts.receivable_account_id ada:
      pakai itu sebagai AR account
3. Jika kosong:
      pakai account_mappings['sales.accounts_receivable']
4. Jika masih kosong:
      fallback legacy account_mappings['accounts_receivable']
5. Jika masih kosong:
      block submit/post
```

Pseudo flow:

```text
resolveARAccount(customer):
    if customer.receivable_account_id is not null:
        return customer.receivable_account_id

    if mapping exists 'sales.accounts_receivable':
        return mapping.account_id

    if mapping exists 'accounts_receivable':
        return mapping.account_id

    throw "Akun Piutang Usaha belum diatur"
```

---

## 5. Jurnal Sales Invoice

Contoh invoice Rp 16.000 tanpa pajak:

```text
Dr Piutang Usaha                      16.000
    Cr Penjualan LPG 3 Kg Demo         16.000
```

Sumber akun:

```text
Dr Piutang Usaha
→ dari contacts.receivable_account_id
→ fallback account_mappings['sales.accounts_receivable']

Cr Penjualan
→ dari products.sales_account_id / sales_invoice_lines.revenue_account_id
→ fallback account_mappings['sales.sales_revenue']
```

Contoh dengan PPN:

```text
Dr Piutang Usaha                      17.760
    Cr Penjualan                       16.000
    Cr PPN Keluaran                     1.760
```

---

## 6. Field Minimal yang Perlu Ditambahkan

### contacts

```text
contacts
├── receivable_account_id nullable FK chart_of_accounts.id
└── payable_account_id nullable FK chart_of_accounts.id
```

`payable_account_id` disiapkan sekalian untuk vendor/AP:

```text
Vendor Bill
Dr Beban/Persediaan
    Cr Hutang Usaha
```

Untuk vendor:

```text
contacts.payable_account_id
fallback purchase.accounts_payable
```

### sales_invoices

```text
sales_invoices
└── ar_account_id nullable FK chart_of_accounts.id
```

### sales_invoice_lines

```text
sales_invoice_lines
└── revenue_account_id nullable FK chart_of_accounts.id
```

---

## 7. Kenapa Invoice Perlu Snapshot Akun

Invoice sebaiknya menyimpan akun final yang dipakai:

```text
sales_invoices.ar_account_id
sales_invoice_lines.revenue_account_id
```

Tujuannya:

```text
[✓] Invoice lama tetap historis
[✓] Perubahan master customer tidak mengubah invoice lama
[✓] Perubahan produk tidak mengubah akun revenue invoice lama
[✓] Jurnal bisa dibuat ulang dari snapshot invoice yang sama
[✓] Audit lebih jelas
```

---

## 8. Kesimpulan Implementasi

```text
[✓] AR account tidak diambil dari Product
[✓] AR account tidak dipilih manual di form invoice untuk MVP
[✓] AR account boleh diset di Customer jika customer khusus
[✓] Jika customer tidak punya AR account, pakai Account Mapping default
[✓] Product hanya menentukan akun pendapatan/revenue
[✓] Invoice menyimpan snapshot akun final
[✓] Journal dibuat dari snapshot invoice
```
