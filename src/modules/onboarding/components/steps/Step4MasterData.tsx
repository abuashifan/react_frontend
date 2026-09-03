import { Button } from '@/components/ui/button'
import { MasterDataQuickAdd, type QuickAddItem } from '../MasterDataQuickAdd'
import {
  useGudangList,
  useGudangMutations,
  useSatuanList,
  useSatuanMutations,
  usePaymentTermsList,
  usePaymentTermsMutations,
} from '@/modules/master-data/hooks/useSimpleLists'
import { usePermission } from '@/hooks/usePermission'
import { useToast } from '@/hooks/useToast'

/**
 * Kode singkat dari nama, dipakai untuk entitas yang butuh `code` unik di
 * backend (StoreWarehouseRequest/StorePaymentTermRequest) tapi sengaja tidak
 * ditanyakan ke user di quick-add wizard -- form ini didesain "cukup ketik
 * nama" (lihat spec-18 Step 4), bukan alur input master data penuh yang
 * memang minta kode secara eksplisit (lihat GudangPage/PaymentTermsPage).
 * Akhiran base36 dari timestamp menjaga keunikan tanpa perlu diketik user.
 */
function autoCode(name: string): string {
  const base = name
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20)
  const suffix = Date.now().toString(36).toUpperCase().slice(-4)
  return base ? `${base}-${suffix}` : suffix
}

interface MasterDataCounts {
  warehouses: QuickAddItem[]
  units: QuickAddItem[]
  paymentTerms: QuickAddItem[]
}

interface Props {
  onComplete: (counts: MasterDataCounts) => void
  onBack: () => void
}

/**
 * Daftar diambil lewat query master data yang sama dengan halaman Gudang/
 * Satuan/Syarat Pembayaran penuh (bukan `useState` lokal) -- item yang
 * ditambahkan di step ini sudah benar-benar tersimpan di backend begitu
 * "Simpan" diklik, jadi kalau state lokal saja yang jadi sumber tampilan,
 * pindah ke step lain (mis. buka halaman Saldo Awal lalu kembali) membuat
 * OnboardingPage remount dan daftarnya terlihat kosong lagi padahal datanya
 * masih ada -- user jadi mengira harus mengisi ulang semuanya.
 *
 * "Hapus" di step ini memanggil endpoint `deactivate`, bukan hard delete:
 * backend master data memang tidak punya rute DELETE (lihat
 * MasterData/Routes/api.php) karena baris ini bisa sudah dirujuk transaksi.
 * Efeknya sama seperti yang diharapkan user di wizard -- daftar di sini
 * memfilter `is_active: true`, jadi item yang dihapus langsung hilang dan
 * tidak lagi muncul sebagai pilihan di form transaksi. Teks konfirmasi
 * menyebutkan hal ini supaya tidak terkesan data ikut terhapus permanen.
 */
