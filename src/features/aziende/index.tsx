import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { AziendeProvider } from './components/aziende-provider'
import { AziendeDialogs } from './components/aziende-dialogs'
import { AziendeTable } from './components/aziende-table'
import { AziendePrimaryButtons } from './components/aziende-primary-buttons'

const route = getRouteApi('/_authenticated/aziende/')

async function fetchAziende() {
  const { data, error } = await supabase
    .from('companies') // Il nome della tabella nel DB rimane 'companies'
    .select('*')
    .eq('is_active', true) // Mostriamo solo le attive
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

function AziendeContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  
  const { data: aziende, isLoading, isError, error } = useQuery({
    queryKey: ['aziende'],
    queryFn: fetchAziende,
  })

  if (isLoading) return <div className="p-8">Caricamento aziende...</div>
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
            <h2 className='text-2xl font-bold tracking-tight'>Aziende</h2>
            <p className='text-muted-foreground'>
              Gestisci clienti e fornitori.
            </p>
          </div>
          <AziendePrimaryButtons />
        </div>
        <AziendeTable 
          data={aziende || []} 
          search={search}
          navigate={navigate}
        />
      </Main>

      <AziendeDialogs />
    </>
  )
}

export function Aziende() {
  return (
    <AziendeProvider>
      <AziendeContent />
    </AziendeProvider>
  )
}
