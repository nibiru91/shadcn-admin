'use client'

import { Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Riga } from '../data/wizard-schema'
import { calcolaTotaleRiga } from '../utils/fattura-wizard-utils'
import { CommessaCombobox } from './commessa-combobox'

type RigaFatturaProps = {
  riga: Riga
  onRigaChange: (riga: Riga) => void
  onDelete: () => void
  onOpenTimesheet: () => void
  index: number
}

async function fetchCommessaTitle(id: number) {
  const { data, error } = await supabase
    .from('commesse')
    .select('title')
    .eq('id', id)
    .single()

  if (error) throw new Error(error.message)
  return data?.title || null
}

export function RigaFattura({
  riga,
  onRigaChange,
  onDelete,
  onOpenTimesheet,
  index,
}: RigaFatturaProps) {
  const totaleRiga = calcolaTotaleRiga(riga)
  const isFromTimesheet = riga.timesheet_ids && riga.timesheet_ids.length > 0

  // Carica il titolo della commessa se presente (per visualizzazione quando disabilitata)
  const { data: commessaTitle } = useQuery({
    queryKey: ['commessa-title', riga.id_commessa],
    queryFn: () => fetchCommessaTitle(riga.id_commessa!),
    enabled: !!riga.id_commessa,
  })

  const updateField = <K extends keyof Riga>(field: K, value: Riga[K]) => {
    onRigaChange({ ...riga, [field]: value })
  }

  return (
    <div className='border rounded-lg p-4 space-y-4'>
      <div className='flex items-center justify-between mb-2'>
        <span className='text-sm font-medium'>Riga {index + 1}</span>
        <div className='flex gap-2'>
          {!isFromTimesheet && (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={onOpenTimesheet}
            >
              Timesheet
            </Button>
          )}
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={onDelete}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='md:col-span-2'>
          <label className='text-sm font-medium mb-1 block'>Descrizione *</label>
          <Input
            value={riga.descrizione || ''}
            onChange={(e) => updateField('descrizione', e.target.value)}
            placeholder='Descrizione riga'
          />
        </div>
        <div>
          <label className='text-sm font-medium mb-1 block'>Codice Articolo</label>
          <Input
            value={riga.codice_articolo || ''}
            onChange={(e) => updateField('codice_articolo', e.target.value)}
            placeholder='Codice articolo'
          />
        </div>
        <div>
          <label className='text-sm font-medium mb-1 block'>Unità Misura</label>
          <Input
            value={riga.unita_misura || 'ore'}
            onChange={(e) => updateField('unita_misura', e.target.value)}
            placeholder='ore'
          />
        </div>
      </div>
      
      {/* Riga dedicata per Commessa */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div className='md:col-span-2'>
          <label className='text-sm font-medium mb-1 block'>Commessa</label>
          <CommessaCombobox
            value={riga.id_commessa}
            onValueChange={(value) => updateField('id_commessa', value)}
            placeholder='Seleziona commessa...'
            disabled={isFromTimesheet}
            displayTitle={isFromTimesheet ? commessaTitle : undefined}
          />
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <div>
          <label className='text-sm font-medium mb-1 block'>Quantità</label>
          <Input
            type='number'
            step='0.01'
            value={riga.quantita ?? ''}
            onChange={(e) => updateField('quantita', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder='0'
            disabled={isFromTimesheet}
            className={isFromTimesheet ? 'bg-muted' : ''}
          />
        </div>
        <div>
          <label className='text-sm font-medium mb-1 block'>Prezzo Unitario</label>
          <Input
            type='number'
            step='0.01'
            value={riga.prezzo_unitario ?? ''}
            onChange={(e) => updateField('prezzo_unitario', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder='0.00'
          />
        </div>
        <div>
          <label className='text-sm font-medium mb-1 block'>Sconto %</label>
          <Input
            type='number'
            step='0.01'
            min='0'
            max='100'
            value={riga.sconto_percentuale ?? 0}
            onChange={(e) => updateField('sconto_percentuale', parseFloat(e.target.value) || 0)}
            placeholder='0'
          />
        </div>
        <div>
          <label className='text-sm font-medium mb-1 block'>Aliquota IVA %</label>
          <Input
            type='number'
            step='0.01'
            min='0'
            max='100'
            value={riga.aliquota_iva ?? ''}
            onChange={(e) => updateField('aliquota_iva', e.target.value ? parseFloat(e.target.value) : null)}
            placeholder='0'
          />
        </div>
        <div>
          <label className='text-sm font-medium mb-1 block'>Totale Riga</label>
          <Input
            value={totaleRiga.toFixed(2)}
            readOnly
            className='bg-muted'
            placeholder='0.00'
          />
        </div>
      </div>
    </div>
  )
}

