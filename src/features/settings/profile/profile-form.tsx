import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/context/user-provider'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'

const profileFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Il nome deve essere di almeno 2 caratteri.')
    .max(50, 'Il nome non può superare i 50 caratteri.')
    .optional()
    .nullable(),
  surname: z
    .string()
    .min(2, 'Il cognome deve essere di almeno 2 caratteri.')
    .max(50, 'Il cognome non può superare i 50 caratteri.')
    .optional()
    .nullable(),
})

type ProfileFormValues = z.input<typeof profileFormSchema>

async function fetchAuthEmail(): Promise<string | null> {
  const { data: sessionData, error } = await supabase.auth.getSession()
  
  if (error) throw new Error(error.message)
  return sessionData.session?.user?.email || null
}

export function ProfileForm() {
  const { user, isLoading: isLoadingUser } = useUser()
  const queryClient = useQueryClient()

  const {
    data: authEmail,
    isLoading: isLoadingEmail,
  } = useQuery({
    queryKey: ['auth-email'],
    queryFn: fetchAuthEmail,
    staleTime: Infinity,
  })

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: null,
      surname: null,
    },
    mode: 'onChange',
  })

  // Popola il form quando i dati sono disponibili
  useEffect(() => {
    if (user && !isLoadingUser) {
      form.reset({
        name: user.name || null,
        surname: user.surname || null,
      })
    }
  }, [user, isLoadingUser, form])

  const isLoading = isLoadingUser || isLoadingEmail

  async function onSubmit(data: ProfileFormValues) {
    if (!user?.id) {
      toast.error('Utente non trovato')
      return
    }

    try {
      // Parse through schema to apply defaults
      const parsedData = profileFormSchema.parse(data)
      
      const { error } = await supabase
        .from('users_profile')
        .update({
          name: parsedData.name || null,
          surname: parsedData.surname || null,
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success('Profilo aggiornato con successo')
      
      // Invalida la query del current user per aggiornare i dati
      await queryClient.invalidateQueries({ queryKey: ['current-user'] })
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'aggiornamento del profilo')
    }
  }

  if (isLoading) {
    return (
      <div className='space-y-8'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-10 w-full' />
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-10 w-full' />
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-24' />
          <Skeleton className='h-10 w-full' />
        </div>
        <Skeleton className='h-10 w-32' />
      </div>
    )
  }

  if (!user) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground'>
          Profilo non trovato. Contatta l'amministratore.
        </p>
      </div>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='space-y-8'
      >
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input 
                  placeholder='Il tuo nome' 
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Il tuo nome di battesimo.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='surname'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cognome</FormLabel>
              <FormControl>
                <Input 
                  placeholder='Il tuo cognome' 
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Il tuo cognome.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='space-y-2'>
          <FormLabel>Email di iscrizione</FormLabel>
          <Input 
            value={authEmail || ''}
            disabled
            className='bg-muted cursor-not-allowed'
          />
          <p className='text-sm text-muted-foreground'>
            L'email utilizzata per l'iscrizione. Non può essere modificata da qui.
          </p>
        </div>
        <Button type='submit'>Aggiorna profilo</Button>
      </form>
    </Form>
  )
}
