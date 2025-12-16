import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { FattureProvider } from './components/fatture-provider'
import { FattureDialogs } from './components/fatture-dialogs'
import { FattureTable } from './components/fatture-table'
import { FatturePrimaryButtons } from './components/fatture-primary-buttons'
import { Fattura } from './data/schema'

const route = getRouteApi('/_authenticated/fatture/')

async function fetchFatture(): Promise<Fattura[]> {
  const { data, error } = await supabase
    .from('fatture_testata')
    .select(`
      *,
      id_cliente:companies!id_cliente(id, ragione_sociale)
    `)
    .order('data_emissione', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

function FattureContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  
  const { data: fatture, isLoading, isError, error } = useQuery({
    queryKey: ['fatture'],
    queryFn: fetchFatture,
  })

  if (isLoading) return <div className="p-8">Caricamento fatture...</div>
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
            <h2 className='text-2xl font-bold tracking-tight'>Fatture</h2>
            <p className='text-muted-foreground'>
              Gestisci le fatture.
            </p>
          </div>
          <FatturePrimaryButtons />
        </div>
        <FattureTable 
          data={fatture || []} 
          search={search}
          navigate={navigate}
        />
      </Main>

      <FattureDialogs />
    </>
  )
}

export function Fatture() {
  return (
    <FattureProvider>
      <FattureContent />
    </FattureProvider>
  )
}

