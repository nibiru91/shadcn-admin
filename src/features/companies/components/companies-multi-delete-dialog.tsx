'use client'

import { useState } from 'react'
import { type Table } from '@tanstack/react-table'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'

type CompanyMultiDeleteDialogProps<TData> = {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: Table<TData>
}

const CONFIRM_WORD = 'DELETE'

export function CompaniesMultiDeleteDialog<TData>({
  open,
  onOpenChange,
  table,
}: CompanyMultiDeleteDialogProps<TData>) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  const selectedRows = table.getFilteredSelectedRowModel().rows

  const handleDelete = async () => {
    if (value.trim() !== CONFIRM_WORD) {
      toast.error(`Please type "${CONFIRM_WORD}" to confirm.`)
      return
    }

    const ids = selectedRows
      .map((row) => (row.original as { id?: number | string }).id)
      .filter(Boolean)

    if (!ids.length) {
      toast.error('Nessuna azienda selezionata')
      return
    }

    const promise = supabase
      .from('companies')
      .update({ is_active: false })
      .in('id', ids as (number | string)[])

    toast.promise(promise, {
      loading: 'Eliminazione aziende...',
      success: async () => {
        await queryClient.invalidateQueries({ queryKey: ['companies'] })
        table.resetRowSelection()
        onOpenChange(false)
        return `Eliminate ${ids.length} aziend${ids.length === 1 ? 'a' : 'e'}`
      },
      error: (err) => err.message ?? 'Errore durante l’eliminazione',
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
          Delete {selectedRows.length}{' '}
          {selectedRows.length > 1 ? 'aziende' : 'azienda'}
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Sei sicuro di voler eliminare le aziende selezionate? <br />
            This action cannot be undone.
          </p>

          <Label className='my-4 flex flex-col items-start gap-1.5'>
            <span className=''>Confirm by typing "{CONFIRM_WORD}":</span>
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Type "${CONFIRM_WORD}" to confirm.`}
            />
          </Label>

          <Alert variant='destructive'>
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              Please be careful, this operation can not be rolled back.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText='Delete'
      destructive
    />
  )
}
