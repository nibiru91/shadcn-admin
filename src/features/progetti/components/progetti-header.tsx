import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { useProgettiStore } from './progetti-provider'

export function ProgettiHeader() {
  const openCreateModal = useProgettiStore((state) => state.openCreateModal)

  return (
    <div className='flex items-center justify-between'>
      <div>
        <h2 className='text-2xl font-bold tracking-tight'>Progetti</h2>
        <p className='text-muted-foreground'>
          Gestisci i tuoi progetti e task con il GanttChart interattivo
        </p>
      </div>
      <Button onClick={openCreateModal}>
        <Plus className='mr-2 h-4 w-4' />
        Nuovo Task
      </Button>
    </div>
  )
}

