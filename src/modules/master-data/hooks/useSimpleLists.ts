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

export function useKategoriProdukList(params: { page: number; per_page: 25 | 50 | 100; search?: string }) {
  return useQuery({
    queryKey: ['master-data-kategori-produk', params],
    queryFn: () => kategoriProdukApi.list(params),
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
  const activate = useMutation({
    mutationFn: (id: number) => kategoriProdukApi.activate(id),
    onSuccess: invalidate,
  })

  return { create, update, activate, deactivate }
}

// ── Satuan ────────────────────────────────────────────────────────────────────

export function useSatuanList(params: { page: number; per_page: 25 | 50 | 100; search?: string }) {
  return useQuery({
    queryKey: ['master-data-satuan', params],
    queryFn: () => satuanApi.list(params),
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
  const activate = useMutation({
    mutationFn: (id: number) => satuanApi.activate(id),
    onSuccess: invalidate,
  })

  return { create, update, activate, deactivate }
}

// ── Gudang ────────────────────────────────────────────────────────────────────

export function useGudangList(params: { page: number; per_page: 25 | 50 | 100; search?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: ['master-data-gudang', params],
    queryFn: () => gudangApi.list(params),
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
  const activate = useMutation({
    mutationFn: (id: number) => gudangApi.activate(id),
    onSuccess: invalidate,
  })

  return { create, update, activate, deactivate }
}

// ── PaymentTerms ──────────────────────────────────────────────────────────────

export function usePaymentTermsList(params: { page: number; per_page: 25 | 50 | 100; search?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: ['master-data-payment-terms', params],
    queryFn: () => paymentTermsApi.list(params),
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
  const activate = useMutation({
    mutationFn: (id: number) => paymentTermsApi.activate(id),
    onSuccess: invalidate,
  })

  return { create, update, activate, deactivate }
}

// ── Departemen ────────────────────────────────────────────────────────────────

export function useDepartemenList(params: { page: number; per_page: 25 | 50 | 100; search?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: ['master-data-departemen', params],
    queryFn: () => departemenApi.list(params),
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
  const activate = useMutation({
    mutationFn: (id: number) => departemenApi.activate(id),
    onSuccess: invalidate,
  })

  return { create, update, activate, deactivate }
}

// ── Proyek ────────────────────────────────────────────────────────────────────

export function useProyekList(params: { page: number; per_page: 25 | 50 | 100; search?: string; status?: string; is_active?: boolean }) {
  return useQuery({
    queryKey: ['master-data-proyek', params],
    queryFn: () => proyekApi.list(params),
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
  const activate = useMutation({
    mutationFn: (id: number) => proyekApi.activate(id),
    onSuccess: invalidate,
  })

  return { create, update, activate, deactivate }
}
