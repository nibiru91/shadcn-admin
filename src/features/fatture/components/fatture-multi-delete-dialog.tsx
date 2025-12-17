'use client'

import { type Table } from '@tanstack/react-table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Fattura } from '../data/schema'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'

type FattureMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

export function FattureMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: FattureMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const CONFIRM_WORD = 'ELIMINA'

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={async () => {
        if (value.trim() !== CONFIRM_WORD) {
          return
        }
        const promise = Promise.resolve().then(async () => {
          for (const row of selectedRows) {
            const { error } = await supabase
              .rpc('delete_invoice_and_reset_timesheets', {
                invoice_id: (row.original as Fattura).id
              });
            if (error) throw error
          }
        })
        toast.promise(promise, {
          loading: 'Eliminazione fatture...',
          success: async () => {
            await queryClient.invalidateQueries({ queryKey: ['fatture'] })
            await queryClient.invalidateQueries({ queryKey: ['user-stats'] })
            onOpenChange(false)
            return 'Fatture eliminate con successo'
          },
          error: (err) => err.message ?? 'Errore durante l\'eliminazione',
        })
      }}
      title="Elimina Fatture"
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Sei sicuro di voler eliminare le fatture selezionate? <br />
            Questa azione non può essere annullata.
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
      confirmText="Elimina"
      destructive
      disabled={value.trim() !== CONFIRM_WORD}
    />
  )
}

