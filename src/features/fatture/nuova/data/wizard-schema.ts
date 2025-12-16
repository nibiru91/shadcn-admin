import { z } from 'zod'

export const rigaSchema = z.object({
  id: z.string().optional(), // ID temporaneo per React key
  descrizione: z.string().min(1, 'Descrizione obbligatoria'),
  quantita: z.coerce.number().optional().nullable(),
  prezzo_unitario: z.coerce.number().optional().nullable(),
  sconto_percentuale: z.coerce.number().min(0).max(100).default(0),
  aliquota_iva: z.coerce.number().min(0).max(100).optional().nullable(),
  codice_articolo: z.string().optional().nullable(),
  unita_misura: z.string().optional().nullable().default('ore'),
  id_commessa: z.number().optional().nullable(),
  timesheet_ids: z.array(z.number()).optional().default([]),
  ordine: z.number().default(0),
})

export const fatturaWizardSchema = z.object({
  tipo_fattura: z.enum(['emessa', 'ricevuta']).optional(),
  id_cliente: z.coerce.number().min(1).optional(),
  numero: z.string().min(1, 'Numero fattura obbligatorio'),
  data_emissione: z.string().min(1, 'Data emissione obbligatoria'),
  metodo_pagamento: z.string().optional().nullable(),
  banca_appoggio: z.string().optional().nullable(),
  note: z.string().optional().nullable(),
  note_interne: z.string().optional().nullable(),
  righe: z.array(rigaSchema).min(1, 'Almeno una riga obbligatoria'),
})

export type Riga = z.infer<typeof rigaSchema>
export type FatturaWizard = z.infer<typeof fatturaWizardSchema>

