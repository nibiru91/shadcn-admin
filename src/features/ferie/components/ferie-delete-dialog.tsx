'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type Ferie } from '../data/schema'

interface FerieDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Ferie
}

export function FerieDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: FerieDeleteDialogProps) {
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('ferie_details')
        .delete()
        .eq('id', currentRow.id)

      if (error) throw error
      await queryClient.invalidateQueries({ queryKey: ['ferie'] })
      toast.success('Ferie eliminate con successo')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const user = (currentRow as any).user_id
  let userDisplay = `Utente #${currentRow.user_id}`
  if (user && typeof user === 'object') {
    const parts: string[] = []
    if (user.surname) parts.push(user.surname)
    if (user.name) parts.push(user.name)
    if (parts.length > 0) {
      userDisplay = parts.join(' ')
    }
  }

  const dataDisplay = currentRow.data_riferimento
    ? new Date(currentRow.data_riferimento).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    : 'data sconosciuta'

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      title="Elimina Ferie"
      desc={`Sei sicuro di voler eliminare le ferie per ${userDisplay} del ${dataDisplay}? Questa azione non può essere annullata.`}
      confirmText="Elimina"
      destructive
    />
  )
}

