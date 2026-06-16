# Tracking: Workspace Document Number Alias Fix

Tanggal: 2026-06-16
Area: HTTP response normalization, workspace list tables, document forms
Status: Implemented, build passed

## Masalah

Banyak workspace list tidak menampilkan nomor dokumen pada kolom `Nomor`.

Contoh yang terlihat:

- Jurnal Umum tampil karena frontend membaca `journal_number` langsung.
- Quotation kosong karena frontend membaca `number`, sementara backend mengirim `quotation_number`.

Masalah ini tidak hanya terjadi di Quotation. Banyak tipe frontend memakai field umum:

```ts
number: string
```

Tetapi backend Laravel mengirim field spesifik per dokumen, misalnya:

- `quotation_number`
- `order_number`
- `invoice_number`
- `delivery_number`
- `proforma_number`
- `receipt_number`
- `payment_number`
- `return_number`
- `request_number`
- `bill_number`
- `deposit_number`
- `transfer_number`
- `reconciliation_number`
- `adjustment_number`
- `movement_number`
- `opname_number`

Akibatnya `original.number` di banyak `DataTable` kosong.

## Keputusan Perbaikan

Perbaikan dilakukan di lapisan HTTP response normalizer, bukan patch manual di setiap page.

Alasan:

- Banyak workspace list dan form sudah menggunakan kontrak frontend `number`.
- Patch per halaman berisiko tidak lengkap dan membuat pola makin terpecah.
- Normalisasi di `http.ts` membuat semua response list/detail konsisten tanpa membuat komponen tabel baru.

## File Diubah

- `src/services/http.ts`

## Implementasi

Ditambahkan normalisasi alias nomor dokumen:

- Response object dan array diproses rekursif.
- Jika object belum punya `number`, normalizer mencari field nomor dokumen spesifik backend.
- Jika ditemukan, normalizer menambahkan alias:

```ts
{
  quotation_number: 'SQ-2026-000001',
  number: 'SQ-2026-000001'
}
```

Field asli tetap dipertahankan. Alias hanya ditambahkan untuk kompatibilitas frontend.

## Cakupan Dampak

Fix ini berlaku untuk:

- workspace list yang memakai `DataTable` dan `original.number`;
- form layout yang memakai `documentNumber={record?.number}`;
- picker/ledger/report kecil yang membaca `entry.number`, selama response memuat salah satu field nomor backend yang dikenali.

Jurnal Umum tetap aman karena list jurnal memang membaca `journal_number` langsung.

## Verifikasi

Command:

```bash
npm run build
```

Hasil:

- TypeScript build sukses.
- Vite production build sukses.
- Masih ada warning chunk size dari Vite, bukan blocker untuk fix ini.

## Catatan Lanjutan

- Semua workspace list tetap harus memakai reusable `DataTable` dari `src/components/shared/table/DataTable.tsx`.
- Untuk modul baru, pilih salah satu pendekatan secara konsisten:
  - gunakan field backend spesifik di page, atau
  - gunakan alias `number` yang sudah disediakan normalizer.
- Jika suatu modul memakai nama nomor baru dari backend, tambahkan field tersebut ke daftar alias di `src/services/http.ts`.
