import type { Colore, Priorita } from '../data/schema'

export const colorMap: Record<NonNullable<Colore>, { bg: string; border: string }> = {
  rosso: {
    bg: 'bg-red-500/90 hover:bg-red-600 dark:bg-red-600/90 dark:hover:bg-red-700',
    border: 'border-red-600 dark:border-red-500',
  },
  blu: {
    bg: 'bg-blue-500/90 hover:bg-blue-600 dark:bg-blue-600/90 dark:hover:bg-blue-700',
    border: 'border-blue-600 dark:border-blue-500',
  },
  verde: {
    bg: 'bg-green-500/90 hover:bg-green-600 dark:bg-green-600/90 dark:hover:bg-green-700',
    border: 'border-green-600 dark:border-green-500',
  },
  giallo: {
    bg: 'bg-yellow-500/90 hover:bg-yellow-600 dark:bg-yellow-600/90 dark:hover:bg-yellow-700',
    border: 'border-yellow-600 dark:border-yellow-500',
  },
  viola: {
    bg: 'bg-purple-500/90 hover:bg-purple-600 dark:bg-purple-600/90 dark:hover:bg-purple-700',
    border: 'border-purple-600 dark:border-purple-500',
  },
  arancione: {
    bg: 'bg-orange-500/90 hover:bg-orange-600 dark:bg-orange-600/90 dark:hover:bg-orange-700',
    border: 'border-orange-600 dark:border-orange-500',
  },
  rosa: {
    bg: 'bg-pink-500/90 hover:bg-pink-600 dark:bg-pink-600/90 dark:hover:bg-pink-700',
    border: 'border-pink-600 dark:border-pink-500',
  },
  ciano: {
    bg: 'bg-cyan-500/90 hover:bg-cyan-600 dark:bg-cyan-600/90 dark:hover:bg-cyan-700',
    border: 'border-cyan-600 dark:border-cyan-500',
  },
}

export const priorityColors: Record<Priorita, { bg: string; border: string }> = {
  bassa: {
    bg: 'bg-blue-500/90 hover:bg-blue-600 dark:bg-blue-600/90 dark:hover:bg-blue-700',
    border: 'border-blue-600 dark:border-blue-500',
  },
  media: {
    bg: 'bg-yellow-500/90 hover:bg-yellow-600 dark:bg-yellow-600/90 dark:hover:bg-yellow-700',
    border: 'border-yellow-600 dark:border-yellow-500',
  },
  alta: {
    bg: 'bg-orange-500/90 hover:bg-orange-600 dark:bg-orange-600/90 dark:hover:bg-orange-700',
    border: 'border-orange-600 dark:border-orange-500',
  },
  critica: {
    bg: 'bg-red-500/90 hover:bg-red-600 dark:bg-red-600/90 dark:hover:bg-red-700',
    border: 'border-red-600 dark:border-red-500',
  },
}

export const colorOptions: { value: NonNullable<Colore>; label: string }[] = [
  { value: 'rosso', label: 'Rosso' },
  { value: 'blu', label: 'Blu' },
  { value: 'verde', label: 'Verde' },
  { value: 'giallo', label: 'Giallo' },
  { value: 'viola', label: 'Viola' },
  { value: 'arancione', label: 'Arancione' },
  { value: 'rosa', label: 'Rosa' },
  { value: 'ciano', label: 'Ciano' },
]

