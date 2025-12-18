export type AziendaTag = 'customer' | 'supplier' | 'both'

export const aziendaTags: { label: string; value: AziendaTag }[] = [
  { label: 'Cliente', value: 'customer' },
  { label: 'Fornitore', value: 'supplier' },
  { label: 'Cliente e fornitore', value: 'both' },
]
