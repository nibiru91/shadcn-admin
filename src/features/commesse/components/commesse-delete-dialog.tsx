'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type Commessa } from '../data/schema'

interface CommesseDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Commessa
}

export function CommesseDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: CommesseDeleteDialogProps) {
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('commesse')
        .update({ is_valid: false })
        .eq('id', currentRow.id)

      if (error) throw error
      await queryClient.invalidateQueries({ queryKey: ['commesse'] })
      toast.success('Commessa eliminata (logicamente) con successo')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      title="Elimina Commessa"
      desc={`Sei sicuro di voler eliminare la commessa "${currentRow.title}"? Questa azione la renderà non valida.`}
      confirmText="Elimina"
      destructive
    />
  )
}

