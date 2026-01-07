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
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

type Tenant = {
  id: number
  name: string | null
  subscription_status: string | null
  subscription_end_date: string | null
  stripe_customer_id: string | null
}

type ProfiloFiscale = {
  id: number
  tenant_id: number | null
  regime_fiscale: string | null
  tipo_cassa_previdenziale: string | null
  aliquota_cassa: number | null
  soggetta_ritenuta: boolean | null
  addebita_bollo: boolean | null
  natura_iva_default: string | null
}

const accountFormSchema = z.object({
  tenantName: z
    .string()
    .min(1, 'Il nome dell\'azienda è obbligatorio.')
    .min(2, 'Il nome dell\'azienda deve essere di almeno 2 caratteri.')
    .max(100, 'Il nome dell\'azienda non può superare i 100 caratteri.'),
  addebitaBollo: z.boolean(),
})

type AccountFormValues = z.input<typeof accountFormSchema>

async function fetchTenant(tenantId: number): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from('tenant')
    .select('id, name, subscription_status, subscription_end_date, stripe_customer_id')
    .eq('id', tenantId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

async function fetchProfiloFiscale(tenantId: number): Promise<ProfiloFiscale | null> {
  const { data, error } = await supabase
    .from('profili_fiscali')
    .select('*')
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw new Error(error.message)
  }

  return data
}

export function AccountForm() {
  const { user, isLoading: isLoadingUser } = useUser()
  const queryClient = useQueryClient()

  const tenantId = user?.tenant_id

  const {
    data: tenant,
    isLoading: isLoadingTenant,
  } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => fetchTenant(tenantId!),
    enabled: !!tenantId,
    staleTime: Infinity,
  })

  const {
    data: profiloFiscale,
    isLoading: isLoadingProfiloFiscale,
  } = useQuery({
    queryKey: ['profilo-fiscale', tenantId],
    queryFn: () => fetchProfiloFiscale(tenantId!),
    enabled: !!tenantId,
    staleTime: Infinity,
  })

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      tenantName: '',
      addebitaBollo: false,
    },
    mode: 'onChange',
  })

  // Popola il form quando i dati sono disponibili
  useEffect(() => {
    if (tenant && profiloFiscale && !isLoadingTenant && !isLoadingProfiloFiscale) {
      form.reset({
        tenantName: tenant.name || '',
        addebitaBollo: profiloFiscale.addebita_bollo ?? false,
      })
    }
  }, [tenant, profiloFiscale, isLoadingTenant, isLoadingProfiloFiscale, form])

  const isLoading = isLoadingUser || isLoadingTenant || isLoadingProfiloFiscale

  async function onSubmit(data: AccountFormValues) {
    if (!tenantId) {
      toast.error('Tenant non trovato')
      return
    }

    if (!tenant) {
      toast.error('Dati azienda non trovati')
      return
    }

    if (!profiloFiscale) {
      toast.error('Profilo fiscale non trovato')
      return
    }

    try {
      // Parse through schema to apply defaults
      const parsedData = accountFormSchema.parse(data)
      
      // Aggiorna tenant.name
      const { error: tenantError } = await supabase
        .from('tenant')
        .update({
          name: parsedData.tenantName || null,
        })
        .eq('id', tenantId)

      if (tenantError) throw tenantError

      // Aggiorna profili_fiscali.addebita_bollo
      const { error: profiloError } = await supabase
        .from('profili_fiscali')
        .update({
          addebita_bollo: parsedData.addebitaBollo,
        })
        .eq('tenant_id', tenantId)

      if (profiloError) throw profiloError

      toast.success('Impostazioni account aggiornate con successo')
      
      // Invalida le query per aggiornare i dati
      await queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] })
      await queryClient.invalidateQueries({ queryKey: ['profilo-fiscale', tenantId] })
    } catch (error: any) {
      toast.error(error.message || 'Errore durante l\'aggiornamento delle impostazioni')
    }
  }

  if (isLoading) {
    return (
      <div className='space-y-8'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-10 w-full' />
        </div>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-48' />
          <Skeleton className='h-6 w-6' />
        </div>
        <Separator />
        <div className='space-y-4'>
          <Skeleton className='h-6 w-32' />
          <div className='space-y-2'>
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-6 w-6' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-48' />
            <Skeleton className='h-6 w-6' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-6 w-6' />
          </div>
        </div>
        <Skeleton className='h-10 w-40' />
      </div>
    )
  }

  if (!user || !tenantId) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground'>
          Utente o tenant non trovato. Contatta l'amministratore.
        </p>
      </div>
    )
  }

  if (!tenant || !profiloFiscale) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground'>
          Dati azienda o profilo fiscale non trovati. Contatta l'amministratore.
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
          name='tenantName'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Azienda</FormLabel>
              <FormControl>
                <Input 
                  placeholder='Nome della tua azienda' 
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormDescription>
                Il nome della tua azienda.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='addebitaBollo'
          render={({ field }) => (
            <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className='space-y-1 leading-none'>
                <FormLabel>Addebita Bollo 2 Euro a clienti</FormLabel>
                <FormDescription>
                  Se attivo, il bollo di 2 euro verrà addebitato ai clienti.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />
        <Separator />
        <div className='space-y-6'>
          <div>
            <h3 className='text-lg font-medium'>Dettagli Fiscali</h3>
            <p className='text-sm text-muted-foreground'>
              Informazioni fiscali dell'azienda (non modificabili)
            </p>
          </div>
          <div className='space-y-4'>
            <div className='flex items-center space-x-3'>
              <Checkbox
                checked={true}
                disabled
                className='cursor-not-allowed'
              />
              <div className='space-y-1 leading-none'>
                <label className='text-sm font-medium cursor-not-allowed'>
                  Regime Forfettario
                </label>
                <p className='text-sm text-muted-foreground'>
                  Regime fiscale forfettario attivo
                </p>
              </div>
            </div>
            <div className='flex items-center space-x-3'>
              <Checkbox
                checked={profiloFiscale.soggetta_ritenuta ?? false}
                disabled
                className='cursor-not-allowed'
              />
              <div className='space-y-1 leading-none'>
                <label className='text-sm font-medium cursor-not-allowed'>
                  Soggetto a Ritenuta d'acconto
                </label>
                <p className='text-sm text-muted-foreground'>
                  Indica se l'azienda è soggetta a ritenuta d'acconto
                </p>
              </div>
            </div>
            <div className='space-y-2'>
              <label className='text-sm font-medium cursor-not-allowed'>
                Natura IVA
              </label>
              <Input
                value={profiloFiscale.natura_iva_default || 'N2.2'}
                disabled
                className='bg-muted cursor-not-allowed'
              />
              <p className='text-sm text-muted-foreground'>
                Natura IVA di default per le fatture
              </p>
            </div>
            <div className='flex items-center space-x-3'>
              <Checkbox
                checked={false}
                disabled
                className='cursor-not-allowed'
              />
              <div className='space-y-1 leading-none'>
                <label className='text-sm font-medium cursor-not-allowed'>
                  Cassa Previdenziale
                </label>
                <p className='text-sm text-muted-foreground'>
                  Indica se è attiva la cassa previdenziale
                </p>
              </div>
            </div>
          </div>
        </div>
        <Button type='submit'>Aggiorna impostazioni</Button>
      </form>
    </Form>
  )
}
