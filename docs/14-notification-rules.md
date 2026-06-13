# 14 — Notification & Feedback Rules

## Prinsip

- **Toast only** — semua feedback ke user via toast notification
- Tidak ada inline alert, tidak ada modal error
- Toast harus **spesifik** — jelaskan apa yang terjadi, bukan generic "Error occurred"
- Error dari backend harus ditranslate ke bahasa yang user mengerti

---

## Toast Specs

```
Posisi    : pojok kanan bawah
Max stack : 3 toast sekaligus (toast tertua hilang dulu)
Z-index   : di atas semua elemen termasuk fixed bottom bar

Durasi auto-dismiss:
  success  : 3000ms
  error    : 5000ms  (lebih lama — perlu dibaca)
  warning  : 4000ms
  info     : 3000ms

User bisa dismiss manual dengan klik tombol ×
```

---

## Toast Types & Styling

```typescript
// Menggunakan Shadcn/ui Toast component

interface ToastOptions {
  title?: string
  description?: string
  duration?: number
}

// Success — hijau
toast.success('Invoice berhasil diposting.')

// Error — merah
toast.error('Gagal menyimpan. Customer wajib dipilih.')

// Warning — amber
toast.warning('Periode akuntansi akan berakhir dalam 3 hari.')

// Info — teal (menggunakan warna accent #5c9ead)
toast.info('Data berhasil disinkronkan.')
```

---

## Pesan Toast per Aksi

### Create / Save

```typescript
// Success
toast.success('Invoice berhasil dibuat.')
toast.success('Draft berhasil disimpan.')

// Error
toast.error('Gagal membuat invoice. Customer wajib dipilih.')
toast.error(`Gagal menyimpan: ${validationMessages}`)
```

### Workflow Actions

```typescript
// Approve
toast.success('Dokumen berhasil di-approve.')
toast.error('Gagal approve. Dokumen tidak dalam status yang valid.')

// Post
toast.success('Invoice berhasil diposting. Journal akuntansi telah dibuat.')
toast.error('Gagal posting. Periode akuntansi sudah ditutup.')
toast.error('Gagal posting. Account mapping belum dikonfigurasi.')

// Reject
toast.success('Dokumen berhasil ditolak dan dikembalikan ke draft.')

// Void
toast.success('Dokumen berhasil di-void.')
toast.error('Gagal void. Dokumen memiliki transaksi terkait yang masih aktif.')
toast.error('Invoice tidak dapat di-void karena sudah ada pembayaran tercatat.')

// Deliver
toast.success('Pengiriman berhasil. Stock movement keluar telah dibuat.')

// Receive
toast.success('Penerimaan barang berhasil. Stock movement masuk telah dibuat.')
```

### Delete / Bulk Actions

```typescript
// Bulk void success
toast.success(`${count} dokumen berhasil di-void.`)

// Partial success
toast.warning(`${success} dokumen berhasil di-void. ${failed} dokumen gagal.`)
```

---

## Error Message Mapping

### HTTP Status

```typescript
// 401 — Auto redirect, tidak perlu toast (handle di interceptor)

// 403
toast.error('Anda tidak memiliki akses untuk melakukan aksi ini.')

// 404
toast.error('Data tidak ditemukan.')

// 409 Conflict — pakai message dari backend
toast.error(error.message)
// Contoh dari backend: "Invoice tidak dapat diposting dari status yang saat ini."

// 422 Validation — format semua error
function formatValidationErrors(errors: Record<string, string[]>): string {
  return Object.values(errors).flat().join('. ')
}
toast.error(`Gagal menyimpan: ${formatValidationErrors(error.errors)}`)

// Network error
toast.error('Tidak dapat terhubung ke server. Periksa koneksi internet Anda.')

// Timeout
toast.error('Permintaan membutuhkan waktu terlalu lama. Coba lagi.')

// Unknown
toast.error('Terjadi kesalahan. Silakan coba lagi atau hubungi administrator.')
```

### Domain-specific Errors

