import { http } from '@/services/http'
import type { ApiResponse, PaginatedResponse } from '@/types/api.types'
import type { SelectOption } from '@/types/common.types'
import type { Kontak, KontakListParams, CreateKontakPayload, UpdateKontakPayload } from '../types/kontak.types'

interface KontakDto extends Omit<Kontak, 'contact_type'> {
  contact_type: Exclude<Kontak['contact_type'], 'both'>
}

function toKontak(dto: KontakDto): Kontak {
  return {
    ...dto,
    contact_type: dto.is_customer && dto.is_supplier ? 'both' : dto.contact_type,
  }
}

function toKontakPayload(payload: CreateKontakPayload | UpdateKontakPayload) {
  const contactType = payload.contact_type
  if (!contactType) return payload

  return {
    ...payload,
    contact_type: contactType === 'both' ? 'customer' : contactType,
    is_customer: contactType === 'customer' || contactType === 'both',
    is_supplier: contactType === 'supplier' || contactType === 'both',
    is_employee: contactType === 'employee',
  }
}

export const kontakApi = {
  list: async (params: KontakListParams): Promise<PaginatedResponse<Kontak>> => {
    const response = await http.get<unknown, PaginatedResponse<KontakDto>>('/master-data/contacts', { params })
    return { ...response, data: response.data.map(toKontak) }
  },

  get: async (id: number): Promise<ApiResponse<Kontak>> => {
    const response = await http.get<unknown, ApiResponse<KontakDto>>(`/master-data/contacts/${id}`)
    return { ...response, data: toKontak(response.data) }
  },

  create: async (payload: CreateKontakPayload): Promise<ApiResponse<Kontak>> => {
    const response = await http.post<unknown, ApiResponse<KontakDto>>(
      '/master-data/contacts',
      toKontakPayload(payload),
    )
    return { ...response, data: toKontak(response.data) }
  },

  update: async (id: number, payload: UpdateKontakPayload): Promise<ApiResponse<Kontak>> => {
    const response = await http.patch<unknown, ApiResponse<KontakDto>>(
      `/master-data/contacts/${id}`,
      toKontakPayload(payload),
    )
    return { ...response, data: toKontak(response.data) }
  },

  activate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/contacts/${id}/activate`),

  deactivate: (id: number) =>
    http.patch<unknown, ApiResponse<void>>(`/master-data/contacts/${id}/deactivate`),

  search: async (query: string, contact_type?: string): Promise<SelectOption<number>[]> => {
    const res = await http.get<unknown, PaginatedResponse<KontakDto>>(
      '/master-data/contacts',
      { params: { search: query, per_page: 10, contact_type, is_active: true } },
    )
    return res.data.map(toKontak).map((c) => ({
      value: c.id,
      label: c.name,
      sublabel: c.contact_code ?? undefined,
    }))
  },
}
