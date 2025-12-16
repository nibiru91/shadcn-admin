'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { getISOWeek, getISOWeekYear, startOfISOWeek } from 'date-fns'
import { calculateISOWeekFromDate } from '@/lib/date-utils'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
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
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/date-picker'
import { ferieFormSchema, FerieForm } from '../data/schema'
import { UserCombobox } from './user-combobox'

interface FerieActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: any | null
}

export function FerieActionDialog({
  open,
  onOpenChange,
  currentRow,
}: FerieActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()
  const [isLoadingRequest, setIsLoadingRequest] = React.useState(false)

  const form = useForm<FerieForm>({
    resolver: zodResolver(ferieFormSchema),
    defaultValues: {
      user_id: undefined,
      tipologia: 'ferie',
      note_richiesta: null,
    },
  })

  // Carica i dati della richiesta quando si apre in modalità edit
  useEffect(() => {
    if (!open || !currentRow) {
      form.reset({
        user_id: undefined,
        tipologia: 'ferie',
        note_richiesta: null,
      })
      return
    }

    const loadRequestData = async () => {
      setIsLoadingRequest(true)
      try {
        // Estrai request_id (può essere oggetto dal join)
        const requestId = typeof currentRow.request_id === 'object' && currentRow.request_id !== null
          ? (currentRow.request_id as any)?.id ?? currentRow.request_id
          : currentRow.request_id

        // Carica tutti i dettagli della stessa richiesta
        const { data: details, error: detailsError } = await supabase
          .from('ferie_details')
          .select('*')
          .eq('request_id', requestId)
          .order('data_riferimento', { ascending: true })

        if (detailsError) throw detailsError

        // Carica la richiesta
        const { data: request, error: requestError } = await supabase
          .from('ferie_requests')
          .select('*')
          .eq('id', requestId)
          .single()

        if (requestError) throw requestError

        // Estrai user_id (può essere oggetto dal join)
        const userId = typeof currentRow.user_id === 'object' && currentRow.user_id !== null
          ? (currentRow.user_id as any)?.id ?? currentRow.user_id
          : currentRow.user_id

        const tipologia = request.tipologia || currentRow.tipologia || 'ferie'

        if (tipologia === 'ferie' || tipologia === 'malattia') {
          // Per ferie/malattia, calcola data_da e data_a dai dettagli
          if (details && details.length > 0) {
            const dates = details.map((d: any) => new Date(d.data_riferimento)).sort((a, b) => a.getTime() - b.getTime())
            const dataDa = dates[0]
            const dataA = dates[dates.length - 1]

            form.reset({
              user_id: userId,
              tipologia: tipologia as 'ferie' | 'malattia',
              data_da: formatDateToString(dataDa) || '',
              data_a: formatDateToString(dataA) || '',
              note_richiesta: request.note_richiesta || null,
            })
          }
        } else if (tipologia === 'permesso') {
          // Per permesso, usa il primo (e unico) dettaglio
          if (details && details.length > 0) {
            const detail = details[0]
            form.reset({
              user_id: userId,
              tipologia: 'permesso',
              data_permesso: detail.data_riferimento || '',
              ore_permesso: detail.ore || 0,
              fascia_oraria: detail.fascia_oraria || 'full_day',
              note_richiesta: request.note_richiesta || null,
            })
          }
        }
      } catch (error: any) {
        toast.error(`Errore nel caricamento dati: ${error.message}`)
      } finally {
        setIsLoadingRequest(false)
      }
    }

    loadRequestData()
  }, [open, currentRow, form])

  // Reset campi condizionali quando cambia la tipologia
  const tipologia = form.watch('tipologia')
  useEffect(() => {
    if (tipologia === 'ferie' || tipologia === 'malattia') {
      // Reset campi permesso
      form.setValue('data_permesso' as any, undefined, { shouldValidate: false })
      form.setValue('ore_permesso' as any, undefined, { shouldValidate: false })
      form.setValue('fascia_oraria' as any, undefined, { shouldValidate: false })
    } else if (tipologia === 'permesso') {
      // Reset campi ferie/malattia
      form.setValue('data_da' as any, undefined, { shouldValidate: false })
      form.setValue('data_a' as any, undefined, { shouldValidate: false })
    }
  }, [tipologia, form])

  // Helper per convertire stringa ISO a Date (local time, no timezone conversion)
  const parseDate = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined
    try {
      const [year, month, day] = dateString.split('-').map(Number)
      if (isNaN(year) || isNaN(month) || isNaN(day)) return undefined
      return new Date(year, month - 1, day)
    } catch {
      return undefined
    }
  }

  // Helper per convertire Date a stringa YYYY-MM-DD (local time, no timezone conversion)
  const formatDateToString = (date: Date | undefined): string | null => {
    if (!date) return null
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Calcola settimana ISO, mese e anno da una data
  const calculateDateFields = (date: Date) => {
    return calculateISOWeekFromDate(date)
  }

  // Ottiene i giorni lavorativi in un range (escludendo sabato e domenica)
  const getWorkingDaysInRange = (dataDa: Date, dataA: Date): Date[] => {
    const workingDays: Date[] = []
    const currentDate = new Date(dataDa)
    
    while (currentDate <= dataA) {
      const dayOfWeek = currentDate.getDay()
      // 0 = domenica, 6 = sabato
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays.push(new Date(currentDate))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return workingDays
  }

  async function onSubmit(data: FerieForm) {
    try {
      const requestId = isEdit && currentRow ? currentRow.request_id : null

      if (data.tipologia === 'ferie' || data.tipologia === 'malattia') {
        // Gestione ferie/malattia
        const dataDa = parseDate(data.data_da)
        const dataA = parseDate(data.data_a)
        
        if (!dataDa || !dataA) {
          toast.error('Date non valide')
          return
        }

        const workingDays = getWorkingDaysInRange(dataDa, dataA)
        
        if (workingDays.length === 0) {
          toast.error('Nessun giorno lavorativo nel range selezionato')
          return
        }

        const totaleOreRichieste = workingDays.length * 8

        if (isEdit && requestId) {
          // Modifica: elimina vecchi dettagli e aggiorna la richiesta
          const { error: deleteError } = await supabase
            .from('ferie_details')
            .delete()
            .eq('request_id', requestId)

          if (deleteError) throw deleteError

          const { error: updateError } = await supabase
            .from('ferie_requests')
            .update({
              user_id: data.user_id,
              tipologia: data.tipologia,
              note_richiesta: data.note_richiesta || null,
              totale_ore_richieste: totaleOreRichieste,
            })
            .eq('id', requestId)

          if (updateError) throw updateError

          // Crea i nuovi dettagli
          const details = workingDays.map((date) => {
            const { week, mese, anno } = calculateDateFields(date)
            return {
              request_id: requestId,
              user_id: data.user_id,
              data_riferimento: formatDateToString(date),
              ore: 8,
              week,
              mese,
              anno,
              fascia_oraria: 'full_day',
            }
          })

          const { error: detailsError } = await supabase
            .from('ferie_details')
            .insert(details)

          if (detailsError) throw detailsError

          toast.success(`${data.tipologia === 'ferie' ? 'Ferie' : 'Malattia'} aggiornate con successo (${workingDays.length} giorni lavorativi)`)
        } else {
          // Crea nuova richiesta
          const { data: requestData, error: requestError } = await supabase
            .from('ferie_requests')
            .insert({
              user_id: data.user_id,
              tipologia: data.tipologia,
              stato: 'pending',
              note_richiesta: data.note_richiesta || null,
              totale_ore_richieste: totaleOreRichieste,
            })
            .select()
            .single()

          if (requestError) throw requestError

          // Crea i dettagli per ogni giorno lavorativo
          const details = workingDays.map((date) => {
            const { week, mese, anno } = calculateDateFields(date)
            return {
              request_id: requestData.id,
              user_id: data.user_id,
              data_riferimento: formatDateToString(date),
              ore: 8,
              week,
              mese,
              anno,
              fascia_oraria: 'full_day',
            }
          })

          const { error: detailsError } = await supabase
            .from('ferie_details')
            .insert(details)

          if (detailsError) {
            // Se fallisce l'inserimento dei dettagli, elimina la richiesta
            await supabase.from('ferie_requests').delete().eq('id', requestData.id)
            throw detailsError
          }

          toast.success(`${data.tipologia === 'ferie' ? 'Ferie' : 'Malattia'} create con successo (${workingDays.length} giorni lavorativi)`)
        }
      } else if (data.tipologia === 'permesso') {
        // Gestione permesso
        const dataPermesso = parseDate(data.data_permesso)
        
        if (!dataPermesso) {
          toast.error('Data permesso non valida')
          return
        }

        const { week, mese, anno } = calculateDateFields(dataPermesso)

        if (isEdit && requestId) {
          // Modifica: elimina vecchio dettaglio e aggiorna la richiesta
          const { error: deleteError } = await supabase
            .from('ferie_details')
            .delete()
            .eq('request_id', requestId)

          if (deleteError) throw deleteError

          const { error: updateError } = await supabase
            .from('ferie_requests')
            .update({
              user_id: data.user_id,
              tipologia: 'permesso',
              note_richiesta: data.note_richiesta || null,
              totale_ore_richieste: data.ore_permesso,
            })
            .eq('id', requestId)

          if (updateError) throw updateError

          // Crea il nuovo dettaglio
          const { error: detailsError } = await supabase
            .from('ferie_details')
            .insert({
              request_id: requestId,
              user_id: data.user_id,
              data_riferimento: formatDateToString(dataPermesso),
              ore: data.ore_permesso,
              week,
              mese,
              anno,
              fascia_oraria: data.fascia_oraria || 'full_day',
            })

          if (detailsError) throw detailsError

          toast.success('Permesso aggiornato con successo')
        } else {
          // Crea nuova richiesta
          const { data: requestData, error: requestError } = await supabase
            .from('ferie_requests')
            .insert({
              user_id: data.user_id,
              tipologia: 'permesso',
              stato: 'pending',
              note_richiesta: data.note_richiesta || null,
              totale_ore_richieste: data.ore_permesso,
            })
            .select()
            .single()

          if (requestError) throw requestError

          // Crea un solo dettaglio
          const { error: detailsError } = await supabase
            .from('ferie_details')
            .insert({
              request_id: requestData.id,
              user_id: data.user_id,
              data_riferimento: formatDateToString(dataPermesso),
              ore: data.ore_permesso,
              week,
              mese,
              anno,
              fascia_oraria: data.fascia_oraria || 'full_day',
            })

          if (detailsError) {
            // Se fallisce l'inserimento del dettaglio, elimina la richiesta
            await supabase.from('ferie_requests').delete().eq('id', requestData.id)
            throw detailsError
          }

          toast.success('Permesso creato con successo')
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['ferie'] })
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      // Gestione errori specifici
      if (error.code === '23505') {
        // Violazione constraint UNIQUE
        toast.error('Esiste già una richiesta per questo utente in questa data')
      } else {
        toast.error(error.message || 'Errore durante il salvataggio')
      }
    }
  }

  const dataDa = form.watch('data_da' as any)
  const dataA = form.watch('data_a' as any)

  // Calcola preview giorni lavorativi per ferie/malattia
  const workingDaysPreview = React.useMemo(() => {
    if (tipologia !== 'ferie' && tipologia !== 'malattia') return null
    if (!dataDa || !dataA) return null
    
    const start = parseDate(dataDa)
    const end = parseDate(dataA)
    
    if (!start || !end) return null
    
    const days = getWorkingDaysInRange(start, end)
    return days.length
  }, [tipologia, dataDa, dataA])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Visualizza Richiesta' : 'Nuova Richiesta'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Visualizza i dettagli della richiesta di ferie, permesso o malattia.' : 'Crea una nuova richiesta di ferie, permesso o malattia.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            {isLoadingRequest && (
              <div className='text-center py-4 text-muted-foreground'>
                Caricamento dati...
              </div>
            )}
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='user_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utente *</FormLabel>
                    <FormControl>
                      <div className={isEdit ? 'pointer-events-none opacity-60' : ''}>
                        <UserCombobox
                          value={field.value ?? null}
                          onValueChange={field.onChange}
                          placeholder='Seleziona utente...'
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='tipologia'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipologia *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isEdit}
                    >
                      <FormControl>
                        <SelectTrigger disabled={isEdit}>
                          <SelectValue placeholder='Seleziona tipologia...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='ferie'>Ferie</SelectItem>
                        <SelectItem value='permesso'>Permesso</SelectItem>
                        <SelectItem value='malattia'>Malattia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Campi condizionali per ferie/malattia */}
            {(tipologia === 'ferie' || tipologia === 'malattia') && (
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='data_da'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data inizio *</FormLabel>
                      <FormControl>
                        <div className={isEdit ? 'pointer-events-none opacity-60' : ''}>
                          <DatePicker
                            selected={parseDate(field.value)}
                            onSelect={(date) => {
                              const dateString = formatDateToString(date)
                              field.onChange(dateString)
                            }}
                            placeholder='Seleziona data inizio...'
                            allowFutureDates={true}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='data_a'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data fine *</FormLabel>
                      <FormControl>
                        <div className={isEdit ? 'pointer-events-none opacity-60' : ''}>
                          <DatePicker
                            selected={parseDate(field.value)}
                            onSelect={(date) => {
                              const dateString = formatDateToString(date)
                              field.onChange(dateString)
                            }}
                            placeholder='Seleziona data fine...'
                            allowFutureDates={true}
                          />
                        </div>
                      </FormControl>
                      {workingDaysPreview !== null && (
                        <FormDescription>
                          Giorni lavorativi: {workingDaysPreview} (totale ore: {workingDaysPreview * 8})
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Campi condizionali per permesso */}
            {tipologia === 'permesso' && (
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='data_permesso'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data permesso *</FormLabel>
                      <FormControl>
                        <div className={isEdit ? 'pointer-events-none opacity-60' : ''}>
                          <DatePicker
                            selected={parseDate(field.value)}
                            onSelect={(date) => {
                              const dateString = formatDateToString(date)
                              field.onChange(dateString)
                            }}
                            placeholder='Seleziona data...'
                            allowFutureDates={true}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='ore_permesso'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ore *</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          step='0.5'
                          min='0.5'
                          max='8'
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                          disabled={isEdit}
                          readOnly={isEdit}
                        />
                      </FormControl>
                      <FormDescription>Massimo 8 ore</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {tipologia === 'permesso' && (
              <FormField
                control={form.control}
                name='fascia_oraria'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fascia oraria</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || 'full_day'}
                      disabled={isEdit}
                    >
                      <FormControl>
                        <SelectTrigger disabled={isEdit}>
                          <SelectValue placeholder='Seleziona fascia oraria...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='full_day'>Giornata intera</SelectItem>
                        <SelectItem value='mattina'>Mattina</SelectItem>
                        <SelectItem value='pomeriggio'>Pomeriggio</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name='note_richiesta'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value || ''}
                      placeholder='Inserisci eventuali note...'
                      disabled={isEdit}
                      readOnly={isEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {!isEdit && (
              <DialogFooter>
                <Button type='submit' disabled={isLoadingRequest}>
                  {isLoadingRequest ? 'Caricamento...' : 'Salva'}
                </Button>
              </DialogFooter>
            )}
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