```typescript
// Period/fiscal year locked
toast.error('Tidak dapat memposting. Periode akuntansi sudah dikunci.')

// Account mapping missing
toast.error('Konfigurasi akun belum lengkap. Hubungi administrator.')

// Insufficient stock
toast.error('Stok tidak mencukupi. Periksa saldo stok sebelum melanjutkan.')

// Over-invoice
toast.error('Jumlah melebihi sisa yang belum diinvoice.')

// Overpayment
toast.error('Jumlah pembayaran melebihi sisa tagihan.')
```

---

## Confirmation Dialog Rules

Beberapa aksi memerlukan konfirmasi sebelum dijalankan. Ini berbeda dari toast — konfirmasi muncul **sebelum** aksi, bukan sesudah.

### Aksi yang WAJIB ada konfirmasi dialog

| Aksi | Alasan |
|---|---|
| Void dokumen | Irreversible, cascade ke journal/stock |
| Post invoice/bill | Membuat journal akuntansi |
| Deliver (Delivery Order) | Membuat stock movement keluar |
| Receive (Goods Receipt) | Membuat stock movement masuk + GRNI journal |
| Close fiscal year | Tidak bisa dibuka tanpa reopen |
| Bulk void | Multiple documents sekaligus |

### Void Confirmation Dialog

```tsx
// VoidConfirmDialog.tsx
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle className="text-[#991B1B] flex items-center gap-2">
        <AlertTriangle className="w-5 h-5" />
        Void Dokumen
      </DialogTitle>
      <DialogDescription>
        Anda akan mem-void <strong>{documentNumber}</strong>.
        Aksi ini akan membatalkan semua journal dan stock movement terkait.
        Aksi ini tidak dapat dibatalkan.
      </DialogDescription>
    </DialogHeader>

    <div className="my-4">
      <label className="text-sm font-medium text-[#24323a] block mb-1.5">
        Alasan void <span className="text-red-500">*</span>
      </label>
      <Textarea
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder="Jelaskan alasan void dokumen ini..."
        className="min-h-[80px]"
        minLength={10}
      />
      {reason.length > 0 && reason.length < 10 && (
        <p className="text-xs text-red-500 mt-1">Alasan minimal 10 karakter</p>
      )}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={onClose} disabled={isLoading}>
        Batal
      </Button>
      <Button
        variant="destructive"
        onClick={() => onConfirm(reason)}
        disabled={reason.length < 10 || isLoading}
      >
        {isLoading ? 'Memproses...' : 'Ya, Void Dokumen'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Post/Deliver/Receive Confirmation Dialog

```tsx
// Lebih singkat — tidak perlu input reason
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Post Invoice?</AlertDialogTitle>
      <AlertDialogDescription>
        Invoice <strong>{documentNumber}</strong> akan diposting.
        Journal akuntansi AR dan revenue akan dibuat secara otomatis.
        Pastikan semua data sudah benar sebelum melanjutkan.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Batal</AlertDialogCancel>
      <AlertDialogAction onClick={onConfirm} className="bg-[#e39774] hover:bg-[#d4845e]">
        Post Invoice
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Loading States

### Button Loading

```tsx
// Saat mutation sedang berjalan
<Button disabled={isLoading}>
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Memproses...
    </>
  ) : (
    'Post Invoice'
  )}
</Button>
```

### Page/Data Loading

```tsx
// Skeleton untuk table rows
// Skeleton untuk form fields
// Spinner kecil di pojok kanan atas untuk refetch (isFetching)
```

---

## Toast Hook

```typescript
// hooks/useToast.ts
// Wrapper di atas Shadcn/ui useToast

import { useToast as useShadcnToast } from '@/components/ui/use-toast'

export function useToast() {
  const { toast } = useShadcnToast()

  return {
    toast: {
      success: (message: string) => toast({
        description: message,
        duration: 3000,
        className: 'bg-[#D1FAE5] text-[#065F46] border-[#A7F3D0]',
      }),
      error: (message: string) => toast({
        description: message,
        duration: 5000,
        variant: 'destructive',
      }),
      warning: (message: string) => toast({
        description: message,
        duration: 4000,
        className: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
      }),
      info: (message: string) => toast({
        description: message,
        duration: 3000,
        className: 'bg-[#EFF9FB] text-[#326273] border-[#5c9ead]',
      }),
    }
  }
}
```
