'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import React, { useEffect } from 'react'
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

  const form = useForm<Planning>({
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

  async function onSubmit(data: Planning) {
    try {
      const submitData = {
        ...data,
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

  // Genera opzioni per mese (1-12)
  const meseOptions = Array.from({ length: 12 }, (_, i) => i + 1)

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
                      />
                    </FormControl>
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
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : 1)}
                      />
                    </FormControl>
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
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value, 10) : new Date().getFullYear())}
                      />
                    </FormControl>
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

