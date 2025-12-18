import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Ferie } from '@/features/ferie'

const ferieSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Filtri a selezione multipla - migliorata la gestione per accettare singoli valori o array
  user_id: z.preprocess((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : []), z.array(z.coerce.number())).optional().catch([]),
  tipologia: z.preprocess((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : []), z.array(z.string())).optional().catch([]),
  stato: z.preprocess((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : []), z.array(z.string())).optional().catch([]),
  anno: z.preprocess((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : []), z.array(z.coerce.number())).optional().catch([]),
  mese: z.preprocess((val) => (Array.isArray(val) ? val : val !== undefined ? [val] : []), z.array(z.coerce.number())).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/ferie/')({
  validateSearch: ferieSearchSchema,
  component: Ferie,
})

