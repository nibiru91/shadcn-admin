import { z } from 'zod'

export const aziendaSchema = z.object({
  id: z.number().optional(),
  ragione_sociale: z.string().min(1, 'La ragione sociale è obbligatoria'),
  description: z.string().optional().nullable(),
  partita_iva: z.string().optional().nullable(),
  codice_fiscale: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  cap: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  province: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
  is_customer: z.boolean().default(false),
  is_supplier: z.boolean().default(false),
  created_at: z.string().optional(),
})

export type Azienda = z.infer<typeof aziendaSchema>
