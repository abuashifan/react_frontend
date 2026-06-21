# D4 — FormSummary

> Panel total di kanan bawah form transaksi.
> Selalu right-aligned, tabular-nums.

---

## Anatomi

```
                        ┌──────────────────────────────┐
                        │  Subtotal          2.500.000 │
                        │  Diskon (5%)        -125.000 │
                        │  DPP               2.375.000 │
                        │  Pajak PPN 11%       261.250 │
                        │  ─────────────────────────── │
                        │  Grand Total       2.636.250 │
                        │                              │
                        │  Dibayar           1.000.000 │
                        │  Sisa              1.636.250 │
                        └──────────────────────────────┘
```

---

## Spesifikasi Container

```
display       : flex justify-end
padding       : 12px 0 0
margin-top    : 0 (langsung di bawah LineItemsTable)

Inner table:
  min-width   : 280px
  max-width   : 360px
```

---

## Row Standar

```
display       : flex justify-between
padding       : 3px 0
font          : 13px

Label (kiri)  : color #64748b
Nilai (kanan) : color #24323a, tabular-nums, text-right
```

---

## Garis Pemisah

```
Tampil di atas Grand Total
border-top    : 1px solid #d9e2e5
padding-top   : 8px
margin-top    : 4px
```

---

## Grand Total Row

```
font          : 15px, font-weight 700
color         : #24323a
padding-top   : 8px
```

---

## Dibayar / Sisa (Opsional)

```
Tampil hanya pada: Sales Invoice, Vendor Bill (jika sudah ada payment)

Dibayar:
  label       : "Dibayar"
  color nilai : #065F46 (hijau posted)

Sisa:
  label       : "Sisa"
  color nilai : jika > 0 → #991B1B (merah) | jika 0 → #065F46

Gap dari Grand Total: margin-top 8px, border-top 1px solid #f1f5f9
```

---

## Row Visibility

```
Subtotal      : selalu tampil
Diskon        : tampil jika ada diskon > 0
DPP           : tampil jika ada pajak (dasar pengenaan pajak)
Pajak         : tampil jika ada pajak
Grand Total   : selalu tampil
Dibayar       : tampil jika dokumen sudah punya payment
Sisa          : tampil jika ada paid_amount
```
