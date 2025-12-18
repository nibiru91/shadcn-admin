import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Aziende } from '@/features/aziende'

const aziendeSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Filtro generico per la ricerca testuale
  filter: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/aziende/')({
  validateSearch: aziendeSearchSchema,
  component: Aziende,
})
