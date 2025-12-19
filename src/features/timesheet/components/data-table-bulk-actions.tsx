import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { Trash2, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { TimesheetMultiDeleteDialog } from './timesheet-multi-delete-dialog'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { type Timesheet } from '../data/schema'

type DataTableBulkActionsProps<TData> = {
  table: Table<TData>
}

// Helper per estrarre l'ID commessa da un timesheet
function getCommessaId(timesheet: Timesheet): number | null {
  const commessa = (timesheet as any).commessa
  if (typeof commessa === 'object' && commessa !== null) {
    return (commessa as any)?.id ?? null
  }
  return typeof commessa === 'number' ? commessa : null
}

export function DataTableBulkActions<TData>({
  table,
}: DataTableBulkActionsProps<TData>) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Calcola se il bottone "Crea Fattura" deve essere visibile
  // Calcola direttamente senza useMemo per garantire che si aggiorni sempre
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const canCreateInvoice = (() => {
    if (selectedRows.length === 0) return false

    const timesheets = selectedRows.map((row) => row.original as Timesheet)
    
    // Verifica che tutti i timesheet siano non fatturati
    const allUnbilled = timesheets.every((t) => !t.is_billed)
    if (!allUnbilled) return false

    // Verifica che tutti i timesheet abbiano la stessa commessa
    const commessaIds = timesheets.map(getCommessaId).filter((id): id is number => id !== null)
    if (commessaIds.length === 0) return false
    
    const uniqueCommessaIds = new Set(commessaIds)
    return uniqueCommessaIds.size === 1
  })()

  const handleCreateInvoice = async () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (selectedRows.length === 0) {
      toast.error('Seleziona almeno un timesheet')
      return
    }

    const timesheets = selectedRows.map((row) => row.original as Timesheet)
    
    // Verifica che tutti i timesheet siano non fatturati
    const allUnbilled = timesheets.every((t) => !t.is_billed)
    if (!allUnbilled) {
      toast.error('Alcuni timesheet selezionati sono già stati fatturati')
      return
    }

    // Estrai l'ID commessa (tutti dovrebbero avere lo stesso)
    const commessaIds = timesheets.map(getCommessaId).filter((id): id is number => id !== null)
    if (commessaIds.length === 0) {
      toast.error('Nessun timesheet selezionato ha una commessa valida')
      return
    }

    const uniqueCommessaIds = new Set(commessaIds)
    if (uniqueCommessaIds.size > 1) {
      toast.error('I timesheet selezionati appartengono a commesse diverse')
      return
    }

    const commessaId = commessaIds[0]

    try {
      // Recupera la commessa completa con cliente_fatturazione e cliente_diretto
      const { data: commessa, error: commessaError } = await supabase
        .from('commesse')
        .select(`
          id,
          title,
          tariffa_oraria,
          cliente_fatturazione,
          cliente_diretto
        `)
        .eq('id', commessaId)
        .single()

      if (commessaError || !commessa) {
        toast.error('Errore nel recupero della commessa')
        return
      }

      // Determina l'azienda: priorità a cliente_fatturazione, altrimenti cliente_diretto
      const idCliente = commessa.cliente_fatturazione || commessa.cliente_diretto
      if (!idCliente) {
        toast.error('La commessa non ha un cliente associato')
        return
      }

      // Prepara gli ID timesheet
      const timesheetIds = timesheets.map((t) => t.id).filter((id): id is number => id !== null)

      // Costruisci l'URL con i parametri
      const params = new URLSearchParams({
        timesheetIds: timesheetIds.join(','),
        commessaId: String(commessaId),
        idCliente: String(idCliente),
      })

      // Apri il wizard in una nuova scheda
      const url = `/fatture/nuova?${params.toString()}`
      window.open(url, '_blank')
    } catch (error) {
      toast.error('Errore nella creazione della fattura')
      console.error(error)
    }
  }

  return (
    <>
      <BulkActionsToolbar table={table} entityName='timesheet'>
        {canCreateInvoice && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant='default'
                size='icon'
                onClick={handleCreateInvoice}
                className='size-8'
                aria-label='Crea fattura da timesheet selezionati'
                title='Crea fattura da timesheet selezionati'
              >
                <FileText />
                <span className='sr-only'>Crea fattura da timesheet selezionati</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Crea fattura da timesheet selezionati</p>
            </TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant='destructive'
              size='icon'
              onClick={() => setShowDeleteConfirm(true)}
              className='size-8'
              aria-label='Elimina timesheet selezionati'
              title='Elimina timesheet selezionati'
            >
              <Trash2 />
              <span className='sr-only'>Elimina timesheet selezionati</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Elimina timesheet selezionati</p>
          </TooltipContent>
        </Tooltip>
      </BulkActionsToolbar>

      <TimesheetMultiDeleteDialog
        table={table}
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      />
    </>
  )
}

