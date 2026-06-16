# Gap Completion Tracker

> Dibuat dari `09-risk-gap-and-improvement-backlog.md`.
> Update status setiap kali gap diselesaikan.
> Format status: `todo` | `in-progress` | `done` | `deferred`

---

## Cara Update

Setiap kali menyelesaikan satu gap:
1. Ubah `Status` menjadi `done`
2. Isi kolom `PR / Commit` dengan nomor PR atau commit hash
3. Isi kolom `Selesai` dengan tanggal

---

## HIGH — 7 Item

| Kode | Judul | Status | Kompleksitas | PR / Commit | Selesai |
|---|---|---|---|---|---|
| H1 | System journal tidak selalu lewat centralized validator | todo | Medium | — | — |
| H2 | Foreign-like reference operasional banyak tanpa FK DB | todo | Large | — | — |
| H3 | Mixed stock adjustment gagal karena duplicate source movement | todo | Medium | — | — |
| H4 | Mixed stock opname gagal karena duplicate source movement | todo | Medium | — | — |
| H5 | Generic stock movement void/reversal journal path perlu verifikasi | todo | Medium | — | — |
| H6 | Direct Vendor Bill stock receipt butuh rekonsiliasi ketat | todo | Medium | — | — |
| H7 | Period lock bulanan belum menjadi blocker | todo | Small | — | — |

---

## MEDIUM — 10 Item

| Kode | Judul | Status | Kompleksitas | PR / Commit | Selesai |
|---|---|---|---|---|---|
| M1 | Config movement transfer tidak sinkron dengan validator | todo | Small | — | — |
| M2 | Mapping optional di config tetapi required runtime | todo | Small | — | — |
| M3 | Opening stock service khusus tidak ditemukan | todo | Medium | — | — |
| M4 | Source type tidak sepenuhnya tersentralisasi | todo | Medium | — | — |
| M5 | Stock movement duplicate source belum DB-level | todo | Medium | — | — |
| M6 | Return paid bill diblokir tanpa vendor credit workflow | todo | Large | — | — |
| M7 | Sales delivery-only return perlu test detail | todo | Small | — | — |
| M8 | Invoice/bill status setelah kombinasi payment, deposit, return | todo | Medium | — | — |
| M9 | Account mapping opening stock punya dua key mirip | todo | Small | — | — |
| M10 | Reconciliation report berada pada dirty working tree | todo | Small | — | — |

---

## LOW — 5 Item

| Kode | Judul | Status | Keterangan |
|---|---|---|---|
| L1 | Tidak ditemukan policy model-level | todo | Pertimbangkan jika butuh object-level ownership |
| L2 | Soft delete tidak dipakai pada model utama | todo | Dokumentasikan rule no-delete untuk dokumen posted |
| L3 | Route map tidak diverifikasi dengan artisan route:list | todo | Jalankan `php artisan route:list` dan bandingkan |
| L4 | Banyak status string bebas | todo | Migrasi bertahap ke enum/constant |
| L5 | Error message campuran Indonesia/English | todo | Standarisasi untuk API response |

---

## ENHANCEMENT — 5 Item

| Kode | Judul | Status | Keterangan |
|---|---|---|---|
| E1 | Preflight account mapping health check | todo | Endpoint cek semua mapping required/conditional |
| E2 | Transaction consistency dashboard | todo | Mismatch stock vs GL, AR/AP vs GL, GRNI aging |
| E3 | Document lifecycle matrix tests | todo | Test parametrik per dokumen lifecycle |
| E4 | Import validator | todo | Pakai BusinessReferenceValidator + source duplicate |
| E5 | Centralized source document registry | todo | Registry source_type/module/lifecycle |

---

## Urutan Implementasi yang Disarankan

Berdasarkan `10-ai-agent-context.md` — Recommended Next Implementation Order:

```
Sprint 1 — Testing dulu, jangan ubah behavior
  ├─ H3: Test mixed adjustment (reproduce bug)
  ├─ H4: Test mixed opname (reproduce bug)
  ├─ H5: Test stock movement direct post+void, cek GL
  ├─ H6: Test direct vendor bill stock reconciliation
  └─ M8: Test matrix invoice/receipt/return balance

Sprint 2 — Fix bugs yang sudah direproduksi
  ├─ H3 fix: Izinkan same source dengan movement type berbeda
  ├─ H4 fix: Sama seperti H3
  └─ H5 fix: Pastikan original journal tidak double reportable

Sprint 3 — Centralisasi dan alignment
  ├─ H1: Buat SystemJournalBuilder + assertion balanced
  ├─ M2: Preflight validation account mapping conditional
  ├─ M9: Tetapkan satu key canonical untuk opening stock
  └─ M1: Hapus transfer dari config atau implement service-nya

Sprint 4 — Database dan infrastructure
  ├─ H7: Integrate monthly period lock ke isDateReadOnly
  ├─ M4: Enum/constant untuk source_type
  ├─ M5: Partial uniqueness untuk stock movement source
  └─ H2: Audit data existing, tambah FK bertahap

Sprint 5 — Enhancement
  ├─ E1: Preflight account mapping endpoint
  ├─ E3: Document lifecycle matrix tests
  └─ M3: Opening stock service dengan guard once-per-product-warehouse
```

---

## Progress Summary

```
Total gap    : 27
Done         : 0
In Progress  : 0
Todo         : 27
Deferred     : 0

High done    : 0 / 7
Medium done  : 0 / 10
Low done     : 0 / 5
Enhancement  : 0 / 5
```

> Update section ini setiap sprint review.
