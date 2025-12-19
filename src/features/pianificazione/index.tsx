import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { PianificazioneProvider } from './components/pianificazione-provider'
import { PianificazioneDialogs } from './components/pianificazione-dialogs'
import { PianificazioneTable } from './components/pianificazione-table'
import { PianificazionePrimaryButtons } from './components/pianificazione-primary-buttons'
import { Planning } from './data/schema'

const route = getRouteApi('/_authenticated/pianificazione/')

async function fetchPianificazione(): Promise<Planning[]> {
  const { data, error } = await supabase
    .from('planning')
    .select(`
      *,
      user_id:users_profile!user_id(id, name, surname),
      commessa:commesse!commessa(id, title)
    `)
    .eq('is_valid', true)
    .order('giorno', { ascending: false, nullsFirst: false })

  if (error) throw new Error(error.message)
  return data
}

function PianificazioneContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  
  const { data: pianificazione, isLoading, isError, error } = useQuery({
    queryKey: ['pianificazione'],
    queryFn: fetchPianificazione,
  })

  if (isLoading) return <div className="p-8">Caricamento pianificazioni...</div>
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
            <h2 className='text-2xl font-bold tracking-tight'>Pianificazione</h2>
            <p className='text-muted-foreground'>
              Gestisci le pianificazioni.
            </p>
          </div>
          <PianificazionePrimaryButtons />
        </div>
        <PianificazioneTable 
          data={pianificazione || []} 
          search={search}
          navigate={navigate}
        />
      </Main>

      <PianificazioneDialogs />
    </>
  )
}

export function Pianificazione() {
  return (
    <PianificazioneProvider>
      <PianificazioneContent />
    </PianificazioneProvider>
  )
}

