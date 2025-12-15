'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { parseISO } from 'date-fns'
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

  // Carica enum values
  const { data: tipologiaValues = [] } = useQuery({
    queryKey: ['enum-tipo_commesse'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('enum_values', { enum_name: 'tipo_commesse' })
      if (error) throw new Error(error.message)
      // Estrai il campo value se sono oggetti, altrimenti usa direttamente le stringhe
      return (data || []).map((item: string | { value: string }) => 
        typeof item === 'string' ? item : item.value
      ).filter((v: string) => v && v.trim() !== '')
    },
  })

  const { data: statoValues = [] } = useQuery({
    queryKey: ['enum-stato_commesse'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('enum_values', { enum_name: 'stato_commesse' })
      if (error) throw new Error(error.message)
      return (data || []).map((item: string | { value: string }) => 
        typeof item === 'string' ? item : item.value
      ).filter((v: string) => v && v.trim() !== '')
    },
  })

  const { data: areaValues = [] } = useQuery({
    queryKey: ['enum-aree_aziendali'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('enum_values', { enum_name: 'aree_aziendali' })
      if (error) throw new Error(error.message)
      return (data || []).map((item: string | { value: string }) => 
        typeof item === 'string' ? item : item.value
      ).filter((v: string) => v && v.trim() !== '')
    },
  })

  const { data: categoriaValues = [] } = useQuery({
    queryKey: ['enum-categorie_aziendali'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('enum_values', { enum_name: 'categorie_aziendali' })
      if (error) throw new Error(error.message)
      return (data || []).map((item: string | { value: string }) => 
        typeof item === 'string' ? item : item.value
      ).filter((v: string) => v && v.trim() !== '')
    },
  })

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
          ore_pianificate: 0,
          ore_consuntivate: 0,
          ore_residue: 0,
          tipologia: null,
          stato: null,
          area: null,
          categoria: null,
          is_valid: true,
          is_closed: false,
          cliente_diretto: null,
          cliente_fatturazione: null,
          riferimento_interno: null,
          riferimento_esterno: null,
        },
  })

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

  // Helper per convertire stringa ISO a Date
  const parseDate = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined
    try {
      return parseISO(dateString)
    } catch {
      return undefined
    }
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
                        {tipologiaValues
                          .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
                          .map((value) => (
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
                        {statoValues
                          .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
                          .map((value) => (
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
                        {areaValues
                          .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
                          .map((value) => (
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
                        {categoriaValues
                          .filter((v): v is string => typeof v === 'string' && v.trim() !== '')
                          .map((value) => (
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

            <div className='grid grid-cols-4 gap-4'>
              <FormField
                control={form.control}
                name='date_invio'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Invio</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={parseDate(field.value)}
                        onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)}
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
                        onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)}
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
                        onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)}
                        placeholder='Seleziona data...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='date_avvio'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Avvio</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={parseDate(field.value)}
                        onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)}
                        placeholder='Seleziona data...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-3 gap-4'>
              <FormField
                control={form.control}
                name='date_termine'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Termine</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={parseDate(field.value)}
                        onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)}
                        placeholder='Seleziona data...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='date_avvio_prev'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Avvio Prevista</FormLabel>
                    <FormControl>
                      <DatePicker
                        selected={parseDate(field.value)}
                        onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)}
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
                        onSelect={(date) => field.onChange(date ? date.toISOString().split('T')[0] : null)}
                        placeholder='Seleziona data...'
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-4 gap-4'>
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
                name='ore_pianificate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore Pianificate</FormLabel>
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
                name='ore_consuntivate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore Consuntivate</FormLabel>
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
                name='ore_residue'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ore Residue</FormLabel>
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

