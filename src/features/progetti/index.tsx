import { useEffect, lazy, Suspense } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { useProgettiStore } from './components/progetti-provider'
import { ProgettiHeader } from './components/progetti-header'
import { TaskModal } from './components/task-modal'

// Lazy load GanttChart to avoid blocking the route
const GanttChart = lazy(() => import('./components/gantt-chart').then(module => ({ default: module.GanttChart })))

export function Progetti() {
  const loadTasks = useProgettiStore((state) => state.loadTasks)

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

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
        <ProgettiHeader />
        <div className='flex-1 rounded-lg border bg-card p-4 flex flex-col min-h-0'>
          <Suspense fallback={<div className='flex h-full items-center justify-center'>Caricamento Gantt Chart...</div>}>
            <GanttChart />
          </Suspense>
        </div>
      </Main>

      <TaskModal />
    </>
  )
}

