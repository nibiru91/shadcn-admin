import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAziende } from './aziende-provider'

export function AziendePrimaryButtons() {
  const { setOpen } = useAziende()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Aggiungi Azienda</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
