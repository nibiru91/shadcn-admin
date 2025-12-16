'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { type Ferie } from '../data/schema'
import { useUser } from '@/context/user-provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

const approveSchema = z.object({
  note_approvazione: z.string().optional().nullable(),
})

type ApproveForm = z.infer<typeof approveSchema>

interface FerieApproveDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Ferie
}

export function FerieApproveDialog({
  open,
  onOpenChange,
  currentRow,
}: FerieApproveDialogProps) {
  const queryClient = useQueryClient()
  const { user } = useUser()

  const form = useForm<ApproveForm>({
    resolver: zodResolver(approveSchema),
    defaultValues: {
      note_approvazione: null,
    },
  })

  const handleApprove = async (data: ApproveForm) => {
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
          stato: 'approved',
          note_approvazione: data.note_approvazione || null,
          approvatore: user.id,
        })
        .eq('id', requestId)

      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['ferie'] })
      toast.success('Richiesta approvata con successo')
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'approvazione')
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Approva Richiesta</DialogTitle>
          <DialogDescription>
            Approva la richiesta di {currentRow.tipologia} per {userDisplay}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleApprove)} className='space-y-4'>
            <FormField
              control={form.control}
              name='note_approvazione'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note di approvazione</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder='Inserisci eventuali note di approvazione...'
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Campo opzionale per aggiungere note all'approvazione
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button type='submit'>Approva</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

