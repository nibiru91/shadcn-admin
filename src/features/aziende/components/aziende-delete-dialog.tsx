'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Azienda } from '../data/schema'

interface AziendeDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Azienda
}

export function AziendeDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: AziendeDeleteDialogProps) {
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: false })
        .eq('id', currentRow.id)

      if (error) throw error
      toast.success('Azienda eliminata (logicamente) con successo')
      await queryClient.invalidateQueries({ queryKey: ['aziende'] })
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
      title="Elimina Azienda"
      desc={`Sei sicuro di voler eliminare l'azienda ${currentRow.ragione_sociale}? Questa azione la renderà inattiva.`}
      confirmText="Elimina"
      destructive
    />
  )
}
