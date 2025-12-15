'use client'

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

type Company = {
  id: number
  ragione_sociale: string
}

async function fetchCompanies() {
  const { data, error } = await supabase
    .from('companies')
    .select('id, ragione_sociale')
    .eq('is_active', true)
    .order('ragione_sociale', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as Company[]
}

interface CompanyComboboxProps {
  value?: number | null
  onValueChange: (value: number | null) => void
  placeholder?: string
}

export function CompanyCombobox({
  value,
  onValueChange,
  placeholder = 'Seleziona azienda...',
}: CompanyComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies-for-combobox'],
    queryFn: fetchCompanies,
  })

  const selectedCompany = companies.find((c) => c.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          className='w-full justify-between'
        >
          {selectedCompany ? selectedCompany.ragione_sociale : placeholder}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-full p-0' align='start'>
        <Command>
          <CommandInput placeholder='Cerca azienda...' />
          <CommandList>
            <CommandEmpty>
              {isLoading ? 'Caricamento...' : 'Nessuna azienda trovata.'}
            </CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => {
                  onValueChange(null)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    'mr-2 h-4 w-4',
                    value === null ? 'opacity-100' : 'opacity-0'
                  )}
                />
                Nessuna
              </CommandItem>
              {companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.ragione_sociale}
                  onSelect={() => {
                    onValueChange(company.id)
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === company.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {company.ragione_sociale}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

