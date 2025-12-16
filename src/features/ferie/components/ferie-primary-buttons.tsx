import { FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFerie } from './ferie-provider'

export function FeriePrimaryButtons() {
  const { setOpen } = useFerie()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Nuove Ferie</span> <FilePlus size={18} />
      </Button>
    </div>
  )
}

