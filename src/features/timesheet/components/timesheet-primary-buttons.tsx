import { FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTimesheet } from './timesheet-provider'

export function TimesheetPrimaryButtons() {
  const { setOpen } = useTimesheet()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>Nuovo Timesheet</span> <FilePlus size={18} />
      </Button>
    </div>
  )
}

