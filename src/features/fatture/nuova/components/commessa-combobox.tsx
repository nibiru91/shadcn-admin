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

type Commessa = {
  id: number
  title: string
}

async function fetchCommesse() {
  const { data, error } = await supabase
    .from('commesse')
    .select('id, title')
    .eq('is_valid', true)
    .eq('is_closed', false)
    .order('title', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as Commessa[]
}

interface CommessaComboboxProps {
  value?: number | null
  onValueChange: (value: number | null) => void
  placeholder?: string
  disabled?: boolean
  displayTitle?: string | null // Titolo da mostrare quando la commessa non è nella lista filtrata
}

export function CommessaCombobox({
  value,
  onValueChange,
  placeholder = 'Seleziona commessa...',
  disabled = false,
  displayTitle,
}: CommessaComboboxProps) {
  const [open, setOpen] = React.useState(false)

  const { data: commesse = [], isLoading } = useQuery({
    queryKey: ['commesse-for-fattura-combobox'],
    queryFn: fetchCommesse,
  })

  const selectedCommessa = commesse.find((c) => c.id === value)
  
  // Usa displayTitle se fornito, altrimenti cerca nella lista, altrimenti placeholder
  const displayValue = displayTitle || selectedCommessa?.title || placeholder

  return (
    <Popover open={open && !disabled} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-expanded={open}
          disabled={disabled}
          className='w-full justify-between'
        >
          {displayValue}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      {!disabled && (
        <PopoverContent className='w-full p-0' align='start'>
          <Command>
            <CommandInput placeholder='Cerca commessa...' />
            <CommandList>
              <CommandEmpty>
                {isLoading ? 'Caricamento...' : 'Nessuna commessa trovata.'}
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
                {commesse.map((commessa) => (
                  <CommandItem
                    key={commessa.id}
                    value={commessa.title}
                    onSelect={() => {
                      onValueChange(commessa.id)
                      setOpen(false)
                    }}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value === commessa.id ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {commessa.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      )}
    </Popover>
  )
}

