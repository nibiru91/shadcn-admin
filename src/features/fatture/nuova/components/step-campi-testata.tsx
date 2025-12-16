'use client'

import * as React from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { DatePicker } from '@/components/date-picker'

type StepCampiTestataProps = {
  numero: string
  onNumeroChange: (numero: string) => void
  dataEmissione: string | undefined
  onDataEmissioneChange: (data: string | undefined) => void
  metodoPagamento: string | undefined
  onMetodoPagamentoChange: (metodo: string | undefined) => void
  bancaAppoggio: string | undefined
  onBancaAppoggioChange: (banca: string | undefined) => void
  note: string | undefined
  onNoteChange: (note: string | undefined) => void
  noteInterne: string | undefined
  onNoteInterneChange: (note: string | undefined) => void
}

export function StepCampiTestata({
  numero,
  onNumeroChange,
  dataEmissione,
  onDataEmissioneChange,
  metodoPagamento,
  onMetodoPagamentoChange,
  bancaAppoggio,
  onBancaAppoggioChange,
  note,
  onNoteChange,
  noteInterne,
  onNoteInterneChange,
}: StepCampiTestataProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const parseDate = (dateString: string | undefined): Date | undefined => {
    if (!dateString) return undefined
    const date = new Date(dateString)
    return isNaN(date.getTime()) ? undefined : date
  }

  const formatDateToString = (date: Date | undefined): string | undefined => {
    if (!date) return undefined
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  return (
    <div className='space-y-4'>
      <div>
        <h3 className='text-lg font-semibold mb-2'>Campi Testata</h3>
        <p className='text-sm text-muted-foreground mb-4'>
          Compila i campi obbligatori e opzionali della fattura
        </p>
      </div>

      <div className='space-y-4'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label className='text-sm font-medium mb-1 block'>
              Numero Fattura *
            </label>
            <Input
              value={numero}
              onChange={(e) => onNumeroChange(e.target.value)}
              placeholder='Numero fattura'
              required
            />
          </div>
          <div>
            <label className='text-sm font-medium mb-1 block'>
              Data Emissione *
            </label>
            <DatePicker
              selected={parseDate(dataEmissione)}
              onSelect={(date) => {
                onDataEmissioneChange(formatDateToString(date))
              }}
              placeholder='Seleziona data emissione'
              allowFutureDates={false}
            />
          </div>
        </div>

        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button type='button' variant='ghost' className='w-full justify-between'>
              <span>Campi Opzionali</span>
              {isOpen ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className='space-y-4 pt-4'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label className='text-sm font-medium mb-1 block'>
                  Metodo Pagamento
                </label>
                <Input
                  value={metodoPagamento || ''}
                  onChange={(e) => onMetodoPagamentoChange(e.target.value || undefined)}
                  placeholder='Metodo pagamento'
                />
              </div>
              <div>
                <label className='text-sm font-medium mb-1 block'>
                  Banca Appoggio
                </label>
                <Input
                  value={bancaAppoggio || ''}
                  onChange={(e) => onBancaAppoggioChange(e.target.value || undefined)}
                  placeholder='Banca appoggio'
                />
              </div>
            </div>
            <div>
              <label className='text-sm font-medium mb-1 block'>Note</label>
              <Textarea
                value={note || ''}
                onChange={(e) => onNoteChange(e.target.value || undefined)}
                placeholder='Note'
                rows={3}
              />
            </div>
            <div>
              <label className='text-sm font-medium mb-1 block'>Note Interne</label>
              <Textarea
                value={noteInterne || ''}
                onChange={(e) => onNoteInterneChange(e.target.value || undefined)}
                placeholder='Note interne'
                rows={3}
              />
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}

