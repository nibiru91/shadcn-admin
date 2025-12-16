import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Fatture } from '@/features/fatture'

const fattureSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Filtro testo per numero
  numero: z.string().optional().catch(''),
  // Filtro data emissione
  data_emissione: z.string().optional().catch(''),
  // Filtri a selezione multipla
  anno: z.array(z.number()).optional().catch([]),
  id_cliente: z.array(z.number()).optional().catch([]),
  stato: z.array(z.string()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/fatture/')({
  validateSearch: fattureSearchSchema,
  component: Fatture,
})
