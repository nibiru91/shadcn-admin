'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'

const rejectSchema = z.object({
  note_approvazione: z.string().optional().nullable(),
})

type RejectForm = z.infer<typeof rejectSchema>

type FerieDetail = {
  id: number
  data_riferimento: string
  ore: number
  fascia_oraria: string
}

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
  const [details, setDetails] = useState<FerieDetail[]>([])
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)

  const form = useForm<RejectForm>({
    resolver: zodResolver(rejectSchema),
    defaultValues: {
      note_approvazione: null,
    },
  })

  // Carica i dettagli quando il dialog si apre
  useEffect(() => {
    if (!open || !currentRow) {
      setDetails([])
      return
    }

    const loadDetails = async () => {
      setIsLoadingDetails(true)
      try {
        // Estrai request_id (può essere oggetto dal join)
        const requestId = typeof currentRow.request_id === 'object' && currentRow.request_id !== null
          ? (currentRow.request_id as any)?.id ?? currentRow.request_id
          : currentRow.request_id

        if (!requestId) {
          setIsLoadingDetails(false)
          return
        }

        const { data, error } = await supabase
          .from('ferie_details')
          .select('id, data_riferimento, ore, fascia_oraria')
          .eq('request_id', requestId)
          .order('data_riferimento', { ascending: true })

        if (error) throw error
        setDetails(data || [])
      } catch (error: any) {
        toast.error(`Errore nel caricamento dettagli: ${error.message}`)
        setDetails([])
      } finally {
        setIsLoadingDetails(false)
      }
    }

    loadDetails()
  }, [open, currentRow])

  const handleReject = async (data: RejectForm) => {
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
          note_approvazione: data.note_approvazione || null,
          approvatore: user.id,
        })
        .eq('id', requestId)

      if (error) throw error

      await queryClient.invalidateQueries({ queryKey: ['ferie'] })
      toast.success('Richiesta rifiutata con successo')
      onOpenChange(false)
      form.reset()
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

  const getFasciaOrariaLabel = (fascia: string) => {
    switch (fascia) {
      case 'mattina':
        return 'Mattina'
      case 'pomeriggio':
        return 'Pomeriggio'
      case 'full_day':
        return 'Giornata intera'
      default:
        return fascia
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Rifiuta Richiesta</DialogTitle>
          <DialogDescription>
            Rifiuta la richiesta di {currentRow.tipologia} per {userDisplay}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleReject)} className='space-y-4'>
            {/* Tabella dettagli */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium'>Dettagli della richiesta</h4>
              {isLoadingDetails ? (
                <div className='text-center py-4 text-muted-foreground'>
                  Caricamento dettagli...
                </div>
              ) : details.length === 0 ? (
                <div className='text-center py-4 text-muted-foreground'>
                  Nessun dettaglio trovato
                </div>
              ) : (
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Ore</TableHead>
                        <TableHead>Fascia oraria</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {details.map((detail) => (
                        <TableRow key={detail.id}>
                          <TableCell>
                            {detail.data_riferimento
                              ? format(new Date(detail.data_riferimento), 'dd/MM/yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>{detail.ore.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant='secondary'>
                              {getFasciaOrariaLabel(detail.fascia_oraria)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name='note_approvazione'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note di rifiuto</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder='Inserisci eventuali note di rifiuto...'
                      rows={4}
                    />
                  </FormControl>
                  <FormDescription>
                    Campo opzionale per aggiungere note al rifiuto
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Annulla
              </Button>
              <Button type='submit' variant='destructive'>
                Rifiuta
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

