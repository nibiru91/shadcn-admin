import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { CommesseProvider } from './components/commesse-provider'
import { CommesseDialogs } from './components/commesse-dialogs'
import { CommesseTable } from './components/commesse-table'
import { CommessePrimaryButtons } from './components/commesse-primary-buttons'

const route = getRouteApi('/_authenticated/commesse/')

async function fetchCommesse() {
  const { data, error } = await supabase
    .from('commesse')
    .select(`
      *,
      cliente_diretto:companies!cliente_diretto(id, ragione_sociale),
      cliente_fatturazione:companies!cliente_fatturazione(id, ragione_sociale)
    `)
    .eq('is_valid', true) // Mostriamo solo le valide
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data
}

function CommesseContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  
  const { data: commesse, isLoading, isError, error } = useQuery({
    queryKey: ['commesse'],
    queryFn: fetchCommesse,
  })

  if (isLoading) return <div className="p-8">Caricamento commesse...</div>
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
            <h2 className='text-2xl font-bold tracking-tight'>Commesse</h2>
            <p className='text-muted-foreground'>
              Gestisci le commesse.
            </p>
          </div>
          <CommessePrimaryButtons />
        </div>
        <CommesseTable 
          data={commesse || []} 
          search={search}
          navigate={navigate}
        />
      </Main>

      <CommesseDialogs />
    </>
  )
}

export function Commesse() {
  return (
    <CommesseProvider>
      <CommesseContent />
    </CommesseProvider>
  )
}
