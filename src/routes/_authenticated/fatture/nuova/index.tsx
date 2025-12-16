import { createFileRoute } from '@tanstack/react-router'
import { NuovaFattura } from '@/features/fatture/nuova'

export const Route = createFileRoute('/_authenticated/fatture/nuova/')({
  component: NuovaFattura,
})

