import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Companies } from '@/features/companies'

const companiesSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Filtro generico per la ricerca testuale
  filter: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/companies/')({
  validateSearch: companiesSearchSchema,
  component: Companies,
})