export function Step4MasterData({ onComplete, onBack }: Props) {
  const { toast } = useToast()
  const { can } = usePermission()

  const gudangQuery = useGudangList({ is_active: true, per_page: 50 })
  const gudangMutations = useGudangMutations()
  const satuanQuery = useSatuanList({ is_active: true, per_page: 50 })
  const satuanMutations = useSatuanMutations()
  const paymentTermsQuery = usePaymentTermsList({ is_active: true, per_page: 50 })
  const paymentTermsMutations = usePaymentTermsMutations()

  const warehouses: QuickAddItem[] = (gudangQuery.data?.data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    values: { name: g.name, address: g.address ?? '' },
    // Backend menolak menonaktifkan gudang default
    // (CANNOT_DEACTIVATE_DEFAULT_WAREHOUSE), jadi tombolnya dimatikan di sini
    // lengkap dengan jalan keluarnya.
    deleteBlockedReason: g.is_default
      ? 'Gudang default tidak bisa dihapus. Tetapkan gudang lain sebagai default lewat Master Data → Gudang terlebih dahulu.'
      : undefined,
  }))
  const units: QuickAddItem[] = (satuanQuery.data?.data ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    sublabel: u.code,
    values: { name: u.name, code: u.code },
  }))
  const paymentTerms: QuickAddItem[] = (paymentTermsQuery.data?.data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    sublabel: `${p.days} hari`,
    values: { name: p.name, days: p.days },
  }))

  const canContinue = warehouses.length >= 1 && units.length >= 1 && paymentTerms.length >= 1

  const handleAddWarehouse = async (data: Record<string, string | number>): Promise<QuickAddItem> => {
    const name = String(data.name)
    const res = await gudangMutations.create.mutateAsync({
      code: autoCode(name),
      name,
      address: data.address ? String(data.address) : undefined,
    })
    toast.success(`Gudang "${res.data.name}" berhasil ditambahkan.`)
    return { id: res.data.id, name: res.data.name }
  }

  // `code` sengaja tidak ikut dikirim saat edit: kode dibuat otomatis di
  // quick-add dan tidak pernah ditampilkan, jadi mengubah nama tidak boleh
  // ikut mengubah kode yang mungkin sudah dipakai referensi lain.
  const handleEditWarehouse = async (id: number, data: Record<string, string | number>) => {
    const res = await gudangMutations.update.mutateAsync({
      id,
      payload: { name: String(data.name), address: data.address ? String(data.address) : '' },
    })
    toast.success(`Gudang "${res.data.name}" berhasil diperbarui.`)
  }

  const handleDeleteWarehouse = async (item: QuickAddItem) => {
    await gudangMutations.deactivate.mutateAsync(item.id)
    toast.success(`Gudang "${item.name}" dihapus dari daftar.`)
  }

  const handleAddUnit = async (data: Record<string, string | number>): Promise<QuickAddItem> => {
    // precision (jumlah desimal) tidak ditanyakan di quick-add -- default 0
    // (satuan hitung bulat, sama seperti default form Satuan penuh), bisa
    // diubah nanti di Master Data > Satuan kalau unit ini butuh desimal.
    const res = await satuanMutations.create.mutateAsync({ name: String(data.name), code: String(data.code), precision: 0 })
    toast.success(`Satuan "${res.data.name}" berhasil ditambahkan.`)
    return { id: res.data.id, name: res.data.name }
  }

  const handleEditUnit = async (id: number, data: Record<string, string | number>) => {
    const res = await satuanMutations.update.mutateAsync({
      id,
      payload: { name: String(data.name), code: String(data.code) },
    })
    toast.success(`Satuan "${res.data.name}" berhasil diperbarui.`)
  }

  const handleDeleteUnit = async (item: QuickAddItem) => {
    await satuanMutations.deactivate.mutateAsync(item.id)
    toast.success(`Satuan "${item.name}" dihapus dari daftar.`)
  }

  const handleAddPaymentTerm = async (data: Record<string, string | number>): Promise<QuickAddItem> => {
    const name = String(data.name)
    const res = await paymentTermsMutations.create.mutateAsync({ code: autoCode(name), name, days: Number(data.days) })
    toast.success(`Syarat pembayaran "${res.data.name}" berhasil ditambahkan.`)
    return { id: res.data.id, name: res.data.name }
  }

  const handleEditPaymentTerm = async (id: number, data: Record<string, string | number>) => {
    const res = await paymentTermsMutations.update.mutateAsync({
      id,
      payload: { name: String(data.name), days: Number(data.days) },
    })
    toast.success(`Syarat pembayaran "${res.data.name}" berhasil diperbarui.`)
  }

  const handleDeletePaymentTerm = async (item: QuickAddItem) => {
    await paymentTermsMutations.deactivate.mutateAsync(item.id)
    toast.success(`Syarat pembayaran "${item.name}" dihapus dari daftar.`)
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#64748b]">
        Tambahkan data dasar yang diperlukan sebelum bisa melakukan transaksi.
        Minimal satu per kategori. Item yang salah ketik bisa diubah, yang
        kelebihan bisa dihapus.
      </p>

      <MasterDataQuickAdd
        title="Gudang"
        description="Tambahkan minimal satu gudang untuk menyimpan stok."
        addLabel="Tambah Gudang"
        fields={[
          { name: 'name', label: 'Nama Gudang', placeholder: 'Gudang Utama' },
          { name: 'address', label: 'Alamat', placeholder: 'Opsional', required: false },
        ]}
        items={warehouses}
        onAdd={handleAddWarehouse}
        onEdit={can('warehouses.edit') ? handleEditWarehouse : undefined}
        onDelete={can('warehouses.deactivate') ? handleDeleteWarehouse : undefined}
        deleteNote="dan tidak lagi muncul sebagai pilihan gudang di transaksi. Gudang dinonaktifkan, bukan dihapus permanen — data yang sudah memakainya tetap utuh dan gudang bisa diaktifkan lagi lewat Master Data → Gudang."
      />

      <MasterDataQuickAdd
        title="Satuan"
        description="Tambahkan satuan produk (pcs, kg, liter, tabung, dll.)"
        addLabel="Tambah Satuan"
        fields={[
          { name: 'name', label: 'Nama Satuan', placeholder: 'Kilogram' },
          { name: 'code', label: 'Kode', placeholder: 'kg' },
        ]}
        items={units}
        onAdd={handleAddUnit}
        onEdit={can('units.edit') ? handleEditUnit : undefined}
        onDelete={can('units.deactivate') ? handleDeleteUnit : undefined}
        deleteNote="dan tidak lagi muncul sebagai pilihan satuan di form produk. Satuan dinonaktifkan, bukan dihapus permanen — produk yang sudah memakainya tetap utuh dan satuan bisa diaktifkan lagi lewat Master Data → Satuan."
      />

      <MasterDataQuickAdd
        title="Syarat Pembayaran"
        description="Tambahkan syarat pembayaran (COD, Net 30, dll.)"
        addLabel="Tambah Syarat Bayar"
        fields={[
          { name: 'name', label: 'Nama', placeholder: 'Net 30' },
          { name: 'days', label: 'Hari', placeholder: '30', type: 'number' },
        ]}
        items={paymentTerms}
        onAdd={handleAddPaymentTerm}
        onEdit={can('payment_terms.edit') ? handleEditPaymentTerm : undefined}
        onDelete={can('payment_terms.deactivate') ? handleDeletePaymentTerm : undefined}
        deleteNote="dan tidak lagi muncul sebagai pilihan di faktur maupun tagihan. Syarat pembayaran dinonaktifkan, bukan dihapus permanen — dokumen yang sudah memakainya tetap utuh dan bisa diaktifkan lagi lewat Master Data → Syarat Pembayaran."
      />

      {!canContinue && (
        <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Tambahkan minimal satu gudang, satu satuan, dan satu syarat pembayaran untuk melanjutkan.
        </p>
      )}

      <div className="flex items-center justify-between pt-2">
        <Button type="button" variant="outline" onClick={onBack}>← Kembali</Button>
        <Button
          type="button"
          disabled={!canContinue}
          onClick={() => onComplete({ warehouses, units, paymentTerms })}
          className="bg-[#e39774] hover:bg-[#d4845e] px-6"
        >
          Lanjutkan →
        </Button>
      </div>
    </div>
  )
}
