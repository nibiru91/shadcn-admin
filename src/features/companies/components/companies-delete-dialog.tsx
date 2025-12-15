'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Company } from '../data/schema'

interface CompaniesDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Company
}

export function CompaniesDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: CompaniesDeleteDialogProps) {
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('companies')
        .update({ is_active: false })
        .eq('id', currentRow.id)

      if (error) throw error
      toast.success('Azienda eliminata (logicamente) con successo')
      await queryClient.invalidateQueries({ queryKey: ['companies'] })
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
