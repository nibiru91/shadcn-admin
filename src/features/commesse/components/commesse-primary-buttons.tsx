import { FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCommesse } from './commesse-provider'

export function CommessePrimaryButtons() {
  const { setOpen } = useCommesse()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Nuova Commessa</span> <FilePlus size={18} />
      </Button>
    </div>
  )
}

