import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Ferie } from '@/features/ferie'

const ferieSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Filtri a selezione multipla
  user_id: z.array(z.number()).optional().catch([]),
  tipologia: z.array(z.string()).optional().catch([]),
  stato: z.array(z.string()).optional().catch([]),
  anno: z.array(z.number()).optional().catch([]),
  mese: z.array(z.number()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/ferie/')({
  validateSearch: ferieSearchSchema,
  component: Ferie,
})

