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
import { toast } from 'sonner'

type Company = {
  id: number
  ragione_sociale: string
  is_customer: boolean
  is_supplier: boolean
}

async function fetchCompanies(tipoFattura: 'emessa' | 'ricevuta' | undefined) {
  if (!tipoFattura) return []

  let query = supabase
    .from('companies')
    .select('id, ragione_sociale, is_customer, is_supplier')
    .eq('is_active', true)

  if (tipoFattura === 'emessa') {
    // Mostra clienti (include anche quelli che sono sia cliente che fornitore)
    query = query.eq('is_customer', true)
  } else if (tipoFattura === 'ricevuta') {
    // Mostra fornitori (include anche quelli che sono sia cliente che fornitore)
    query = query.eq('is_supplier', true)
  }

  const { data, error } = await query.order('ragione_sociale', { ascending: true })

  if (error) throw new Error(error.message)
  return (data || []) as Company[]
}

type StepSelezioneAziendaProps = {
  tipoFattura: 'emessa' | 'ricevuta' | undefined
  idCliente: number | undefined
  onIdClienteChange: (id: number | undefined) => void
  confermato: boolean
  onConferma: () => void
}

export function StepSelezioneAzienda({
  tipoFattura,
  idCliente,
  onIdClienteChange,
  confermato,
  onConferma,
}: StepSelezioneAziendaProps) {
  const [open, setOpen] = React.useState(false)

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ['companies-for-fattura', tipoFattura],
    queryFn: () => fetchCompanies(tipoFattura),
    enabled: !!tipoFattura,
  })

  const selectedCompany = companies.find((c) => c.id === idCliente)

  const handleConferma = () => {
    if (!tipoFattura) {
      toast.error('Seleziona prima il tipo di fattura')
      return
    }
    if (!idCliente) {
      toast.error('Seleziona un\'azienda')
      return
    }
    onConferma()
  }

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Selezione Azienda</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          {tipoFattura === 'emessa'
            ? 'Seleziona il cliente per la fattura emessa'
            : tipoFattura === 'ricevuta'
              ? 'Seleziona il fornitore per la fattura ricevuta'
              : 'Seleziona prima il tipo di fattura'}
        </p>
      </div>
      <div className='flex gap-2 items-end'>
        <div className='flex-1'>
          <Popover open={open && !confermato} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                role='combobox'
                aria-expanded={open}
                className='w-full justify-between'
                disabled={!tipoFattura || confermato}
              >
                {selectedCompany ? selectedCompany.ragione_sociale : 'Seleziona azienda...'}
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
                    {companies.map((company) => (
                      <CommandItem
                        key={company.id}
                        value={company.ragione_sociale}
                        onSelect={() => {
                          onIdClienteChange(company.id)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            'mr-2 h-4 w-4',
                            idCliente === company.id ? 'opacity-100' : 'opacity-0'
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
        </div>
        <Button onClick={handleConferma} disabled={confermato || !tipoFattura || !idCliente}>
          Conferma Azienda
        </Button>
      </div>
      {confermato && (
        <p className='text-sm text-muted-foreground'>
          ✓ Azienda confermata: {selectedCompany?.ragione_sociale}
        </p>
      )}
    </div>
  )
}

