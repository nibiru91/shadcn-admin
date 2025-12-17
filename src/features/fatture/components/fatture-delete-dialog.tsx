'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { type Fattura } from '../data/schema'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface FattureDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Fattura
}

export function FattureDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: FattureDeleteDialogProps) {
  // Placeholder - non implementato per ora
  const queryClient = useQueryClient()
  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={async () => {
        // Elimina la fattura dal database supabase
        const { error } = await supabase
        .rpc('delete_invoice_and_reset_timesheets', {
          invoice_id: currentRow.id // ID della fattura da eliminare
        });
        if (error) throw error
        await queryClient.invalidateQueries({ queryKey: ['fatture'] })
        await queryClient.invalidateQueries({ queryKey: ['user-stats'] })
        toast.success('Fattura eliminata con successo')
        onOpenChange(false)
        return 'Fattura eliminata con successo'
      }}
      title="Elimina Fattura"
      desc={`Sei sicuro di voler eliminare la fattura ${currentRow.numero}? Questa azione non può essere annullata.`}
      confirmText="Elimina"
      destructive
    />
  )
}

