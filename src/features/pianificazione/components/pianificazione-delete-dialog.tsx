'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type Planning } from '../data/schema'

interface PianificazioneDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Planning
}

export function PianificazioneDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: PianificazioneDeleteDialogProps) {
  const queryClient = useQueryClient()

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('planning')
        .update({ is_valid: false })
        .eq('id', currentRow.id)

      if (error) throw error
      await queryClient.invalidateQueries({ queryKey: ['pianificazione'] })
      toast.success('Pianificazione eliminata (logicamente) con successo')
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
      title="Elimina Pianificazione"
      desc={`Sei sicuro di voler eliminare la pianificazione per ${userDisplay} - ${commessaTitle}? Questa azione la renderà non valida.`}
      confirmText="Elimina"
      destructive
    />
  )
}

