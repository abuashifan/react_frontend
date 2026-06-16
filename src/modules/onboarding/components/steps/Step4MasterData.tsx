import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MasterDataQuickAdd, type QuickAddItem } from '../MasterDataQuickAdd'
import { onboardingApi } from '../../services/onboardingApi'
import { useToast } from '@/hooks/useToast'

interface MasterDataCounts {
  warehouses: QuickAddItem[]
  units: QuickAddItem[]
  paymentTerms: QuickAddItem[]
}

interface Props {
  onComplete: (counts: MasterDataCounts) => void
  onBack: () => void
}

export function Step4MasterData({ onComplete, onBack }: Props) {
  const { toast } = useToast()
  const [warehouses, setWarehouses] = useState<QuickAddItem[]>([])
  const [units, setUnits] = useState<QuickAddItem[]>([])
  const [paymentTerms, setPaymentTerms] = useState<QuickAddItem[]>([])

  const canContinue = warehouses.length >= 1 && units.length >= 1 && paymentTerms.length >= 1

  const handleAddWarehouse = async (data: Record<string, string | number>): Promise<QuickAddItem> => {
    const res = await onboardingApi.createWarehouse({ name: String(data.name), address: data.address ? String(data.address) : undefined })
    const item = res.data
    setWarehouses((prev) => [...prev, item])
    toast.success(`Gudang "${item.name}" berhasil ditambahkan.`)
    return item
  }

  const handleAddUnit = async (data: Record<string, string | number>): Promise<QuickAddItem> => {
    const res = await onboardingApi.createUnit({ name: String(data.name), code: String(data.code) })
    const item = res.data
    setUnits((prev) => [...prev, item])
    toast.success(`Satuan "${item.name}" berhasil ditambahkan.`)
    return item
  }

  const handleAddPaymentTerm = async (data: Record<string, string | number>): Promise<QuickAddItem> => {
    const res = await onboardingApi.createPaymentTerm({ name: String(data.name), days: Number(data.days) })
    const item = res.data
    setPaymentTerms((prev) => [...prev, item])
    toast.success(`Syarat pembayaran "${item.name}" berhasil ditambahkan.`)
    return item
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
          { name: 'address', label: 'Alamat', placeholder: 'Opsional' },
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
