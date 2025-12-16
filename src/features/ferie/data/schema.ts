import { z } from 'zod'

export const ferieSchema = z.object({
  // Campi da ferie_details
  id: z.number().optional(),
  request_id: z.number().min(1, 'Request ID obbligatorio'),
  user_id: z.number().min(1, 'Utente obbligatorio'),
  data_riferimento: z.string().min(1, 'Data riferimento obbligatoria'),
  ore: z.coerce.number().min(0, 'Le ore devono essere >= 0'),
  week: z.coerce.number().min(1).max(53, 'La settimana deve essere tra 1 e 53'),
  mese: z.coerce.number().min(1).max(12, 'Il mese deve essere tra 1 e 12'),
  anno: z.coerce.number().min(2000).max(2100, 'L\'anno deve essere tra 2000 e 2100'),
  fascia_oraria: z.enum(['mattina', 'pomeriggio', 'full_day']).optional().default('full_day'),
  
  // Campi da ferie_requests (via join)
  tipologia: z.enum(['ferie', 'permesso', 'malattia']).default('ferie'),
  stato: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  note_richiesta: z.string().optional().nullable(),
  note_approvazione: z.string().optional().nullable(),
  approvatore: z.number().optional().nullable(),
  totale_ore_richieste: z.coerce.number().optional().default(0),
})

export type Ferie = z.infer<typeof ferieSchema>

// Schema per il form di creazione richieste
const baseFerieFormSchema = z.object({
  user_id: z.number().min(1, 'Utente obbligatorio'),
  tipologia: z.enum(['ferie', 'permesso', 'malattia']).default('ferie'),
  note_richiesta: z.string().optional().nullable(),
})

const ferieMalattiaFormSchema = baseFerieFormSchema.extend({
  tipologia: z.literal('ferie').or(z.literal('malattia')),
  data_da: z.string().min(1, 'Data inizio obbligatoria'),
  data_a: z.string().min(1, 'Data fine obbligatoria'),
}).refine(
  (data) => {
    if (!data.data_da || !data.data_a) return true
    const dataDa = new Date(data.data_da)
    const dataA = new Date(data.data_a)
    return dataA >= dataDa
  },
  {
    message: 'La data fine deve essere maggiore o uguale alla data inizio',
    path: ['data_a'],
  }
)

const permessoFormSchema = baseFerieFormSchema.extend({
  tipologia: z.literal('permesso'),
  data_permesso: z.string().min(1, 'Data permesso obbligatoria'),
  ore_permesso: z.coerce.number().min(0.5, 'Le ore devono essere almeno 0.5').max(8, 'Le ore non possono superare 8'),
  fascia_oraria: z.enum(['mattina', 'pomeriggio', 'full_day']).default('full_day'),
})

export const ferieFormSchema = z.discriminatedUnion('tipologia', [
  ferieMalattiaFormSchema,
  permessoFormSchema,
])

export type FerieForm = z.infer<typeof ferieFormSchema>

