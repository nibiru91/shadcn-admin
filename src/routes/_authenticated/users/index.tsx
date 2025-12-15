import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { Users } from '@/features/users'

const usersSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  // Filtro testo per nome/cognome
  fullName: z.string().optional().catch(''),
  // Filtro a selezione multipla per ruolo
  ruolo: z.array(z.string()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/users/')({
  validateSearch: usersSearchSchema,
  component: Users,
})
