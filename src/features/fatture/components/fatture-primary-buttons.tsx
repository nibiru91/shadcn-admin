import { FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFatture } from './fatture-provider'

export function FatturePrimaryButtons() {
  const { setOpen } = useFatture()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => {
        // Non fa nulla per ora
      }}>
        <span>Nuova Fattura</span> <FilePlus size={18} />
      </Button>
    </div>
  )
}

