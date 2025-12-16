import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { FerieProvider } from './components/ferie-provider'
import { FerieDialogs } from './components/ferie-dialogs'
import { FerieTable } from './components/ferie-table'
import { ferieColumns } from './components/ferie-columns'
import { FeriePrimaryButtons } from './components/ferie-primary-buttons'
import { Ferie } from './data/schema'

const route = getRouteApi('/_authenticated/ferie/')

async function fetchFerie(): Promise<Ferie[]> {
  const { data, error } = await supabase
    .from('ferie_details')
    .select(`
      *,
      user_id:users_profile!user_id(id, name, surname),
      request_id:ferie_requests!request_id(
        id,
        tipologia,
        stato,
        note_richiesta,
        note_approvazione,
        approvatore,
        totale_ore_richieste
      )
    `)
    .order('data_riferimento', { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  
  // Flatten the nested structure to match the schema
  return data.map((item) => ({
    ...item,
    tipologia: (item.request_id as any)?.tipologia || 'ferie',
    stato: (item.request_id as any)?.stato || 'pending',
    note_richiesta: (item.request_id as any)?.note_richiesta || null,
    note_approvazione: (item.request_id as any)?.note_approvazione || null,
    approvatore: (item.request_id as any)?.approvatore || null,
    totale_ore_richieste: (item.request_id as any)?.totale_ore_richieste || 0,
  }))
}

function FerieContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  
  const { data: ferie, isLoading, isError, error } = useQuery({
    queryKey: ['ferie'],
    queryFn: fetchFerie,
  })

  if (isLoading) return <div className="p-8">Caricamento ferie...</div>
  if (isError) return <div className="p-8 text-red-500">Errore: {error.message}</div>

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Ferie</h2>
            <p className='text-muted-foreground'>
              Gestisci le ferie.
            </p>
          </div>
          <FeriePrimaryButtons />
        </div>
        <FerieTable 
          columns={ferieColumns} 
          data={ferie || []} 
          search={search}
          navigate={navigate}
        />
      </Main>

      <FerieDialogs />
    </>
  )
}

export function Ferie() {
  return (
    <FerieProvider>
      <FerieContent />
    </FerieProvider>
  )
}

