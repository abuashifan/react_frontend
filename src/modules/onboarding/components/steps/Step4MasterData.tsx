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
 */
export function Step4MasterData({ onComplete, onBack }: Props) {
  const { toast } = useToast()

  const gudangQuery = useGudangList({ is_active: true, per_page: 50 })
  const gudangMutations = useGudangMutations()
  const satuanQuery = useSatuanList({ is_active: true, per_page: 50 })
  const satuanMutations = useSatuanMutations()
  const paymentTermsQuery = usePaymentTermsList({ is_active: true, per_page: 50 })
  const paymentTermsMutations = usePaymentTermsMutations()

  const warehouses: QuickAddItem[] = (gudangQuery.data?.data ?? []).map((g) => ({ id: g.id, name: g.name }))
  const units: QuickAddItem[] = (satuanQuery.data?.data ?? []).map((u) => ({ id: u.id, name: u.name }))
  const paymentTerms: QuickAddItem[] = (paymentTermsQuery.data?.data ?? []).map((p) => ({ id: p.id, name: p.name }))

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

  const handleAddUnit = async (data: Record<string, string | number>): Promise<QuickAddItem> => {
    // precision (jumlah desimal) tidak ditanyakan di quick-add -- default 0
    // (satuan hitung bulat, sama seperti default form Satuan penuh), bisa
    // diubah nanti di Master Data > Satuan kalau unit ini butuh desimal.
    const res = await satuanMutations.create.mutateAsync({ name: String(data.name), code: String(data.code), precision: 0 })
    toast.success(`Satuan "${res.data.name}" berhasil ditambahkan.`)
    return { id: res.data.id, name: res.data.name }
  }

  const handleAddPaymentTerm = async (data: Record<string, string | number>): Promise<QuickAddItem> => {
    const name = String(data.name)
    const res = await paymentTermsMutations.create.mutateAsync({ code: autoCode(name), name, days: Number(data.days) })
    toast.success(`Syarat pembayaran "${res.data.name}" berhasil ditambahkan.`)
    return { id: res.data.id, name: res.data.name }
  }

  return (
    <div className="space-y-4">
      <p className="text-[13px] text-[#64748b]">
        Tambahkan data dasar yang diperlukan sebelum bisa melakukan transaksi.
        Minimal satu per kategori.
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
