'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { startOfISOWeek } from 'date-fns'
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
import { DatePicker } from '@/components/date-picker'
import { timesheetSchema, Timesheet } from '../data/schema'
import { UserCombobox } from './user-combobox'
import { CommessaCombobox } from './commessa-combobox'
import type { z } from 'zod'

type TimesheetFormData = z.input<typeof timesheetSchema>

interface TimesheetActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Timesheet | null
}

export function TimesheetActionDialog({
  open,
  onOpenChange,
  currentRow,
}: TimesheetActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const form = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: currentRow
      ? {
          ...currentRow,
        }
      : {
          user_id: undefined,
          commessa: undefined,
          ore_lavorate: 0,
          ore_billable: 0,
          detail: null,
          giorno: null,
          week: 1,
          mese: 1,
          anno: new Date().getFullYear(),
          is_valid: true,
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
        ore_lavorate: 0,
        ore_billable: 0,
        detail: null,
        giorno: null,
        week: 1,
        mese: 1,
        anno: new Date().getFullYear(),
        is_valid: true,
      })
      lastResetRowIdRef.current = null
      lastResetOpenRef.current = open
    }
  }, [currentRow, form, open])

  async function onSubmit(data: TimesheetFormData) {
    try {
      // Parse through schema to apply defaults
      const parsedData = timesheetSchema.parse(data)
      
      const submitData = {
        ...parsedData,
        is_valid: isEdit ? currentRow?.is_valid ?? true : true,
      }

      if (isEdit) {
        const { error } = await supabase
          .from('timesheet')
          .update(submitData)
          .eq('id', currentRow.id)
        if (error) throw error
        toast.success('Timesheet aggiornato con successo')
      } else {
        const { error } = await supabase.from('timesheet').insert(submitData)
        if (error) throw error
        toast.success('Timesheet creato con successo')
      }
      await queryClient.invalidateQueries({ queryKey: ['timesheet'] })
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

  // Watch del campo giorno per calcolare automaticamente i valori
  const giorno = form.watch('giorno')

  // Calcola valori quando cambia il giorno
  useEffect(() => {
    if (giorno) {
      const date = parseDate(giorno)
      if (date) {
        const calculated = calculateISOWeekFromDate(date)
        form.setValue('week', calculated.week, { shouldValidate: false })
        form.setValue('mese', calculated.mese, { shouldValidate: false })
        form.setValue('anno', calculated.anno, { shouldValidate: false })
      }
    }
  }, [giorno, form])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica Timesheet' : 'Nuovo Timesheet'}</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli del timesheet. Clicca salva per confermare.
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

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='ore_lavorate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore Lavorate *</FormLabel>
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
                name='ore_billable'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore Billable</FormLabel>
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
                    <FormDescription>Ore fatturabili (opzionale)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                        disabled={!!giorno}
                        readOnly={!!giorno}
                        className={giorno ? 'bg-muted cursor-not-allowed' : ''}
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

            <DialogFooter>
              <Button type='submit'>Salva</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

