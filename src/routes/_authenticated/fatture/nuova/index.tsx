import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { NuovaFattura } from '@/features/fatture/nuova'

const nuovaFatturaSearchSchema = z.object({
  timesheetIds: z.coerce.string().optional(),
  commessaId: z.coerce.string().optional(),
  idCliente: z.coerce.string().optional(),
})

export const Route = createFileRoute('/_authenticated/fatture/nuova/')({
  validateSearch: nuovaFatturaSearchSchema,
  component: NuovaFattura,
})

