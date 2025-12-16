'use client'

import * as React from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { RigaFattura } from './riga-fattura'
import { TimesheetPopup } from './timesheet-popup'
import { Riga } from '../data/wizard-schema'
import { generaIdRiga as generateId } from '../utils/fattura-wizard-utils'

type StepRigheFatturaProps = {
  righe: Riga[]
  onRigheChange: (righe: Riga[]) => void
  idAzienda: number | undefined
}

export function StepRigheFattura({
  righe,
  onRigheChange,
  idAzienda,
}: StepRigheFatturaProps) {
  const [timesheetPopupOpen, setTimesheetPopupOpen] = React.useState(false)
  const [currentRigaIndex, setCurrentRigaIndex] = React.useState<number | null>(null)

  const handleAddRiga = () => {
    const nuovaRiga: Riga = {
      id: generateId(),
      descrizione: '',
      quantita: null,
      prezzo_unitario: null,
      sconto_percentuale: 0,
      aliquota_iva: null,
      codice_articolo: null,
      unita_misura: 'ore',
      id_commessa: null,
      timesheet_ids: [],
      ordine: righe.length,
    }
    onRigheChange([...righe, nuovaRiga])
  }

  const handleRigaChange = (index: number, riga: Riga) => {
    const nuoveRighe = [...righe]
    nuoveRighe[index] = { ...riga, ordine: index }
    onRigheChange(nuoveRighe)
  }

  const handleDeleteRiga = async (index: number) => {
    const rigaDaEliminare = righe[index]
    
    // Se la riga ha timesheet associati, rimuovi l'abbinamento
    if (rigaDaEliminare.timesheet_ids && rigaDaEliminare.timesheet_ids.length > 0) {
      try {
        const updates = rigaDaEliminare.timesheet_ids.map((timesheetId) =>
          supabase
            .from('timesheet')
            .update({
              is_billed: false,
              tariffa_billed: null,
              fattura: null,
            })
            .eq('id', timesheetId)
        )
        
        await Promise.all(updates)
      } catch (error) {
        console.error('Errore rimozione abbinamento timesheet:', error)
        // Continua comunque con l'eliminazione della riga
      }
    }
    
    const nuoveRighe = righe.filter((_, i) => i !== index)
    // Aggiorna ordine
    nuoveRighe.forEach((r, i) => {
      r.ordine = i
    })
    onRigheChange(nuoveRighe)
  }

  const handleOpenTimesheet = (index: number) => {
    setCurrentRigaIndex(index)
    setTimesheetPopupOpen(true)
  }

  const handleGeneraRiga = (
    descrizione: string,
    quantita: number,
    prezzoUnitario: number,
    timesheetIds: number[],
    idCommessa: number
  ) => {
    if (currentRigaIndex === null) return

    const riga = righe[currentRigaIndex]
    const rigaAggiornata: Riga = {
      ...riga,
      descrizione,
      quantita,
      prezzo_unitario: prezzoUnitario,
      unita_misura: 'ore',
      id_commessa: idCommessa,
      timesheet_ids: timesheetIds,
      sconto_percentuale: 0,
    }

    handleRigaChange(currentRigaIndex, rigaAggiornata)
  }

  // Inizializza con una riga vuota se non ce ne sono
  React.useEffect(() => {
    if (righe.length === 0) {
      handleAddRiga()
    }
  }, [])

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold mb-2'>Righe Fattura</h3>
          <p className='text-sm text-muted-foreground'>
            Aggiungi le righe della fattura. Puoi generare righe automaticamente dai timesheet.
          </p>
        </div>
        <Button type='button' onClick={handleAddRiga} className='space-x-1'>
          <Plus size={18} />
          <span>Aggiungi Riga</span>
        </Button>
      </div>

      <div className='space-y-4'>
        {righe.map((riga, index) => (
          <RigaFattura
            key={riga.id || index}
            riga={riga}
            onRigaChange={(r) => handleRigaChange(index, r)}
            onDelete={() => handleDeleteRiga(index)}
            onOpenTimesheet={() => handleOpenTimesheet(index)}
            index={index}
          />
        ))}
      </div>

      <TimesheetPopup
        open={timesheetPopupOpen}
        onOpenChange={setTimesheetPopupOpen}
        idAzienda={idAzienda}
        onGeneraRiga={handleGeneraRiga}
      />
    </div>
  )
}

