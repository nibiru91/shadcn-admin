export type CompanyTag = 'customer' | 'supplier' | 'both'

export const companyTags: { label: string; value: CompanyTag }[] = [
  { label: 'Cliente', value: 'customer' },
  { label: 'Fornitore', value: 'supplier' },
  { label: 'Cliente e fornitore', value: 'both' },
]
