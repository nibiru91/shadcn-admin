import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Commesse } from '@/features/commesse'

const commesseSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Filtro testo per title/description
  title_desc: z.string().optional().catch(''),
  // Filtri a selezione multipla
  cliente_diretto: z.array(z.string()).optional().catch([]),
  tipologia: z.array(z.string()).optional().catch([]),
  stato: z.array(z.string()).optional().catch([]),
  area: z.array(z.string()).optional().catch([]),
  categoria: z.array(z.string()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/commesse/')({
  validateSearch: commesseSearchSchema,
  component: Commesse,
})

