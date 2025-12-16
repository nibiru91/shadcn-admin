import { z } from 'zod'

export const timesheetSchema = z.object({
  id: z.number().optional(),
  user_id: z.number().min(1, 'Utente obbligatorio'),
  commessa: z.number().min(1, 'Commessa obbligatoria'),
  ore_lavorate: z.coerce.number().min(0, 'Le ore lavorate devono essere >= 0').default(0),
  ore_billable: z.coerce.number().min(0, 'Le ore billable devono essere >= 0').optional().nullable().default(0),
  detail: z.string().optional().nullable(),
  giorno: z.string().optional().nullable(),
  week: z.coerce.number().min(1).max(53, 'La settimana deve essere tra 1 e 53'),
  mese: z.coerce.number().min(1).max(12, 'Il mese deve essere tra 1 e 12'),
  anno: z.coerce.number().min(2000).max(2100, 'L\'anno deve essere tra 2000 e 2100'),
  is_valid: z.boolean().default(true),
  is_billed: z.boolean().default(false),
  tariffa_billed: z.coerce.number().optional().nullable(),
  fattura: z.string().optional().nullable(),
  data_creazione: z.string().optional(),
  data_modifica: z.string().optional().nullable(),
})

export type Timesheet = z.infer<typeof timesheetSchema>

