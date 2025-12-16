import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { CommessaRiepilogo } from '@/features/commesse/riepilogo'

const riepilogoSearchSchema = z.object({
  commessaId: z.coerce.string().optional(),
})

export const Route = createFileRoute('/_authenticated/commesse/riepilogo/')({
  validateSearch: riepilogoSearchSchema,
  component: CommessaRiepilogo,
})
