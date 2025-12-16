import { z } from 'zod'

export const fatturaSchema = z.object({
  id: z.coerce.number().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional().nullable(),
  data_emissione: z.string().min(1, 'Data emissione obbligatoria'),
  numero: z.string().min(1, 'Numero obbligatorio'),
  anno: z.coerce.number().optional(),
  id_cliente: z.coerce.number().min(1, 'Cliente obbligatorio'),
  metodo_pagamento: z.string().optional().nullable(),
  banca_appoggio: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  note_interne: z.string().optional().nullable(),
  totale_imponibile: z.coerce.number().min(0).default(0),
  totale_iva: z.coerce.number().min(0).default(0),
  totale_documento: z.coerce.number().min(0).default(0),
  stato: z.string().default('bozza'),
})

export type Fattura = z.infer<typeof fatturaSchema>

