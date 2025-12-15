'use client'

import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { supabase } from '@/lib/supabase'

type PianificazioneMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

const CONFIRM_WORD = 'ELIMINA'

export function PianificazioneMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: PianificazioneMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = async () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Scrivi "${CONFIRM_WORD}" per confermare la cancellazione.`)
      return
    }

    const ids = selectedRows
      .map((row) => (row.original as { id?: number | string }).id)
      .filter(Boolean)

    if (!ids.length) {
      toast.error('Nessuna pianificazione selezionata')
      return
    }

    const promise = Promise.resolve().then(async () => {
      const { error } = await supabase
        .from('planning')
        .update({ is_valid: false })
        .in('id', ids as (number | string)[])
        .select()
      if (error) throw error
    })

    toast.promise(promise, {
      loading: 'Eliminazione pianificazioni...',
      success: async () => {
        await queryClient.invalidateQueries({ queryKey: ['pianificazione'] })
        table.resetRowSelection()
        onOpenChange(false)
        return `Eliminate ${ids.length} pianificazione/i`
      },
      error: (err) => err.message ?? 'Errore durante l\'eliminazione',
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      disabled={value.trim() !== CONFIRM_WORD}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          Elimina {selectedRows.length}{' '}
          {selectedRows.length > 1 ? 'pianificazioni' : 'pianificazione'}
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Sei sicuro di voler eliminare le pianificazioni selezionate? <br />
            Questa azione le renderà non valide.
          </p>

          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span className=''>Conferma digitando "{CONFIRM_WORD}":</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Digita "${CONFIRM_WORD}" per confermare.`}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Attenzione!</AlertTitle>
            <AlertDescription>
              Questa operazione non può essere annullata.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Elimina'
      destructive
    />
  )
}

