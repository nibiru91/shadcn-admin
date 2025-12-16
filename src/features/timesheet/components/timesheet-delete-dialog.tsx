'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type Timesheet } from '../data/schema'

interface TimesheetDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Timesheet
}

export function TimesheetDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: TimesheetDeleteDialogProps) {
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('timesheet')
        .update({ is_valid: false })
        .eq('id', currentRow.id)

      if (error) throw error
      await queryClient.invalidateQueries({ queryKey: ['timesheet'] })
      toast.success('Timesheet eliminato (logicamente) con successo')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const commessaTitle = (currentRow as any).commessa?.title || `Commessa #${currentRow.commessa}`
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

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleDelete}
      title="Elimina Timesheet"
      desc={`Sei sicuro di voler eliminare il timesheet per ${userDisplay} - ${commessaTitle}? Questa azione lo renderà non valido.`}
      confirmText="Elimina"
      destructive
    />
  )
}

