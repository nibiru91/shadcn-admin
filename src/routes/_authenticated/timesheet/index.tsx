import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Timesheet } from '@/features/timesheet'

const timesheetSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Filtro testo per detail
  detail: z.string().optional().catch(''),
  // Filtri a selezione multipla
  user_id: z.array(z.number()).optional().catch([]),
  commessa: z.array(z.number()).optional().catch([]),
  week: z.array(z.number()).optional().catch([]),
  anno: z.array(z.number()).optional().catch([]),
  mese: z.array(z.number()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/timesheet/')({
  validateSearch: timesheetSearchSchema,
  component: Timesheet,
})
