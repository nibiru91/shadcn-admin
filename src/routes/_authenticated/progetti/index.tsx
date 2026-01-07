import { createFileRoute } from '@tanstack/react-router'
import { Progetti } from '@/features/progetti'

export const Route = createFileRoute('/_authenticated/progetti/')({
  component: Progetti,
})

