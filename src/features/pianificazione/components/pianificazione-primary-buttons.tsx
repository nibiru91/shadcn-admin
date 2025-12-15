import { FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePianificazione } from './pianificazione-provider'

export function PianificazionePrimaryButtons() {
  const { setOpen } = usePianificazione()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Nuova Pianificazione</span> <FilePlus size={18} />
      </Button>
    </div>
  )
}

