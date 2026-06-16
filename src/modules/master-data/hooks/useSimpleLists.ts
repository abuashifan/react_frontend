import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { kategoriProdukApi } from '../services/kategoriProdukApi'
import { satuanApi } from '../services/satuanApi'
import { gudangApi } from '../services/gudangApi'
import { paymentTermsApi } from '../services/paymentTermsApi'
import { departemenApi } from '../services/departemenApi'
import { proyekApi } from '../services/proyekApi'
import type { CreateKategoriProdukPayload, UpdateKategoriProdukPayload } from '../types/kategoriProduk.types'
import type { CreateSatuanPayload, UpdateSatuanPayload } from '../types/satuan.types'
import type { CreateGudangPayload, UpdateGudangPayload } from '../types/gudang.types'
import type { CreatePaymentTermsPayload, UpdatePaymentTermsPayload } from '../types/paymentTerms.types'
import type { CreateDepartemenPayload, UpdateDepartemenPayload } from '../types/departemen.types'
import type { CreateProyekPayload, UpdateProyekPayload } from '../types/proyek.types'

// ── KategoriProduk ────────────────────────────────────────────────────────────

export function useKategoriProdukList(search?: string) {
  return useQuery({
    queryKey: ['master-data-kategori-produk', search],
    queryFn: () => kategoriProdukApi.list({ search }),
  })
}

export function useKategoriProdukMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data-kategori-produk'] })

  const create = useMutation({
    mutationFn: (payload: CreateKategoriProdukPayload) => kategoriProdukApi.create(payload),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateKategoriProdukPayload }) =>
      kategoriProdukApi.update(id, payload),
    onSuccess: invalidate,
  })
  const deactivate = useMutation({
    mutationFn: (id: number) => kategoriProdukApi.deactivate(id),
    onSuccess: invalidate,
  })

  return { create, update, deactivate }
}

// ── Satuan ────────────────────────────────────────────────────────────────────

export function useSatuanList(search?: string) {
  return useQuery({
    queryKey: ['master-data-satuan', search],
    queryFn: () => satuanApi.list({ search }),
  })
}

export function useSatuanMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data-satuan'] })

  const create = useMutation({
    mutationFn: (payload: CreateSatuanPayload) => satuanApi.create(payload),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateSatuanPayload }) =>
      satuanApi.update(id, payload),
    onSuccess: invalidate,
  })
  const deactivate = useMutation({
    mutationFn: (id: number) => satuanApi.deactivate(id),
    onSuccess: invalidate,
  })

  return { create, update, deactivate }
}

// ── Gudang ────────────────────────────────────────────────────────────────────

export function useGudangList(search?: string) {
  return useQuery({
    queryKey: ['master-data-gudang', search],
    queryFn: () => gudangApi.list({ search }),
  })
}

export function useGudangMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data-gudang'] })

  const create = useMutation({
    mutationFn: (payload: CreateGudangPayload) => gudangApi.create(payload),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateGudangPayload }) =>
      gudangApi.update(id, payload),
    onSuccess: invalidate,
  })
  const deactivate = useMutation({
    mutationFn: (id: number) => gudangApi.deactivate(id),
    onSuccess: invalidate,
  })

  return { create, update, deactivate }
}

// ── PaymentTerms ──────────────────────────────────────────────────────────────

export function usePaymentTermsList(search?: string) {
  return useQuery({
    queryKey: ['master-data-payment-terms', search],
    queryFn: () => paymentTermsApi.list({ search }),
  })
}

export function usePaymentTermsMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data-payment-terms'] })

  const create = useMutation({
    mutationFn: (payload: CreatePaymentTermsPayload) => paymentTermsApi.create(payload),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdatePaymentTermsPayload }) =>
      paymentTermsApi.update(id, payload),
    onSuccess: invalidate,
  })
  const deactivate = useMutation({
    mutationFn: (id: number) => paymentTermsApi.deactivate(id),
    onSuccess: invalidate,
  })

  return { create, update, deactivate }
}

// ── Departemen ────────────────────────────────────────────────────────────────

export function useDepartemenList(search?: string) {
  return useQuery({
    queryKey: ['master-data-departemen', search],
    queryFn: () => departemenApi.list({ search }),
  })
}

export function useDepartemenMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data-departemen'] })

  const create = useMutation({
    mutationFn: (payload: CreateDepartemenPayload) => departemenApi.create(payload),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateDepartemenPayload }) =>
      departemenApi.update(id, payload),
    onSuccess: invalidate,
  })
  const deactivate = useMutation({
    mutationFn: (id: number) => departemenApi.deactivate(id),
    onSuccess: invalidate,
  })

  return { create, update, deactivate }
}

// ── Proyek ────────────────────────────────────────────────────────────────────

export function useProyekList(search?: string, status?: string) {
  return useQuery({
    queryKey: ['master-data-proyek', search, status],
    queryFn: () => proyekApi.list({ search, status }),
  })
}

export function useProyekMutations() {
  const qc = useQueryClient()
  const invalidate = () => qc.invalidateQueries({ queryKey: ['master-data-proyek'] })

  const create = useMutation({
    mutationFn: (payload: CreateProyekPayload) => proyekApi.create(payload),
    onSuccess: invalidate,
  })
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProyekPayload }) =>
      proyekApi.update(id, payload),
    onSuccess: invalidate,
  })
  const deactivate = useMutation({
    mutationFn: (id: number) => proyekApi.deactivate(id),
    onSuccess: invalidate,
  })

  return { create, update, deactivate }
}
