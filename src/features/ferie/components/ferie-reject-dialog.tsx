'use client'

import { ConfirmDialog } from '@/components/confirm-dialog'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type Ferie } from '../data/schema'
import { useUser } from '@/context/user-provider'

interface FerieRejectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Ferie
}

export function FerieRejectDialog({
  open,
  onOpenChange,
  currentRow,
}: FerieRejectDialogProps) {
  const queryClient = useQueryClient()
  const { user } = useUser()

  const handleReject = async () => {
    try {
      // Estrai request_id (può essere oggetto dal join)
      const requestId = typeof currentRow.request_id === 'object' && currentRow.request_id !== null
        ? (currentRow.request_id as any)?.id ?? currentRow.request_id
        : currentRow.request_id

      if (!requestId) {
        toast.error('Request ID non trovato')
        return
      }

      if (!user?.id) {
        toast.error('Utente non trovato')
        return
      }

      const { error } = await supabase
        .from('ferie_requests')
        .update({
          stato: 'rejected',
          approvatore: user.id,
        })
        .eq('id', requestId)

      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['ferie'] })
      toast.success('Richiesta rifiutata con successo')
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Errore durante il rifiuto')
    }
  }

  const requestUser = (currentRow as any).user_id
  let userDisplay = `Utente #${currentRow.user_id}`
  if (requestUser && typeof requestUser === 'object') {
    const parts: string[] = []
    if (requestUser.surname) parts.push(requestUser.surname)
    if (requestUser.name) parts.push(requestUser.name)
    if (parts.length > 0) {
      userDisplay = parts.join(' ')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      handleConfirm={handleReject}
      title="Rifiuta Richiesta"
      desc={`Sei sicuro di voler rifiutare la richiesta di ${currentRow.tipologia} per ${userDisplay}?`}
      confirmText="Rifiuta"
      destructive
    />
  )
}

