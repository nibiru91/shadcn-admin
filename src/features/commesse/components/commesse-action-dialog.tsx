'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import React, { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useEnums } from '@/context/enums-provider'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/date-picker'
import { commessaSchema, Commessa } from '../data/schema'
import { CompanyCombobox } from './company-combobox'

interface CommesseActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Commessa | null
}

export function CommesseActionDialog({
  open,
  onOpenChange,
  currentRow,
}: CommesseActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  // Usa gli enums dal contesto globale
  const { tipologia: tipologiaValues, stato: statoValues, area: areaValues, categoria: categoriaValues, isLoading: isLoadingEnums } = useEnums()

  const form = useForm<Commessa>({
    resolver: zodResolver(commessaSchema),
    defaultValues: currentRow
      ? {
          ...currentRow,
          // Assicurati che i valori null siano gestiti correttamente
          tipologia: currentRow.tipologia || null,
          stato: currentRow.stato || null,
          area: currentRow.area || null,
          categoria: currentRow.categoria || null,
        }
      : {
          title: '',
          description: '',
          date_invio: null,
          date_approvazione: null,
          date_rifiuto: null,
          date_avvio: null,
          date_termine: null,
          date_avvio_prev: null,
          date_termine_prev: null,
          ore_previste: 0,
          tariffa_oraria: 0,
          tipologia: null,
          stato: null,
          area: null,
          categoria: null,
          is_valid: true,
          is_closed: true,
          cliente_diretto: null,
          cliente_fatturazione: null,
          riferimento_interno: null,
          riferimento_esterno: null,
        },
  })

  // Usa un ref per tracciare l'ultimo currentRow resettato per evitare reset multipli
  const lastResetRowIdRef = React.useRef<number | null>(null)
  const lastResetOpenRef = React.useRef<boolean>(false)

  // Aggiorna il form quando currentRow cambia E quando enum sono caricati E quando il dialog è aperto
  useEffect(() => {
    // Non resettare il form se il dialog non è aperto
    if (!open) {
      // Reset del ref quando il dialog si chiude
      if (lastResetOpenRef.current) {
        lastResetRowIdRef.current = null
        lastResetOpenRef.current = false
      }
      return
    }

    // Aspetta che enum siano caricati E disponibili prima di resettare il form
    if (isLoadingEnums) {
      return
    }
    
    // Verifica che gli enum siano effettivamente disponibili (non solo che non stiano caricando)
    const hasEnums = tipologiaValues.length > 0 && statoValues.length > 0 && areaValues.length > 0 && categoriaValues.length > 0
    if (!hasEnums) {
      return
    }

    if (currentRow) {
      // Evita reset multipli dello stesso currentRow
      const currentRowId = currentRow.id ?? null
      if (lastResetRowIdRef.current === currentRowId && lastResetOpenRef.current === open) {
        return
      }
      // Estrai l'ID se cliente_diretto/cliente_fatturazione sono oggetti dal join
      const clienteDirettoId = typeof currentRow.cliente_diretto === 'object' && currentRow.cliente_diretto !== null
        ? (currentRow.cliente_diretto as any)?.id ?? null
        : currentRow.cliente_diretto ?? null
      const clienteFatturazioneId = typeof currentRow.cliente_fatturazione === 'object' && currentRow.cliente_fatturazione !== null
        ? (currentRow.cliente_fatturazione as any)?.id ?? null
        : currentRow.cliente_fatturazione ?? null
      form.reset({
        ...currentRow,
        tipologia: currentRow.tipologia || null,
        stato: currentRow.stato || null,
        area: currentRow.area || null,
        categoria: currentRow.categoria || null,
        cliente_diretto: clienteDirettoId,
        cliente_fatturazione: clienteFatturazioneId,
      })
      // Aggiorna il ref per evitare reset multipli
      lastResetRowIdRef.current = currentRowId
      lastResetOpenRef.current = open
    } else {
      // Evita reset multipli quando currentRow è null (modalità creazione)
      if (lastResetRowIdRef.current === null && lastResetOpenRef.current === open) {
        return
      }
      form.reset({
        title: '',
        description: '',
        date_invio: null,
        date_approvazione: null,
        date_rifiuto: null,
        date_avvio: null,
        date_termine: null,
        date_avvio_prev: null,
        date_termine_prev: null,
        ore_previste: 0,
        tariffa_oraria: 0,
        tipologia: null,
        stato: null,
        area: null,
        categoria: null,
        is_valid: true,
        is_closed: true,
        cliente_diretto: null,
        cliente_fatturazione: null,
        riferimento_interno: null,
        riferimento_esterno: null,
      })
      // Aggiorna il ref per evitare reset multipli
      lastResetRowIdRef.current = null
      lastResetOpenRef.current = open
    }
  }, [currentRow, form, isLoadingEnums, tipologiaValues.length, statoValues.length, areaValues.length, categoriaValues.length, open])

  async function onSubmit(data: Commessa) {
    try {
      // Le date sono già stringhe nel formato corretto dal form
      // Converti __none__ in null per i campi enum
      // is_valid è sempre true in creazione, e non viene modificato in edit
      const submitData = {
        ...data,
        tipologia: data.tipologia === '__none__' ? null : data.tipologia,
        stato: data.stato === '__none__' ? null : data.stato,
        area: data.area === '__none__' ? null : data.area,
        categoria: data.categoria === '__none__' ? null : data.categoria,
        is_valid: isEdit ? currentRow?.is_valid ?? true : true, // Mantieni il valore esistente in edit, sempre true in creazione
      }

      if (isEdit) {
        const { error } = await supabase
          .from('commesse')
          .update(submitData)
          .eq('id', currentRow.id)
        if (error) throw error
        toast.success('Commessa aggiornata con successo')
      } else {
        const { error } = await supabase.from('commesse').insert(submitData)
        if (error) throw error
        toast.success('Commessa creata con successo')
      }
      await queryClient.invalidateQueries({ queryKey: ['commesse'] })
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifica Commessa' : 'Nuova Commessa'}</DialogTitle>
          <DialogDescription>
            Inserisci i dettagli della commessa. Clicca salva per confermare.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titolo *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrizione</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='cliente_diretto'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente Diretto</FormLabel>
                    <FormControl>
                      <CompanyCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder='Seleziona cliente diretto...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='cliente_fatturazione'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente Fatturazione</FormLabel>
                    <FormControl>
                      <CompanyCombobox
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder='Seleziona cliente fatturazione...'
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
                name='tipologia'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipologia</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Seleziona tipologia...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='__none__'>Nessuna</SelectItem>
                        {tipologiaValues.map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {String(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='stato'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stato</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Seleziona stato...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='__none__'>Nessuno</SelectItem>
                        {statoValues.map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {String(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='area'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Seleziona area...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='__none__'>Nessuna</SelectItem>
                        {areaValues.map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {String(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='categoria'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === '__none__' ? null : value)}
                      value={field.value || '__none__'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Seleziona categoria...' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='__none__'>Nessuna</SelectItem>
                        {categoriaValues.map((value) => (
                          <SelectItem key={value} value={String(value)}>
                            {String(value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='riferimento_interno'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Riferimento Interno</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='riferimento_esterno'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Riferimento Esterno</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='date_invio'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Invio</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={parseDate(field.value)}
                        onSelect={(date) => {
                          const dateString = formatDateToString(date)
                          field.onChange(dateString)
                        }}
                        placeholder='Seleziona data...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='date_approvazione'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Approvazione</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={parseDate(field.value)}
                        onSelect={(date) => {
                          const dateString = formatDateToString(date)
                          field.onChange(dateString)
                        }}
                        placeholder='Seleziona data...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='date_rifiuto'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Rifiuto</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={parseDate(field.value)}
                        onSelect={(date) => {
                          const dateString = formatDateToString(date)
                          field.onChange(dateString)
                        }}
                        placeholder='Seleziona data...'
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
                name='date_avvio_prev'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Avvio Prevista</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={parseDate(field.value)}
                        onSelect={(date) => {
                          const dateString = formatDateToString(date)
                          field.onChange(dateString)
                        }}
                        placeholder='Seleziona data...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='date_termine_prev'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Termine Prevista</FormLabel>
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
            </div>

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='date_avvio'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Avvio</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={parseDate(field.value)}
                        onSelect={(date) => {
                          const dateString = formatDateToString(date)
                          field.onChange(dateString)
                        }}
                        placeholder='Seleziona data...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='date_termine'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Termine</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={parseDate(field.value)}
                        onSelect={(date) => {
                          const dateString = formatDateToString(date)
                          field.onChange(dateString)
                        }}
                        placeholder='Seleziona data...'
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
                name='ore_previste'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore Previste</FormLabel>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='tariffa_oraria'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tariffa Oraria</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        min='0'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : 0)}
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
                name='is_closed'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm w-full'>
                    <div className='space-y-0.5'>
                      <FormLabel>Chiusa</FormLabel>
                      <FormDescription>La commessa è chiusa?</FormDescription>
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

