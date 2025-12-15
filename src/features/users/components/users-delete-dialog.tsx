'use client'

import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { type User } from '../data/schema'

type UserDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User
}

export function UsersDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: UserDeleteDialogProps) {
  const [value, setValue] = useState('')
  const queryClient = useQueryClient()

  // Costruisci il nome completo (Cognome Nome)
  const parts: string[] = []
  if (currentRow.surname) parts.push(currentRow.surname)
  if (currentRow.name) parts.push(currentRow.name)
  const fullName = parts.length > 0 ? parts.join(' ') : 'questo utente'
  const confirmationText = fullName

  const handleDelete = async () => {
    if (value.trim() !== confirmationText) {
      toast.error('Il testo di conferma non corrisponde')
      return
    }

    try {
      // Eliminazione logica: non eliminiamo fisicamente, ma potremmo impostare un flag se necessario
      // Per ora, eliminiamo fisicamente il record
      const { error } = await supabase
        .from('users_profile')
        .delete()
        .eq('id', currentRow.id)

      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Utente eliminato con successo')
      onOpenChange(false)
      setValue('')
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'eliminazione')
    }
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          setValue('')
        }
        onOpenChange(state)
      }}
      handleConfirm={handleDelete}
      disabled={value.trim() !== confirmationText}
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='stroke-destructive me-1 inline-block'
            size={18}
          />{' '}
          Elimina Utente
        </span>
      }
      desc={
        <div className='space-y-4'>
          <p className='mb-2'>
            Sei sicuro di voler eliminare{' '}
            <span className='font-bold'>{fullName}</span>?
            <br />
            {currentRow.ruolo && (
              <>
                Questo utente ha il ruolo di{' '}
                <span className='font-bold'>
                  {currentRow.ruolo.toUpperCase()}
                </span>
                .{' '}
              </>
            )}
            Questa azione non può essere annullata.
          </p>

          <Label className='my-2'>
            Digita "{confirmationText}" per confermare:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={`Digita "${confirmationText}"`}
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
      confirmText='Elimina'
      destructive
    />
  )
}
