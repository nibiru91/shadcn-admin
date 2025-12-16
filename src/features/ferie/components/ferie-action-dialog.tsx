'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { getISOWeek, startOfISOWeek } from 'date-fns'
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
  // Per ora disabilitiamo l'edit
  const isEdit = false
  const queryClient = useQueryClient()

  const form = useForm<FerieForm>({
    resolver: zodResolver(ferieFormSchema),
    defaultValues: {
      user_id: undefined,
      tipologia: 'ferie',
      note_richiesta: null,
    },
  })

  // Reset form quando il dialog si apre/chiude
  useEffect(() => {
    if (!open) {
      form.reset({
        user_id: undefined,
        tipologia: 'ferie',
        note_richiesta: null,
      })
    }
  }, [open, form])

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
    const isoWeek = getISOWeek(date)
    const startOfWeek = startOfISOWeek(date)
    const month = startOfWeek.getMonth() + 1
    const year = startOfWeek.getFullYear()
    return { week: isoWeek, mese: month, anno: year }
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

        // Crea la richiesta
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
      } else if (data.tipologia === 'permesso') {
        // Gestione permesso
        const dataPermesso = parseDate(data.data_permesso)
        
        if (!dataPermesso) {
          toast.error('Data permesso non valida')
          return
        }

        const { week, mese, anno } = calculateDateFields(dataPermesso)

        // Crea la richiesta
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
          <DialogTitle>Nuova Richiesta</DialogTitle>
          <DialogDescription>
            Crea una nuova richiesta di ferie, permesso o malattia.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='user_id'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Utente *</FormLabel>
                    <FormControl>
                      <UserCombobox
                        value={field.value ?? null}
                        onValueChange={field.onChange}
                        placeholder='Seleziona utente...'
                      />
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
                    >
                      <FormControl>
                        <SelectTrigger>
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
                        <DatePicker
                          selected={parseDate(field.value)}
                          onSelect={(date) => {
                            const dateString = formatDateToString(date)
                            field.onChange(dateString)
                          }}
                          placeholder='Seleziona data inizio...'
                          allowFutureDates={true}
                        />
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
                        <DatePicker
                          selected={parseDate(field.value)}
                          onSelect={(date) => {
                            const dateString = formatDateToString(date)
                            field.onChange(dateString)
                          }}
                          placeholder='Seleziona data fine...'
                          allowFutureDates={true}
                        />
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
                        <DatePicker
                          selected={parseDate(field.value)}
                          onSelect={(date) => {
                            const dateString = formatDateToString(date)
                            field.onChange(dateString)
                          }}
                          placeholder='Seleziona data...'
                          allowFutureDates={true}
                        />
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
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='submit'>Salva</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
