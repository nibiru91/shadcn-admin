'use client'

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
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { userSchema, type User } from '../data/schema'
import type { z } from 'zod'

type UserFormData = z.input<typeof userSchema>

interface UsersActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: User | null
}

export function UsersActionDialog({
  open,
  onOpenChange,
  currentRow,
}: UsersActionDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  // Usa gli enums dal contesto globale
  const { ruoli: ruoliValues, isLoading: isLoadingEnums } = useEnums()

  const form = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: currentRow
      ? {
          ...currentRow,
          ruolo: currentRow.ruolo || null,
        }
      : {
          name: null,
          surname: null,
          ruolo: null,
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

    // Aspetta che enum siano caricati prima di resettare il form
    if (isLoadingEnums) {
      return
    }

    // Verifica che gli enum siano effettivamente disponibili
    const hasRuoli = ruoliValues.length > 0
    if (!hasRuoli && currentRow?.ruolo) {
      return
    }

    if (currentRow) {
      // Evita reset multipli dello stesso currentRow
      const currentRowId = currentRow.id ?? null
      if (lastResetRowIdRef.current === currentRowId && lastResetOpenRef.current === open) {
        return
      }
      form.reset({
        ...currentRow,
        ruolo: currentRow.ruolo || null,
      })
      lastResetRowIdRef.current = currentRowId
      lastResetOpenRef.current = open
    } else {
      if (lastResetRowIdRef.current === null && lastResetOpenRef.current === open) {
        return
      }
      form.reset({
        name: null,
        surname: null,
        ruolo: null,
      })
      lastResetRowIdRef.current = null
      lastResetOpenRef.current = open
    }
  }, [currentRow, form, isLoadingEnums, open, ruoliValues.length])

  const onSubmit = async (values: UserFormData) => {
    try {
      // Parse through schema to apply defaults
      const parsedData = userSchema.parse(values)
      
      if (isEdit && currentRow?.id) {
        // Update
        const { error } = await supabase
          .from('users_profile')
          .update({
            name: parsedData.name || null,
            surname: parsedData.surname || null,
            ruolo: parsedData.ruolo || null,
          })
          .eq('id', currentRow.id)

        if (error) throw error
        toast.success('Utente aggiornato con successo')
      } else {
        // Insert
        const { error } = await supabase
          .from('users_profile')
          .insert({
            name: parsedData.name || null,
            surname: parsedData.surname || null,
            ruolo: parsedData.ruolo || null,
          })

        if (error) throw error
        toast.success('Utente creato con successo')
      }

      await queryClient.invalidateQueries({ queryKey: ['users'] })
      form.reset()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Errore durante il salvataggio')
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) {
          form.reset()
        }
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? 'Modifica Utente' : 'Aggiungi Utente'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Modifica i dati dell\'utente qui. Clicca salva quando hai finito.'
              : 'Crea un nuovo utente qui. Clicca salva quando hai finito.'}
          </DialogDescription>
        </DialogHeader>
        <div className='h-[26.25rem] w-[calc(100%+0.75rem)] overflow-y-auto py-1 pe-3'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit(onSubmit)}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='surname'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Cognome
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Rossi'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      Nome
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Mario'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='ruolo'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>Ruolo</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value || '__none__'}
                        onValueChange={(value) => {
                          field.onChange(value === '__none__' ? null : value)
                        }}
                      >
                        <SelectTrigger className='col-span-4'>
                          <SelectValue placeholder='Seleziona un ruolo' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='__none__'>Nessuno</SelectItem>
                          {ruoliValues.map((ruolo) => (
                            <SelectItem key={ruolo} value={ruolo}>
                              {ruolo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='user-form'>
            Salva modifiche
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
