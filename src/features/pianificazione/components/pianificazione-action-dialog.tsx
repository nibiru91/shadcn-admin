'use client'

import { z } from 'zod'
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
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/date-picker'
import { planningSchema, Planning } from '../data/schema'
import { UserCombobox } from './user-combobox'
import { CommessaCombobox } from './commessa-combobox'
import type { z } from 'zod'

type PlanningFormData = z.input<typeof planningSchema>

interface PianificazioneActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Planning | null
}

export function PianificazioneActionDialog({
  open,
  onOpenChange,
  currentRow,
}: PianificazioneActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const form = useForm<PlanningFormData>({
    resolver: zodResolver(planningSchema),
    defaultValues: currentRow
      ? {
          ...currentRow,
        }
      : {
          user_id: undefined,
          commessa: undefined,
          ore: 0,
          detail: null,
          giorno: null,
          week: 1,
          mese: 1,
          anno: new Date().getFullYear(),
          is_valid: true,
          is_delayable: false,
        },
  })

  // Usa un ref per tracciare l'ultimo currentRow resettato per evitare reset multipli
  const lastResetRowIdRef = React.useRef<number | null>(null)
  const lastResetOpenRef = React.useRef<boolean>(false)

  // Aggiorna il form quando currentRow cambia E quando il dialog è aperto
  useEffect(() => {
    if (!open) {
      if (lastResetOpenRef.current) {
        lastResetRowIdRef.current = null
        lastResetOpenRef.current = false
      }
      return
    }

    if (currentRow) {
      const currentRowId = currentRow.id ?? null
      if (lastResetRowIdRef.current === currentRowId && lastResetOpenRef.current === open) {
        return
      }
      // Estrai l'ID se user_id/commessa sono oggetti dal join
      const userId = typeof currentRow.user_id === 'object' && currentRow.user_id !== null
        ? (currentRow.user_id as any)?.id ?? null
        : currentRow.user_id ?? null
      const commessaId = typeof currentRow.commessa === 'object' && currentRow.commessa !== null
        ? (currentRow.commessa as any)?.id ?? null
        : currentRow.commessa ?? null
      form.reset({
        ...currentRow,
        user_id: userId,
        commessa: commessaId,
      })
      lastResetRowIdRef.current = currentRowId
      lastResetOpenRef.current = open
    } else {
      if (lastResetRowIdRef.current === null && lastResetOpenRef.current === open) {
        return
      }
      form.reset({
        user_id: undefined,
        commessa: undefined,
        ore: 0,
        detail: null,
        giorno: null,
        week: 1,
        mese: 1,
        anno: new Date().getFullYear(),
        is_valid: true,
        is_delayable: false,
      })
      lastResetRowIdRef.current = null
      lastResetOpenRef.current = open
    }
  }, [currentRow, form, open])

  async function onSubmit(data: PlanningFormData) {
    try {
      // Parse through schema to apply defaults
      const parsedData = planningSchema.parse(data)
      
      const submitData = {
        ...parsedData,
        is_valid: isEdit ? currentRow?.is_valid ?? true : true,
      }

      if (isEdit) {
        const { error } = await supabase
          .from('planning')
          .update(submitData)
          .eq('id', currentRow.id)
        if (error) throw error
        toast.success('Pianificazione aggiornata con successo')
      } else {
        const { error } = await supabase.from('planning').insert(submitData)
        if (error) throw error
        toast.success('Pianificazione creata con successo')
      }
      await queryClient.invalidateQueries({ queryKey: ['pianificazione'] })
      await queryClient.invalidateQueries({ queryKey: ['user-stats'] })
      onOpenChange(false)
      form.reset()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  // Helper per convertire stringa ISO a Date (local time, no timezone conversion)
  const parseDate = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined
    try {
      // Parse date string as local date (YYYY-MM-DD) to avoid timezone issues
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
  const calculateFromDate = (date: Date) => {
    return calculateISOWeekFromDate(date)
  }

  // Calcola mese e anno da una settimana ISO e anno gregoriano
  // L'anno passato è l'anno gregoriano. Troviamo il primo lunedì della settimana ISO 1
  // La settimana ISO 1 inizia il lunedì della settimana che contiene il 4 gennaio
  const calculateFromWeek = (week: number, gregorianYear: number) => {
    // Trova il 4 gennaio dell'anno gregoriano
    const jan4 = new Date(gregorianYear, 0, 4)
    // Trova il primo lunedì della settimana ISO che contiene il 4 gennaio
    const weekStart = startOfISOWeek(jan4)
    // Aggiungi (week - 1) settimane per arrivare alla settimana desiderata
    const targetWeekStart = new Date(weekStart)
    targetWeekStart.setDate(weekStart.getDate() + (week - 1) * 7)
    
    const month = targetWeekStart.getMonth() + 1
    const year = targetWeekStart.getFullYear()
    return { mese: month, anno: year }
  }

  // Watch dei campi giorno e settimana per calcolare automaticamente i valori
  const giorno = form.watch('giorno')
  const week = form.watch('week')
  const anno = form.watch('anno')

  // Calcola valori quando cambia il giorno
  useEffect(() => {
    if (giorno) {
      const date = parseDate(giorno)
      if (date) {
        const calculated = calculateFromDate(date)
        form.setValue('week', calculated.week, { shouldValidate: false })
        form.setValue('mese', calculated.mese, { shouldValidate: false })
        form.setValue('anno', calculated.anno, { shouldValidate: false })
      }
    }
  }, [giorno, form])

  // Calcola mese e anno quando cambia la settimana (solo se giorno non è selezionato)
  useEffect(() => {
    if (!giorno && week && anno) {
      const calculated = calculateFromWeek(week, anno)
      form.setValue('mese', calculated.mese, { shouldValidate: false })
      form.setValue('anno', calculated.anno, { shouldValidate: false })
    }
  }, [week, anno, giorno, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica Pianificazione' : 'Nuova Pianificazione'}</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli della pianificazione. Clicca salva per confermare.
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
                name='commessa'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commessa *</FormLabel>
                    <FormControl>
                      <CommessaCombobox
                        value={field.value ?? null}
                        onValueChange={field.onChange}
                        placeholder='Seleziona commessa...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='ore'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ore *</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      step='0.5'
                      min='0'
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
                    />
                  </FormControl>
                  <FormDescription>Precisione: 0.5 ore</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='detail'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dettaglio</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='giorno'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Giorno</FormLabel>
                  <FormControl>
                    <div className='flex gap-2'>
                      <DatePicker
                        selected={parseDate(field.value)}
                        onSelect={(date) => {
                          const dateString = formatDateToString(date)
                          field.onChange(dateString)
                        }}
                        placeholder='Seleziona data...'
                        allowFutureDates={true}
                      />
                      {field.value && (
                        <Button
                          type='button'
                          variant='outline'
                          onClick={() => {
                            field.onChange(null)
                          }}
                        >
                          Pulisci
                        </Button>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='week'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Settimana *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='1'
                        max='53'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 1)}
                        disabled={!!giorno}
                        readOnly={!!giorno}
                      />
                    </FormControl>
                    <FormDescription>
                      {giorno ? 'Calcolata automaticamente dal giorno selezionato' : 'Settimana ISO (1-53)'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='mese'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mese *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='1'
                        max='12'
                        {...field}
                        value={field.value ?? ''}
                        disabled={true}
                        readOnly={true}
                        className='bg-muted cursor-not-allowed'
                      />
                    </FormControl>
                    <FormDescription>Calcolato automaticamente</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='anno'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Anno *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='2000'
                        max='2100'
                        {...field}
                        value={field.value ?? ''}
                        disabled={true}
                        readOnly={true}
                        className='bg-muted cursor-not-allowed'
                      />
                    </FormControl>
                    <FormDescription>Calcolato automaticamente</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='flex flex-row gap-6 pt-4'>
              <FormField
                control={form.control}
                name='is_delayable'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm w-full'>
                    <div className='space-y-0.5'>
                      <FormLabel>Rinviabile</FormLabel>
                      <FormDescription>La pianificazione può essere rinviata?</FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type='submit'>Salva</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

