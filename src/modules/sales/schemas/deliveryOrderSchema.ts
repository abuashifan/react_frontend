import { z } from 'zod'

export const deliveryOrderSchema = z.object({
  customer_id: z.number({ message: 'Customer wajib dipilih' }),
  date: z.string().min(1, 'Tanggal wajib diisi'),
  warehouse_id: z.number().nullable().optional(),
  delivery_address: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

export type DeliveryOrderFormValues = z.infer<typeof deliveryOrderSchema>
