import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { supabase } from '@/lib/supabase'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { TimesheetProvider } from './components/timesheet-provider'
import { TimesheetDialogs } from './components/timesheet-dialogs'
import { TimesheetTable } from './components/timesheet-table'
import { TimesheetPrimaryButtons } from './components/timesheet-primary-buttons'
import type { Timesheet } from './data/schema'

const route = getRouteApi('/_authenticated/timesheet/')

async function fetchTimesheet(): Promise<Timesheet[]> {
  const { data, error } = await supabase
    .from('timesheet')
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

function TimesheetContent() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  
  const { data: timesheet, isLoading, isError, error } = useQuery({
    queryKey: ['timesheet'],
    queryFn: fetchTimesheet,
  })

  if (isLoading) return <div className="p-8">Caricamento timesheet...</div>
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
            <h2 className='text-2xl font-bold tracking-tight'>Timesheet</h2>
            <p className='text-muted-foreground'>
              Gestisci i timesheet.
            </p>
          </div>
          <TimesheetPrimaryButtons />
        </div>
        <TimesheetTable 
          data={timesheet || []} 
          search={search}
          navigate={navigate}
        />
      </Main>

      <TimesheetDialogs />
    </>
  )
}

export function Timesheet() {
  return (
    <TimesheetProvider>
      <TimesheetContent />
    </TimesheetProvider>
  )
}
