import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Pianificazione } from '@/features/pianificazione'

const pianificazioneSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Filtro testo per detail
  detail: z.string().optional().catch(''),
  // Filtri a selezione multipla - migliorata la gestione per accettare singoli valori o array
  user_id: z.preprocess((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : []), z.array(z.coerce.number())).optional().catch([]),
  commessa: z.preprocess((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : []), z.array(z.coerce.number())).optional().catch([]),
  week: z.preprocess((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : []), z.array(z.coerce.number())).optional().catch([]),
  anno: z.preprocess((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : []), z.array(z.coerce.number())).optional().catch([]),
  mese: z.preprocess((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : []), z.array(z.coerce.number())).optional().catch([]),
  is_delayable: z.preprocess((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : []), z.array(z.union([z.boolean(), z.string()]))).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/pianificazione/')({
  validateSearch: pianificazioneSearchSchema,
  component: Pianificazione,
})

